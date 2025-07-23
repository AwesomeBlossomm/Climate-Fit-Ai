from fastapi import APIRouter, HTTPException, Depends
from connection.database import payments_collection, users_collection, discounts_collection
from models.payment import (
    PaymentCreate, PaymentUpdate, Payment, PaymentResponse, 
    PaymentStatus, PaymentMethod, Currency
)
from routes.auth import verify_token, verify_admin
from datetime import datetime
from bson import ObjectId
import uuid
import random
from typing import List, Dict, Any

router = APIRouter()

def generate_payment_id() -> str:
    """Generate a unique payment ID"""
    return f"PAY_{uuid.uuid4().hex[:12].upper()}"

def generate_transaction_id() -> str:
    """Generate a unique transaction ID"""
    return f"TXN_{uuid.uuid4().hex[:16].upper()}"

def calculate_tax(subtotal: float, tax_rate: float = 0.12) -> float:
    """Calculate tax amount (default 12% VAT)"""
    return round(subtotal * tax_rate, 2)

def calculate_shipping(subtotal: float, shipping_rate: float = 0.05) -> float:
    """Calculate shipping amount (default 5% of subtotal, max $50)"""
    shipping = round(subtotal * shipping_rate, 2)
    return min(shipping, 50.0)

def serialize_payment(payment_doc):
    """Convert MongoDB document to JSON serializable format"""
    if payment_doc:
        payment_doc["_id"] = str(payment_doc["_id"])
        if "created_at" in payment_doc:
            payment_doc["created_at"] = payment_doc["created_at"].isoformat()
        if "updated_at" in payment_doc and payment_doc["updated_at"]:
            payment_doc["updated_at"] = payment_doc["updated_at"].isoformat()
        if "completed_at" in payment_doc and payment_doc["completed_at"]:
            payment_doc["completed_at"] = payment_doc["completed_at"].isoformat()
    return payment_doc

async def apply_discount_to_payment(discount_code: str, subtotal: float, username: str) -> tuple[float, str, dict]:
    """Apply discount code and return discount amount, description, and discount info"""
    if not discount_code:
        return 0.0, "", {}
    
    # First check for user-assigned discounts
    user_discount = discounts_collection.find_one({
        "code": discount_code.upper(),
        "is_active": True,
        "user_assignments.username": username,
        "user_assignments.is_used": False
    })
    
    if user_discount:
        # Find the specific assignment for this user
        user_assignment = None
        for assignment in user_discount.get("user_assignments", []):
            if assignment["username"] == username and not assignment["is_used"]:
                user_assignment = assignment
                break
        
        if user_assignment:
            # Check if discount has expired
            if user_discount.get("expires_at") and user_discount["expires_at"] < datetime.utcnow():
                raise HTTPException(status_code=400, detail="Discount code has expired")
            
            discount_amount = (subtotal * user_discount["percentage"]) / 100
            return round(discount_amount, 2), user_discount["description"], {
                "type": "user_assigned",
                "discount_id": str(user_discount["_id"]),
                "assignment": user_assignment
            }
    
    # Check for general public discounts
    discount = discounts_collection.find_one({
        "code": discount_code.upper(),
        "is_active": True
    })
    
    if not discount:
        raise HTTPException(status_code=400, detail="Invalid discount code")
    
    if discount.get("expires_at") and discount["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Discount code has expired")
    
    if discount.get("usage_limit") and discount.get("used_count", 0) >= discount["usage_limit"]:
        raise HTTPException(status_code=400, detail="Discount usage limit exceeded")
    
    discount_amount = (subtotal * discount["percentage"]) / 100
    return round(discount_amount, 2), discount["description"], {
        "type": "public",
        "discount_id": str(discount["_id"])
    }

