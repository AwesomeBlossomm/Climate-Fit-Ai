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
async def generate_random_discounts(current_user: str = Depends(verify_token)):
    """Generate 40 random discount codes with percentages from 5% to 50%"""
    try:
        # Clear existing discounts (optional)
        # discounts_collection.delete_many({})
        
        valid_percentages = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
        
        # Enhanced discount types with detailed descriptions
        discount_templates = [
            {
                "type": "Summer Sale",
                "description": "Beat the heat with summer savings",
                "detailed": "Get amazing discounts on summer collection including light fabrics, swimwear, and casual outfits. Perfect for vacation and beach activities."
            },
            {
                "type": "Winter Clearance",
                "description": "Warm up with winter deals",
                "detailed": "Stay cozy with discounts on winter essentials including jackets, sweaters, boots, and thermal wear. Limited time clearance sale."
            },
            {
                "type": "Flash Sale",
                "description": "Lightning fast savings",
                "detailed": "Limited time flash sale with incredible discounts. Grab your favorite items before they're gone. Sale ends in 24 hours!"
            },
            {
                "type": "Weekend Special",
                "description": "Weekend warrior discounts",
                "detailed": "Special weekend deals for casual and weekend wear. Perfect for relaxed outings and comfortable home attire."
            },
            {
                "type": "New Customer",
                "description": "Welcome bonus for new shoppers",
                "detailed": "Exclusive discount for first-time customers. Start your fashion journey with us and enjoy special savings on your first purchase."
            },
            {
                "type": "VIP Member",
                "description": "Exclusive VIP member benefits",
                "detailed": "Premium discounts for our valued VIP members. Enjoy exclusive access to designer collections and luxury items."
            },
            {
                "type": "Holiday Special",
                "description": "Celebrate with holiday savings",
                "detailed": "Festive discounts for holiday shopping. Perfect for gifts, party wear, and special occasion outfits."
            },
            {
                "type": "Back to School",
                "description": "Gear up for the new semester",
                "detailed": "Student-friendly discounts on casual wear, backpacks, and everyday essentials. Start the school year in style."
            },
            {
                "type": "Black Friday",
                "description": "Black Friday mega deals",
                "detailed": "Biggest savings of the year! Massive discounts across all categories including designer brands and premium collections."
            },
            {
                "type": "Cyber Monday",
                "description": "Digital deals extravaganza",
                "detailed": "Online exclusive discounts for tech-savvy shoppers. Special pricing on trending fashion and accessories."
            },
            {
                "type": "Mother's Day",
                "description": "Celebrate mom with special savings",
                "detailed": "Honor the special women in your life with discounts on elegant wear, accessories, and gift sets perfect for mothers."
            },
            {
                "type": "Father's Day",
                "description": "Dad deserves the best deals",
                "detailed": "Show appreciation for fathers with discounts on men's fashion, accessories, and classic wardrobe essentials."
            },
            {
                "type": "Easter Sale",
                "description": "Spring into savings this Easter",
                "detailed": "Fresh spring discounts on colorful outfits, pastels, and seasonal fashion perfect for Easter celebrations."
            },
            {
                "type": "Spring Collection",
                "description": "Bloom with spring fashion",
                "detailed": "Refresh your wardrobe with spring essentials. Discounts on light fabrics, floral patterns, and fresh seasonal styles."
            },
            {
                "type": "Fall Fashion",
                "description": "Autumn style at its finest",
                "detailed": "Embrace fall fashion with discounts on layering pieces, warm colors, and transitional wear for the season."
            },
            {
                "type": "Student Discount",
                "description": "Student budget-friendly deals",
                "detailed": "Special pricing for students on trendy and affordable fashion. Valid with student ID verification."
            },
            {
                "type": "Senior Discount",
                "description": "Respectful savings for seniors",
                "detailed": "Exclusive discounts for senior customers on comfortable and classic fashion choices. Age 60+ eligible."
            },
            {
                "type": "First Purchase",
                "description": "First-time buyer special",
                "detailed": "Welcome discount for new customers making their first purchase. Start your fashion journey with instant savings."
            },
            {
                "type": "Loyalty Reward",
                "description": "Thank you for your loyalty",
                "detailed": "Reward points converted to instant savings. Exclusive discount for our most loyal and frequent customers."
            }
        ]
        
        discounts_created = []
        
        for i in range(40):
            # Generate random discount code
            code = generate_discount_code()
            
            # Ensure unique code
            while discounts_collection.find_one({"code": code}):
                code = generate_discount_code()
            
            # Random percentage from valid options
            percentage = random.choice(valid_percentages)
            
            # Random discount template
            template = random.choice(discount_templates)
            
            # Create comprehensive description
            short_description = f"{template['type']} - {percentage}% off"
            detailed_description = f"{template['description']} - {percentage}% discount. {template['detailed']}"
            
            # Random expiry date (30 to 90 days from now)
            expires_days = random.randint(30, 90)
            expires_at = datetime.utcnow() + timedelta(days=expires_days)
            
            # Random usage limit
            usage_limit = random.choice([None, 50, 100, 200, 500])
            
            discount_data = {
                "code": code,
                "percentage": percentage,
                "description": short_description,
                "detailed_description": detailed_description,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "expires_at": expires_at,
                "usage_limit": usage_limit,
                "used_count": 0
            }
            
            result = discounts_collection.insert_one(discount_data)
            if result.inserted_id:
                discount_data["_id"] = str(result.inserted_id)
                discounts_created.append(serialize_discount(discount_data))
        
        return {
            "message": f"Successfully created {len(discounts_created)} discount codes",
            "discounts": discounts_created
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate discounts: {str(e)}")

@router.get("/discounts")
async def get_all_discounts(current_user: str = Depends(verify_token)):
    """Get all available discounts"""
    try:
        discounts = list(discounts_collection.find({"is_active": True}))
        return {
            "count": len(discounts),
            "discounts": [serialize_discount(discount) for discount in discounts]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch discounts: {str(e)}")

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

