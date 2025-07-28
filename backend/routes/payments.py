from fastapi import APIRouter, HTTPException, Depends
from connection.database import payments_collection, users_collection, discounts_collection
from models.payment import (
    PaymentCreate, PaymentUpdate, Payment, PaymentResponse, 
    PaymentStatus, PaymentMethod, Currency, ShippingStatus
)
import os
from models.payment import ShippingStatus
from routes.auth import verify_token, verify_admin
from datetime import datetime
from bson import ObjectId
import uuid
import random
from typing import List, Dict, Any
from fastapi import Body, Request
from models.mongodb_models import MongoDBConnection, ProductModel
import logging

# Initialize MongoDB for product lookups
logger = logging.getLogger(__name__)

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
        print("Received payment data:", payment_data.dict())

        # Step 1: Fetch user
        user = users_collection.find_one({"username": current_user})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Step 2: Calculate subtotal
        subtotal = sum(item.total_price for item in payment_data.items)

        # Step 3: Apply discount(s)
        discount_amount = 0.0
        applied_codes = payment_data.discount_code or []
        discount_infos = []
        for code in applied_codes:
            amt, desc, info = await apply_discount_to_payment(code, subtotal, current_user)
            discount_amount += amt
            discount_infos.append({
                "code": code,
                "amount": amt,
                "description": desc,
                "info": info
            })

        # Step 4: Calculate final amounts
        discounted_subtotal = subtotal - discount_amount
        tax_amount = calculate_tax(discounted_subtotal)
        shipping_amount = calculate_shipping(discounted_subtotal)
        total_amount = discounted_subtotal + tax_amount + shipping_amount

        # Step 5: Generate payment ID
        payment_id = generate_payment_id()

        # Step 6: Build document
        payment_doc = {
            "payment_id": payment_id,
            "user_id": str(user["_id"]),
            "username": current_user,
            "items": [item.dict() for item in payment_data.items],
            "subtotal": round(subtotal, 2),
            "discount_amount": round(discount_amount, 2),
            "tax_amount": round(tax_amount, 2),
            "shipping_amount": round(shipping_amount, 2),
            "total_amount": round(total_amount, 2),
            "currency": payment_data.currency.value,
            "payment_method": payment_data.payment_method.value,
            "payment_status": PaymentStatus.PENDING.value,
            "shipping_status": ShippingStatus.PREPARING.value,  # Ensure shipping status is set
            "billing_address": payment_data.billing_address.dict(),
            "discount_code": applied_codes,
            "discount_info": discount_infos,
            "created_at": datetime.utcnow(),
            "updated_at": None,
            "completed_at": None,
            "transaction_id": None,
            "payment_details": {},
            "notes": payment_data.notes
        }

        # Step 7: Insert into database
        result = payments_collection.insert_one(payment_doc)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create payment")

        # Step 8: Return response
        return PaymentResponse(
            payment_id=payment_id,
            status=PaymentStatus.PENDING,
            total_amount=round(total_amount, 2),
            currency=payment_data.currency,
            payment_method=payment_data.payment_method,
            created_at=payment_doc["created_at"].isoformat(),
            message="Payment created successfully",
            billing_address=payment_data.billing_address
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

@router.put("/admin/update-payment-status/{payment_id}")
async def update_payment_status(payment_id: str, payload: PaymentUpdate):
    """
    Update the payment status of a specific payment.
    Admins can update the status, transaction ID, and payment details.
    """
    try:
        # Validate the status field if provided
        if payload.status and payload.status not in [s.value for s in PaymentStatus]:
            raise HTTPException(status_code=400, detail="Invalid payment status.")

        # Prepare the update data
        update_data = {"updated_at": datetime.utcnow()}
        if payload.status:
            update_data["payment_status"] = payload.status
        if payload.transaction_id:
            update_data["transaction_id"] = payload.transaction_id
        if payload.payment_details:
            update_data["payment_details"] = payload.payment_details

        # Update the payment in the database
        result = payments_collection.update_one(
            {"payment_id": payment_id},
            {"$set": update_data}
        )

        # Check if the update was successful
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Payment not found.")

        return {"success": True, "message": "Payment updated successfully.", "payment_id": payment_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update payment: {str(e)}")

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

@router.get("/payment-status-overview")
async def get_payment_status_overview(
    request: Request, 
    current_user: str = Depends(verify_token)
):
    """Get overview of all payment statuses with product details and shipping status"""
    try:
        # Initialize MongoDB connection for product lookups
        db_connection = MongoDBConnection()
        
        # Get all payments for the user
        payments = list(payments_collection.find({"username": current_user}))
        
        # Initialize status overview with shipping status
        status_overview = {
            "PENDING": {"count": 0, "total_amount": 0.0, "payments": []},
            "PROCESSING": {"count": 0, "total_amount": 0.0, "payments": []},
            "COMPLETED": {"count": 0, "total_amount": 0.0, "payments": []},
            "CANCELLED": {"count": 0, "total_amount": 0.0, "payments": []},
            "REFUNDED": {"count": 0, "total_amount": 0.0, "payments": []},
        }
        
        # Process each payment
        for payment in payments:
            status = payment["payment_status"].upper()
            if status in status_overview:
                # Fetch product details for each item
                items_with_details = []
                for item in payment.get("items", []):
                    product_details = await get_product_details(item["product_id"], db_connection)
                    
                    item_with_details = {
                        "product_id": item["product_id"],
                        "product_name": product_details["name"],
                        "product_image": process_product_image_url(product_details["image_path"], request),
                        "quantity": item["quantity"],
                        "unit_price": item["unit_price"],
                        "total_price": item["total_price"]
                    }
                    items_with_details.append(item_with_details)
                
                # Ensure shipping status exists, default to not_shipped if missing
                shipping_status = payment.get("shipping_status", ShippingStatus.NOT_SHIPPED.value)
                
                payment_info = {
                    "payment_id": payment["payment_id"],
                    "total_amount": payment["total_amount"],
                    "created_at": payment["created_at"].isoformat(),
                    "payment_method": payment["payment_method"],
                    "payment_status": payment["payment_status"],
                    "transaction_id": payment.get("transaction_id"),
                    "items": items_with_details,
                    "shipping_status": shipping_status,
                    "billing_address": payment.get("billing_address", {}),
                    "discount_amount": payment.get("discount_amount", 0.0),
                    "tax_amount": payment.get("tax_amount", 0.0),
                    "shipping_amount": payment.get("shipping_amount", 0.0)
                }
                
                status_overview[status]["count"] += 1
                status_overview[status]["total_amount"] += payment["total_amount"]
                status_overview[status]["payments"].append(payment_info)
        
        # Round total amounts
        for status in status_overview:
            status_overview[status]["total_amount"] = round(status_overview[status]["total_amount"], 2)
        
        # Close database connection
        db_connection.close()
        
        return {
            "user": current_user,
            "total_payments": len(payments),
            "status_breakdown": status_overview,
            "summary": {
                "pending": status_overview["PENDING"]["count"],
                "processing": status_overview["PROCESSING"]["count"],
                "completed": status_overview["COMPLETED"]["count"],
                "cancelled": status_overview["CANCELLED"]["count"],
                "refunded": status_overview["REFUNDED"]["count"]
            }
        }
    
    except Exception as e:
        logger.error(f"Error in payment status overview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment status overview: {str(e)}")

@router.put("/admin/update-shipping-status/{payment_id}")
async def update_shipping_status(payment_id: str, payload: dict = Body(...)):
    """
    Update the shipping status of a specific payment.
    Admins can update the shipping status.
    """
    try:
        # Extract and validate the shipping_status field
        shipping_status = payload.get("shipping_status")
        if not shipping_status or shipping_status not in [s.value for s in ShippingStatus]:
            raise HTTPException(status_code=400, detail="Invalid or missing shipping status.")

        # Prepare the update data
        update_data = {
            "shipping_status": shipping_status,
            "updated_at": datetime.utcnow()
        }

        # Update the shipping status in the database
        result = payments_collection.update_one(
            {"payment_id": payment_id},
            {"$set": update_data}
        )

        # Check if the update was successful
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Payment not found.")

        return {"success": True, "message": "Shipping status updated successfully.", "payment_id": payment_id, "new_shipping_status": shipping_status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating shipping status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update shipping status: {str(e)}")

@router.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to check if payments router is working"""
    return {"message": "Payments router is working", "available_routes": [
        "/payments",
        "/payments/{payment_id}",
        "/payment-status-overview",
        "/payments/all-shipping-statuses",
        "/payments/shipping-status/{shipping_status}",
        "/create-payment",
        "/process-payment/{payment_id}"
    ]}

async def get_product_details(product_id: str, db_connection):
    """Fetch product details including image, name, and price"""
    try:
        product_model = ProductModel(db_connection)
        product = await product_model.get_product_by_id(product_id)
        if product:
            return {
                "name": product.get("name", "Unknown Product"),
                "image_path": product.get("image_path", ""),
                "price_php": product.get("price_php", 0.0)
            }
    except Exception as e:
        logger.error(f"Error fetching product details for {product_id}: {str(e)}")
    
    return {
        "name": "Product Not Found",
        "image_path": "",
        "price_php": 0.0
    }

def process_product_image_url(image_path: str, request: Request) -> str:
    """Process product image URL to serve from backend"""
    if not image_path:
        return "https://via.placeholder.com/300x400?text=Fashion+Item"
    
    if image_path.startswith(("http://", "https://")):
        return image_path
    
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    filename = os.path.basename(image_path)
    
    if not filename:
        return "https://via.placeholder.com/300x400?text=Fashion+Item"
    
    return f"{base_url}/api/v1/serve-image/{filename}"

@router.get("/payments/shipping-status/{shipping_status}")
async def get_payments_by_shipping_status_v2(
    shipping_status: str,
    request: Request,
    current_user: str = Depends(verify_token)
):
    """Enhanced endpoint to get payments filtered by shipping status with product details"""
    try:
        # Validate shipping status
        valid_statuses = [status.value for status in ShippingStatus]
        if shipping_status not in valid_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid shipping status. Valid options: {valid_statuses}"
            )
        
        # Initialize MongoDB connection for product lookups
        db_connection = MongoDBConnection()
        
        # Query payments by shipping status for the current user
        payments = list(payments_collection.find({
            "username": current_user,
            "shipping_status": shipping_status
        }).sort("created_at", -1))
        
        # Process each payment to include product details
        processed_payments = []
        for payment in payments:
            # Fetch product details for each item
            items_with_details = []
            for item in payment.get("items", []):
                product_details = await get_product_details(item["product_id"], db_connection)
                
                item_with_details = {
                    "product_id": item["product_id"],
                    "product_name": product_details["name"],
                    "product_image": process_product_image_url(product_details["image_path"], request),
                    "quantity": item["quantity"],
                    "unit_price": item["unit_price"],
                    "total_price": item["total_price"]
                }
                items_with_details.append(item_with_details)
            
            # Serialize payment and add product details
            serialized_payment = serialize_payment(payment.copy())
            serialized_payment["items"] = items_with_details
            processed_payments.append(serialized_payment)
        
        # Close database connection
        db_connection.close()
        
        return {
            "success": True,
            "shipping_status": shipping_status,
            "count": len(processed_payments),
            "payments": processed_payments,
            "user": current_user
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payments by shipping status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch payments: {str(e)}")

@router.get("/payments/all-shipping-statuses")
async def get_all_shipping_status_payments(
    request: Request,
    current_user: str = Depends(verify_token)
):
    """Get all payments grouped by shipping status for the current user"""
    try:
        logger.info(f"Fetching all shipping status payments for user: {current_user}")
        
        # Initialize MongoDB connection for product lookups
        try:
            db_connection = MongoDBConnection()
        except Exception as db_error:
            logger.error(f"Failed to connect to database: {str(db_error)}")
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        shipping_data = {}
        
        # Fetch payments for each shipping status
        for status in ShippingStatus:
            try:
                logger.info(f"Processing shipping status: {status.value}")
                
                # Find payments with specific shipping status, including null/missing values for not_shipped
                if status == ShippingStatus.NOT_SHIPPED:
                    query = {
                        "username": current_user,
                        "$or": [
                            {"shipping_status": status.value},
                            {"shipping_status": {"$exists": False}},
                            {"shipping_status": None}
                        ]
                    }
                else:
                    query = {
                        "username": current_user,
                        "shipping_status": status.value
                    }
                
                payments = list(payments_collection.find(query).sort("created_at", -1))
                logger.info(f"Found {len(payments)} payments for status {status.value}")
                
                # Process each payment to include product details
                processed_payments = []
                for payment in payments:
                    try:
                        # Fetch product details for each item
                        items_with_details = []
                        for item in payment.get("items", []):
                            try:
                                product_details = await get_product_details(item["product_id"], db_connection)
                                
                                item_with_details = {
                                    "product_id": item["product_id"],
                                    "product_name": product_details["name"],
                                    "product_image": process_product_image_url(product_details["image_path"], request),
                                    "quantity": item["quantity"],
                                    "unit_price": item["unit_price"],
                                    "total_price": item["total_price"]
                                }
                                items_with_details.append(item_with_details)
                            except Exception as item_error:
                                logger.error(f"Error processing item {item.get('product_id')}: {str(item_error)}")
                                # Add item with basic info if product details fail
                                items_with_details.append({
                                    "product_id": item.get("product_id", "unknown"),
                                    "product_name": item.get("product_name", "Unknown Product"),
                                    "product_image": "https://via.placeholder.com/300x400?text=Fashion+Item",
                                    "quantity": item.get("quantity", 1),
                                    "unit_price": item.get("unit_price", 0),
                                    "total_price": item.get("total_price", 0)
                                })
                        
                        # Serialize payment and add product details
                        serialized_payment = serialize_payment(payment.copy())
                        serialized_payment["items"] = items_with_details
                        # Ensure shipping_status is set
                        serialized_payment["shipping_status"] = payment.get("shipping_status", ShippingStatus.NOT_SHIPPED.value)
                        processed_payments.append(serialized_payment)
                        
                    except Exception as payment_error:
                        logger.error(f"Error processing payment {payment.get('payment_id')}: {str(payment_error)}")
                        # Add payment with minimal info to avoid complete failure
                        try:
                            minimal_payment = serialize_payment(payment.copy())
                            minimal_payment["items"] = []
                            minimal_payment["shipping_status"] = payment.get("shipping_status", ShippingStatus.NOT_SHIPPED.value)
                            processed_payments.append(minimal_payment)
                        except:
                            continue
                
                shipping_data[status.value] = {
                    "count": len(processed_payments),
                    "payments": processed_payments,
                    "total_amount": round(sum(p.get("total_amount", 0) for p in processed_payments), 2)
                }
                
            except Exception as e:
                logger.error(f"Error fetching {status.value} payments: {str(e)}")
                shipping_data[status.value] = {
                    "count": 0,
                    "payments": [],
                    "total_amount": 0.0
                }
        
        # Close database connection
        try:
            db_connection.close()
        except Exception as close_error:
            logger.warning(f"Error closing database connection: {str(close_error)}")
        
        total_payments = sum(data["count"] for data in shipping_data.values())
        total_amount = round(sum(data["total_amount"] for data in shipping_data.values()), 2)
        
        logger.info(f"Successfully processed shipping data for {len(shipping_data)} statuses. Total: {total_payments} payments, Amount: {total_amount}")
        
        return {
            "success": True,
            "user": current_user,
            "shipping_data": shipping_data,
            "total_payments": total_payments,
            "total_amount": total_amount
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching all shipping status payments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch shipping payments: {str(e)}")
    
@router.get("/admin/orders")
async def get_orders():
    """
    Fetch all orders for the admin, including associated product details.
    """
    try:
        db_connection = MongoDBConnection()
        payments_collection = db_connection.db.payments
        products_collection = db_connection.db.products

        # Fetch all payments (orders)
        orders = list(payments_collection.find())

        # Enrich each order with product details
        for order in orders:
            order["_id"] = str(order["_id"])
            order["products"] = []

            # Fetch product details for each item in the order
            for item in order.get("items", []):
                product_id = item.get("product_id")
                if not product_id:
                    logger.warning(f"Missing product_id in order item: {item}")
                    continue

                try:
                    product = products_collection.find_one({"_id": ObjectId(product_id)})
                    if product:
                        product["_id"] = str(product["_id"])
                        order["products"].append(product)
                    else:
                        logger.warning(f"Product not found for product_id: {product_id}")
                except Exception as e:
                    logger.error(f"Error fetching product with product_id {product_id}: {str(e)}")

        return {"success": True, "orders": orders}
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        return {"success": False, "error": str(e)}


@router.put("/admin/admin-update-payment-status/{payment_id}")
async def update_payment_status(payment_id: str, payload: PaymentUpdate):
    """
    Update the payment status of a specific order.
    """
    try:
        # Validate the status field
        if not payload.status:
            raise HTTPException(status_code=422, detail="Field 'status' is required.")

        # Validate the status value
        if payload.status not in [s.value for s in PaymentStatus]:
            raise HTTPException(status_code=400, detail="Invalid payment status.")

        # Connect to the database
        db_connection = MongoDBConnection()
        orders_collection = db_connection.db.payments

        # Update the payment status in the database
        result = orders_collection.update_one(
            {"payment_id": payment_id},
            {"$set": {"payment_status": payload.status, "updated_at": datetime.utcnow()}}
        )

        # Check if the update was successful
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found.")

        return {"success": True, "message": "Payment status updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update payment status: {str(e)}")