def simulate_payment_processing(payment_method: PaymentMethod):
    """Simulate payment processing with different providers"""
    # Simulate processing time
    import time
    import random
    
    time.sleep(1)  # Simulate processing delay
    
    # 95% success rate for simulation
    success = random.random() < 0.95
    
    if success:
        transaction_id = generate_transaction_id()
        return {
            "status": "success",
            "transaction_id": transaction_id,
            "provider_response": {
                "payment_method": payment_method,
                "processed_at": datetime.utcnow().isoformat(),
                "provider_transaction_id": transaction_id,
                "provider_status": "completed"
            }
        }
    else:
        return {
            "status": "failed",
            "transaction_id": None,
            "provider_response": {
                "payment_method": payment_method,
                "processed_at": datetime.utcnow().isoformat(),
                "error_code": "PAYMENT_DECLINED",
                "error_message": "Payment was declined by the provider"
            }
        }

@router.post("/create-payment", response_model=PaymentResponse)
async def create_payment(payment_data: PaymentCreate, current_user: str = Depends(verify_token)):
    """Create a new payment transaction"""
    try:
        # Get user information
        user = users_collection.find_one({"username": current_user})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate amounts
        subtotal = sum(item.total_price for item in payment_data.items)
        
        # Apply discount if provided
        discount_amount = 0.0
        discount_description = ""
        discount_info = {}
        if payment_data.discount_code:
            discount_amount, discount_description, discount_info = await apply_discount_to_payment(
                payment_data.discount_code, subtotal, current_user
            )
        
        # Calculate tax and shipping
        discounted_subtotal = subtotal - discount_amount
        tax_amount = calculate_tax(discounted_subtotal)
        shipping_amount = calculate_shipping(discounted_subtotal)
        total_amount = discounted_subtotal + tax_amount + shipping_amount
        
        # Generate payment ID
        payment_id = generate_payment_id()
        
        # Create payment document
        payment_doc = {
            "payment_id": payment_id,
            "user_id": str(user["_id"]),
            "username": current_user,
            "items": [item.dict() for item in payment_data.items],
            "subtotal": round(subtotal, 2),
            "discount_amount": discount_amount,
            "tax_amount": tax_amount,
            "shipping_amount": shipping_amount,
            "total_amount": round(total_amount, 2),
            "currency": payment_data.currency,
            "payment_method": payment_data.payment_method,
            "payment_status": PaymentStatus.PENDING,
            "billing_address": payment_data.billing_address.dict(),
            "discount_code": payment_data.discount_code,
            "discount_info": discount_info,  # Store discount type and details
            "created_at": datetime.utcnow(),
            "updated_at": None,
            "completed_at": None,
            "transaction_id": None,
            "payment_details": {},
            "notes": payment_data.notes
        }
        
        # Insert payment
        result = payments_collection.insert_one(payment_doc)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create payment")
        
        return PaymentResponse(
            payment_id=payment_id,
            status=PaymentStatus.PENDING,
            total_amount=round(total_amount, 2),
            currency=payment_data.currency,
            payment_method=payment_data.payment_method,
            created_at=payment_doc["created_at"].isoformat(),
            message="Payment created successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment: {str(e)}")

