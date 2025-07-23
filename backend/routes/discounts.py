from fastapi import APIRouter, HTTPException, Depends
from connection.database import discounts_collection, users_collection
from models.discount import Discount, DiscountCreate, DiscountApply
from models.user import UserDiscountAssignment
from routes.auth import verify_token, verify_admin
from datetime import datetime, timedelta
from bson import ObjectId
import random
import string
from typing import List

router = APIRouter()

def generate_discount_code(length: int = 8) -> str:
    """Generate a random discount code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def serialize_discount(discount_doc):
    """Convert MongoDB document to JSON serializable format"""
    if discount_doc:
        discount_doc["_id"] = str(discount_doc["_id"])
        if "created_at" in discount_doc:
            discount_doc["created_at"] = discount_doc["created_at"].isoformat()
        if "expires_at" in discount_doc and discount_doc["expires_at"]:
            discount_doc["expires_at"] = discount_doc["expires_at"].isoformat()
    return discount_doc

@router.post("/generate-discounts")
async def generate_random_discounts():
    """Generate 20 random discount codes with percentages from 5% to 50% and assign to all users"""
    try:
        # Get all existing users
        all_users = list(users_collection.find({}, {"username": 1}))
        
        valid_percentages = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
        
        # Enhanced discount types with voucher categories
        clothes_templates = [
            {
                "type": "Summer Sale",
                "description": "Beat the heat with summer savings",
                "detailed": "Get amazing discounts on summer collection including light fabrics, swimwear, and casual outfits."
            },
            {
                "type": "Winter Clearance", 
                "description": "Warm up with winter deals",
                "detailed": "Stay cozy with discounts on winter essentials including jackets, sweaters, boots, and thermal wear."
            },
            {
                "type": "Flash Sale",
                "description": "Lightning fast clothing savings",
                "detailed": "Limited time flash sale on trending fashion items. Grab your favorite clothes before they're gone!"
            },
            {
                "type": "New Arrival",
                "description": "Fresh fashion discounts", 
                "detailed": "Be the first to wear the latest fashion trends with special discounts on new arrivals."
            }
        ]
        
        shipping_templates = [
            {
                "type": "Free Shipping",
                "description": "Free delivery on your order",
                "detailed": "Enjoy free shipping on your clothing purchases. No minimum order required."
            },
            {
                "type": "Express Delivery",
                "description": "Discounted express shipping",
                "detailed": "Get your fashion items faster with discounted express delivery options."
            },
            {
                "type": "Shipping Special",
                "description": "Special shipping discount",
                "detailed": "Save on shipping costs for your fashion purchases with this special voucher."
            }
        ]
        
        discounts_created = []
        total_assignments = 0
        
        # Generate exactly 20 vouchers
        for i in range(20):
            code = generate_discount_code()
            while discounts_collection.find_one({"code": code}):
                code = generate_discount_code()
            
            percentage = random.choice(valid_percentages)
            
            # 70% clothes vouchers (14), 30% shipping vouchers (6)
            voucher_type = "clothes" if i < 14 else "shipping"
            templates = clothes_templates if voucher_type == "clothes" else shipping_templates
            template = random.choice(templates)
            
            short_description = f"{template['type']} - {percentage}% off"
            detailed_description = f"{template['description']} - {percentage}% discount. {template['detailed']}"
            
            expires_days = random.randint(30, 90)
            expires_at = datetime.utcnow() + timedelta(days=expires_days)
            usage_limit = random.choice([None, 50, 100, 200, 500])
            
            # Create user assignments for all existing users
            user_assignments = []
            for user in all_users:
                user_assignment = {
                    "username": user["username"],
                    "discount_code": code,
                    "collected_at": datetime.utcnow(),
                    "assigned_at": datetime.utcnow(),
                    "assigned_by": "system_auto_assign",
                    "is_used": False,
                    "used_at": None,
                    "assignment_type": "global_distribution"
                }
                user_assignments.append(user_assignment)
                total_assignments += 1
            
            discount_data = {
                "code": code,
                "percentage": percentage,
                "description": short_description,
                "detailed_description": detailed_description,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "expires_at": expires_at,
                "usage_limit": usage_limit,
                "used_count": 0,
                "voucher_type": voucher_type,
                "user_assignments": user_assignments
            }
            
            result = discounts_collection.insert_one(discount_data)
            if result.inserted_id:
                discount_data["_id"] = str(result.inserted_id)
                discounts_created.append(serialize_discount(discount_data))
        
        return {
            "message": f"Successfully created {len(discounts_created)} discount codes and assigned to {len(all_users)} users",
            "discounts_created": len(discounts_created),
            "total_users": len(all_users),
            "total_assignments": total_assignments,
            "discounts": discounts_created
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate and assign discounts: {str(e)}")

@router.post("/collect-voucher")
async def collect_voucher(voucher_data: dict, current_user: str = Depends(verify_token)):
    """Collect a voucher and add it to user's collection"""
    try:
        voucher_id = voucher_data.get("voucher_id")
        if not voucher_id:
            raise HTTPException(status_code=400, detail="Voucher ID is required")
        
        # Find the voucher
        voucher = discounts_collection.find_one({
            "_id": ObjectId(voucher_id),
            "is_active": True
        })
        
        if not voucher:
            raise HTTPException(status_code=404, detail="Voucher not found or inactive")
        
        # Check if user already collected this voucher
        existing_assignment = discounts_collection.find_one({
            "_id": ObjectId(voucher_id),
            "user_assignments.username": current_user
        })
        
        if existing_assignment:
            raise HTTPException(status_code=400, detail="You have already collected this voucher")
        
        # Check if voucher has expired
        if voucher.get("expires_at") and voucher["expires_at"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="This voucher has expired")
        
        # Add user assignment
        user_assignment = {
            "username": current_user,
            "discount_code": voucher["code"],
            "collected_at": datetime.utcnow(),
            "is_used": False,
            "used_at": None
        }
        
        discounts_collection.update_one(
            {"_id": ObjectId(voucher_id)},
            {"$push": {"user_assignments": user_assignment}}
        )
        
        return {
            "message": f"Voucher {voucher['code']} collected successfully!",
            "voucher": {
                "code": voucher["code"],
                "percentage": voucher["percentage"],
                "description": voucher["description"],
                "voucher_type": voucher.get("voucher_type", "clothes")
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to collect voucher: {str(e)}")

@router.post("/collect-all-vouchers")
async def collect_all_vouchers(current_user: str = Depends(verify_token)):
    """Collect all available vouchers for the user"""
    try:
        # Find all active vouchers that user hasn't collected yet
        available_vouchers = list(discounts_collection.find({
            "is_active": True,
            "expires_at": {"$gt": datetime.utcnow()},
            "user_assignments.username": {"$ne": current_user}
        }))
        
        collected_count = 0
        collected_vouchers = []
        
        for voucher in available_vouchers:
            # Check if user already has this voucher (double check)
            has_voucher = any(
                assignment.get("username") == current_user 
                for assignment in voucher.get("user_assignments", [])
            )
            
            if not has_voucher:
                user_assignment = {
                    "username": current_user,
                    "discount_code": voucher["code"],
                    "collected_at": datetime.utcnow(),
                    "is_used": False,
                    "used_at": None
                }
                
                discounts_collection.update_one(
                    {"_id": voucher["_id"]},
                    {"$push": {"user_assignments": user_assignment}}
                )
                
                collected_count += 1
                collected_vouchers.append({
                    "code": voucher["code"],
                    "percentage": voucher["percentage"],
                    "description": voucher["description"],
                    "voucher_type": voucher.get("voucher_type", "clothes")
                })
        
        return {
            "message": f"Successfully collected {collected_count} vouchers!",
            "collected_count": collected_count,
            "vouchers": collected_vouchers
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to collect all vouchers: {str(e)}")

@router.get("/available-vouchers")
async def get_available_vouchers(current_user: str = Depends(verify_token)):
    """Get all vouchers available for collection (not yet collected by user)"""
    try:
        # Find all active vouchers
        all_vouchers = list(discounts_collection.find({
            "is_active": True,
            "expires_at": {"$gt": datetime.utcnow()}
        }))
        
        available_vouchers = []
        
        for voucher in all_vouchers:
            # Check if user has already collected this voucher
            user_has_voucher = any(
                assignment.get("username") == current_user 
                for assignment in voucher.get("user_assignments", [])
            )
            
            if not user_has_voucher:
                available_vouchers.append({
                    "_id": str(voucher["_id"]),
                    "code": voucher["code"],
                    "percentage": voucher["percentage"],
                    "description": voucher["description"],
                    "detailed_description": voucher.get("detailed_description"),
                    "expires_at": voucher["expires_at"].isoformat(),
                    "usage_limit": voucher.get("usage_limit"),
                    "used_count": voucher.get("used_count", 0),
                    "voucher_type": voucher.get("voucher_type", "clothes")
                })
        
        # Separate by type
        clothes_vouchers = [v for v in available_vouchers if v["voucher_type"] == "clothes"]
        shipping_vouchers = [v for v in available_vouchers if v["voucher_type"] == "shipping"]
        
        return {
            "total_available": len(available_vouchers),
            "clothes_vouchers": clothes_vouchers,
            "shipping_vouchers": shipping_vouchers,
            "all_vouchers": available_vouchers
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch available vouchers: {str(e)}")

@router.post("/apply-discount")
async def apply_discount(discount_apply: DiscountApply, current_user: str = Depends(verify_token)):
    """Apply a discount code to calculate discounted amount"""
    try:
        # Find the discount code
        discount = discounts_collection.find_one({
            "code": discount_apply.code.upper(),
            "is_active": True
        })
        
        if not discount:
            raise HTTPException(status_code=404, detail="Invalid or inactive discount code")
        
        # Check if discount has expired
        if discount.get("expires_at") and discount["expires_at"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Discount code has expired")
        
        # Check usage limit
        if discount.get("usage_limit") and discount.get("used_count", 0) >= discount["usage_limit"]:
            raise HTTPException(status_code=400, detail="Discount code usage limit exceeded")
        
        # Calculate discounted amount
        discount_amount = (discount_apply.total_amount * discount["percentage"]) / 100
        final_amount = discount_apply.total_amount - discount_amount
        
        return {
            "original_amount": discount_apply.total_amount,
            "discount_percentage": discount["percentage"],
            "discount_amount": round(discount_amount, 2),
            "final_amount": round(final_amount, 2),
            "discount_code": discount["code"],
            "description": discount["description"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply discount: {str(e)}")

@router.post("/use-discount/{code}")
async def use_discount(code: str, current_user: str = Depends(verify_token)):
    """Mark a discount as used (increment usage count)"""
    try:
        result = discounts_collection.update_one(
            {"code": code.upper(), "is_active": True},
            {"$inc": {"used_count": 1}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Discount code not found")
        
        # Get updated discount
        updated_discount = discounts_collection.find_one({"code": code.upper()})
        
        return {
            "message": "Discount used successfully",
            "discount": serialize_discount(updated_discount)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to use discount: {str(e)}")

@router.delete("/discounts/{discount_id}")
async def delete_discount(discount_id: str, current_user: str = Depends(verify_token)):
    """Delete a discount (admin function)"""
    try:
        result = discounts_collection.delete_one({"_id": ObjectId(discount_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Discount not found")
        
        return {"message": "Discount deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete discount: {str(e)}")

@router.post("/admin/assign-discount")
async def assign_discount_to_user(assignment: UserDiscountAssignment, admin_user: str = Depends(verify_admin)):
    """Admin function to assign a discount code to a specific user"""
    try:
        # Check if the target user exists
        target_user = users_collection.find_one({"username": assignment.username})
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")
        
        # Check if the discount code exists and is active
        discount = discounts_collection.find_one({
            "code": assignment.discount_code.upper(),
            "is_active": True
        })
        if not discount:
            raise HTTPException(status_code=404, detail="Discount code not found or inactive")
        
        # Create user-specific discount assignment
        user_discount = {
            "user_id": str(target_user["_id"]),
            "username": assignment.username,
            "discount_id": str(discount["_id"]),
            "discount_code": assignment.discount_code.upper(),
            "assigned_by": admin_user,
            "assigned_at": datetime.utcnow(),
            "notes": assignment.notes,
            "is_used": False,
            "used_at": None
        }
        
        # Check if user already has this discount assigned
        existing_assignment = discounts_collection.find_one({
            "user_assignments.username": assignment.username,
            "user_assignments.discount_code": assignment.discount_code.upper()
        })
        
        if existing_assignment:
            raise HTTPException(status_code=400, detail="Discount already assigned to this user")
        
        # Add assignment to discount document
        discounts_collection.update_one(
            {"_id": discount["_id"]},
            {"$push": {"user_assignments": user_discount}}
        )
        
        return {
            "message": f"Discount {assignment.discount_code} successfully assigned to user {assignment.username}",
            "assignment": {
                "username": assignment.username,
                "discount_code": assignment.discount_code.upper(),
                "assigned_by": admin_user,
                "assigned_at": user_discount["assigned_at"].isoformat(),
                "notes": assignment.notes
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign discount: {str(e)}")

@router.get("/admin/user-discounts/{username}")
async def get_user_discounts(username: str, admin_user: str = Depends(verify_admin)):
    """Admin function to view all discounts assigned to a specific user"""
    try:
        # Check if user exists
        user = users_collection.find_one({"username": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find all discounts assigned to this user
        user_discounts = list(discounts_collection.find({
            "user_assignments.username": username
        }))
        
        assigned_discounts = []
        for discount in user_discounts:
            user_assignments = discount.get("user_assignments", [])
            for assignment in user_assignments:
                if assignment["username"] == username:
                    assigned_discounts.append({
                        "discount_code": assignment["discount_code"],
                        "percentage": discount["percentage"],
                        "description": discount["description"],
                        "assigned_by": assignment["assigned_by"],
                        "assigned_at": assignment["assigned_at"].isoformat(),
                        "is_used": assignment["is_used"],
                        "used_at": assignment["used_at"].isoformat() if assignment["used_at"] else None,
                        "notes": assignment.get("notes"),
                        "expires_at": discount["expires_at"].isoformat() if discount.get("expires_at") else None
                    })
        
        return {
            "username": username,
            "total_assigned": len(assigned_discounts),
            "discounts": assigned_discounts
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user discounts: {str(e)}")

@router.get("/my-discounts")
async def get_my_assigned_discounts(current_user: str = Depends(verify_token)):
    """Get all discounts assigned to the current user"""
    try:
        # Find all discounts assigned to this user
        user_discounts = list(discounts_collection.find({
            "user_assignments.username": current_user,
            "is_active": True
        }))
        
        my_discounts = []
        for discount in user_discounts:
            user_assignments = discount.get("user_assignments", [])
            for assignment in user_assignments:
                if assignment["username"] == current_user:
                    # Check if discount is still valid
                    is_expired = discount.get("expires_at") and discount["expires_at"] < datetime.utcnow()
                    
                    my_discounts.append({
                        "discount_code": assignment["discount_code"],
                        "percentage": discount["percentage"],
                        "description": discount["description"],
                        "assigned_at": assignment["assigned_at"].isoformat(),
                        "is_used": assignment["is_used"],
                        "used_at": assignment["used_at"].isoformat() if assignment["used_at"] else None,
                        "expires_at": discount["expires_at"].isoformat() if discount.get("expires_at") else None,
                        "is_expired": is_expired,
                        "voucher_type": discount.get("voucher_type"),
                        "notes": assignment.get("notes")
                    })
        
        return {
            "username": current_user,
            "total_discounts": len(my_discounts),
            "discounts": my_discounts
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch your discounts: {str(e)}")

@router.post("/apply-assigned-discount")
async def apply_assigned_discount(discount_apply: DiscountApply, current_user: str = Depends(verify_token)):
    """Apply a discount code that was specifically assigned to the current user"""
    try:
        # Find the discount with user assignment
        discount = discounts_collection.find_one({
            "code": discount_apply.code.upper(),
            "is_active": True,
            "user_assignments.username": current_user
        })
        
        if not discount:
            raise HTTPException(status_code=404, detail="Invalid discount code or not assigned to you")
        
        # Find the specific assignment for this user
        user_assignment = None
        for assignment in discount.get("user_assignments", []):
            if assignment["username"] == current_user:
                user_assignment = assignment
                break
        
        if not user_assignment:
            raise HTTPException(status_code=404, detail="Discount not assigned to you")
        
        # Check if already used
        if user_assignment["is_used"]:
            raise HTTPException(status_code=400, detail="This discount has already been used")
        
        # Check if discount has expired
        if discount.get("expires_at") and discount["expires_at"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Discount code has expired")
        
        # Calculate discounted amount
        discount_amount = (discount_apply.total_amount * discount["percentage"]) / 100
        final_amount = discount_apply.total_amount - discount_amount
        
        # Mark as used
        discounts_collection.update_one(
            {
                "_id": discount["_id"],
                "user_assignments.username": current_user,
                "user_assignments.discount_code": discount_apply.code.upper()
            },
            {
                "$set": {
                    "user_assignments.$.is_used": True,
                    "user_assignments.$.used_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "original_amount": discount_apply.total_amount,
            "discount_percentage": discount["percentage"],
            "discount_amount": round(discount_amount, 2),
            "final_amount": round(final_amount, 2),
            "discount_code": discount["code"],
            "description": discount["description"],
            "message": "Discount applied successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply assigned discount: {str(e)}")

@router.post("/auto-assign-vouchers/{username}")
async def auto_assign_vouchers(username: str):
    """Auto-assign 20 mixed vouchers to a user (called during first login only)"""
    try:
        # Check if user exists
        user = users_collection.find_one({"username": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user already has welcome vouchers assigned
        if user.get("welcome_vouchers_assigned", False):
            return {
                "message": f"User {username} has already received their welcome vouchers",
                "assigned_count": 0,
                "vouchers": []
            }
        
        # Check if user already has any vouchers assigned (extra safety check)
        existing_vouchers = list(discounts_collection.find({
            "user_assignments.username": username
        }))
        
        if existing_vouchers:
            return {
                "message": f"User {username} already has vouchers assigned",
                "existing_vouchers_count": len(existing_vouchers),
                "assigned_count": 0,
                "vouchers": []
            }
        
        # Generate 20 new vouchers for this user
        voucher_response = await generate_random_discounts()
        generated_vouchers = voucher_response["discounts"]
        
        # Auto-assign all generated vouchers to the user
        assigned_count = 0
        assigned_vouchers = []
        
        for voucher in generated_vouchers:
            user_assignment = {
                "username": username,
                "discount_code": voucher["code"],
                "collected_at": datetime.utcnow(),
                "assigned_at": datetime.utcnow(),
                "assigned_by": "system",
                "is_used": False,
                "used_at": None,
                "assignment_type": "welcome_bonus"
            }
            
            discounts_collection.update_one(
                {"_id": ObjectId(voucher["_id"])},
                {"$push": {"user_assignments": user_assignment}}
            )
            
            assigned_count += 1
            assigned_vouchers.append({
                "code": voucher["code"],
                "percentage": voucher["percentage"],
                "description": voucher["description"],
                "voucher_type": voucher.get("voucher_type", "clothes")
            })
        
        return {
            "message": f"Successfully auto-assigned {assigned_count} welcome vouchers to user {username}",
            "assigned_count": assigned_count,
            "vouchers": assigned_vouchers
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to auto-assign vouchers: {str(e)}")