@router.post("/process-payment/{payment_id}")
async def process_payment(payment_id: str, current_user: str = Depends(verify_token)):
    """Process a pending payment"""
    try:
        # Find the payment
        payment = payments_collection.find_one({
            "payment_id": payment_id,
            "username": current_user,
            "payment_status": PaymentStatus.PENDING
        })
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found or already processed")
        
        # Update status to processing
        payments_collection.update_one(
            {"payment_id": payment_id},
            {
                "$set": {
                    "payment_status": PaymentStatus.PROCESSING,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Simulate payment processing
        payment_result = simulate_payment_processing(PaymentMethod(payment["payment_method"]))
        
        if payment_result["status"] == "success":
            # Payment successful
            update_data = {
                "payment_status": PaymentStatus.COMPLETED,
                "transaction_id": payment_result["transaction_id"],
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "payment_details": payment_result["provider_response"]
            }
            
            # Handle discount usage based on type
            if payment.get("discount_code") and payment.get("discount_info"):
                discount_info = payment["discount_info"]
                
                if discount_info.get("type") == "user_assigned":
                    # Mark user-assigned discount as used
                    discounts_collection.update_one(
                        {
                            "_id": ObjectId(discount_info["discount_id"]),
                            "user_assignments.username": current_user,
                            "user_assignments.discount_code": payment["discount_code"].upper()
                        },
                        {
                            "$set": {
                                "user_assignments.$.is_used": True,
                                "user_assignments.$.used_at": datetime.utcnow()
                            }
                        }
                    )
                elif discount_info.get("type") == "public":
                    # Increment usage count for public discount
                    discounts_collection.update_one(
                        {"_id": ObjectId(discount_info["discount_id"])},
                        {"$inc": {"used_count": 1}}
                    )
        else:
            # Payment failed
            update_data = {
                "payment_status": PaymentStatus.FAILED,
                "updated_at": datetime.utcnow(),
                "payment_details": payment_result["provider_response"]
            }
        
        # Update payment
        payments_collection.update_one(
            {"payment_id": payment_id},
            {"$set": update_data}
        )
        
        # Get updated payment
        updated_payment = payments_collection.find_one({"payment_id": payment_id})
        
        return {
            "payment_id": payment_id,
            "status": updated_payment["payment_status"],
            "transaction_id": updated_payment.get("transaction_id"),
            "total_amount": updated_payment["total_amount"],
            "currency": updated_payment["currency"],
            "message": "Payment processed successfully" if payment_result["status"] == "success" else "Payment processing failed",
            "details": updated_payment.get("payment_details", {})
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process payment: {str(e)}")

@router.get("/payments")
async def get_user_payments(current_user: str = Depends(verify_token)):
    """Get all payments for the current user, sorted by newest first"""
    try:
        payments = list(payments_collection.find(
            {"username": current_user}
        ).sort("created_at", -1))  # Sort by newest first
        
        return {
            "count": len(payments),
            "payments": [serialize_payment(payment) for payment in payments]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payments: {str(e)}")

@router.get("/payments/{payment_id}")
async def get_payment_details(payment_id: str, current_user: str = Depends(verify_token)):
    """Get details of a specific payment"""
    try:
        payment = payments_collection.find_one({
            "payment_id": payment_id,
            "username": current_user
        })
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return serialize_payment(payment)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment details: {str(e)}")

@router.post("/cancel-payment/{payment_id}")
async def cancel_payment(payment_id: str, current_user: str = Depends(verify_token)):
    """Cancel a pending payment"""
    try:
        result = payments_collection.update_one(
            {
                "payment_id": payment_id,
                "username": current_user,
                "payment_status": {"$in": [PaymentStatus.PENDING, PaymentStatus.PROCESSING]}
            },
            {
                "$set": {
                    "payment_status": PaymentStatus.CANCELLED,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Payment not found or cannot be cancelled")
        
        return {"message": "Payment cancelled successfully", "payment_id": payment_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel payment: {str(e)}")

@router.get("/admin/payments")
async def get_all_payments(admin_user: str = Depends(verify_admin)):
    """Admin function to get all payments"""
    try:
        payments = list(payments_collection.find({}).sort("created_at", -1))
        
        return {
            "count": len(payments),
            "payments": [serialize_payment(payment) for payment in payments]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch all payments: {str(e)}")

@router.post("/admin/refund-payment/{payment_id}")
async def refund_payment(payment_id: str, admin_user: str = Depends(verify_admin)):
    """Admin function to refund a completed payment"""
    try:
        result = payments_collection.update_one(
            {
                "payment_id": payment_id,
                "payment_status": PaymentStatus.COMPLETED
            },
            {
                "$set": {
                    "payment_status": PaymentStatus.REFUNDED,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Payment not found or cannot be refunded")
        
        return {"message": "Payment refunded successfully", "payment_id": payment_id, "refunded_by": admin_user}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refund payment: {str(e)}")

@router.get("/payment-stats")
async def get_payment_statistics(current_user: str = Depends(verify_token)):
    """Get payment statistics for the current user"""
    try:
        pipeline = [
            {"$match": {"username": current_user}},
            {
                "$group": {
                    "_id": "$payment_status",
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": "$total_amount"}
                }
            }
        ]
        
        stats = list(payments_collection.aggregate(pipeline))
        
        return {
            "user": current_user,
            "statistics": stats
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment statistics: {str(e)}")
