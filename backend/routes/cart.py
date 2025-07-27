from fastapi import APIRouter, HTTPException, Depends
from connection.database import carts_collection, users_collection
from models.cart import CartItem, CartItemAdd, CartItemUpdate, Cart, CartSummary
from routes.auth import verify_token
from datetime import datetime, timedelta
from bson import ObjectId
import uuid
from typing import List, Dict, Any

router = APIRouter()

def generate_cart_id() -> str:
    """Generate a unique cart ID"""
    return f"CART_{uuid.uuid4().hex[:12].upper()}"

def calculate_cart_totals(items: List[CartItem]) -> Dict[str, float]:
    """Calculate cart totals including tax and shipping estimates"""
    subtotal = sum(item.total_price for item in items)
    total_items = sum(item.quantity for item in items)
    
    # Calculate estimates (12% tax, 5% shipping up to $50)
    estimated_tax = round(subtotal * 0.12, 2)
    estimated_shipping = min(round(subtotal * 0.05, 2), 50.0) if subtotal > 0 else 0.0
    estimated_total = round(subtotal + estimated_tax + estimated_shipping, 2)
    
    return {
        "total_items": total_items,
        "subtotal": round(subtotal, 2),
        "estimated_tax": estimated_tax,
        "estimated_shipping": estimated_shipping,
        "estimated_total": estimated_total
    }

def serialize_cart(cart_doc):
    """Convert MongoDB document to JSON serializable format"""
    if cart_doc:
        cart_doc["_id"] = str(cart_doc["_id"])
        if "created_at" in cart_doc:
            cart_doc["created_at"] = cart_doc["created_at"].isoformat()
        if "updated_at" in cart_doc:
            cart_doc["updated_at"] = cart_doc["updated_at"].isoformat()
        if "expires_at" in cart_doc and cart_doc["expires_at"]:
            cart_doc["expires_at"] = cart_doc["expires_at"].isoformat()
    return cart_doc

@router.post("/cart/add")
async def add_to_cart(item_data: CartItemAdd, current_user: str = Depends(verify_token)):
    """Add an item to the user's cart"""
    try:
        # Get user information
        user = users_collection.find_one({"username": current_user})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate total price
        total_price = round(item_data.unit_price * item_data.quantity, 2)
        
        # Create cart item
        cart_item = CartItem(
            product_id=item_data.product_id,
            product_name=item_data.product_name,
            brand=item_data.brand,
            unit_price=item_data.unit_price,
            quantity=item_data.quantity,
            size=item_data.size,
            color=item_data.color,
            image_url=item_data.image_url,
            total_price=total_price
        )
        
        # Find existing cart or create new one
        existing_cart = carts_collection.find_one({"username": current_user})
        
        if existing_cart:
            # Check if item already exists in cart
            items = existing_cart.get("items", [])
            item_found = False
            
            for i, existing_item in enumerate(items):
                if (existing_item["product_id"] == item_data.product_id and 
                    existing_item.get("size") == item_data.size and 
                    existing_item.get("color") == item_data.color):
                    # Update quantity of existing item
                    new_quantity = existing_item["quantity"] + item_data.quantity
                    if new_quantity > 50:
                        raise HTTPException(status_code=400, detail="Cannot add more than 50 items of the same product")
                    
                    items[i]["quantity"] = new_quantity
                    items[i]["total_price"] = round(existing_item["unit_price"] * new_quantity, 2)
                    item_found = True
                    break
            
            if not item_found:
                # Add new item to cart
                items.append(cart_item.dict())
            
            # Calculate new totals
            cart_totals = calculate_cart_totals([CartItem(**item) for item in items])
            
            # Update cart
            carts_collection.update_one(
                {"_id": existing_cart["_id"]},
                {
                    "$set": {
                        "items": items,
                        "total_items": cart_totals["total_items"],
                        "subtotal": cart_totals["subtotal"],
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            cart_id = existing_cart["cart_id"]
        else:
            # Create new cart
            cart_id = generate_cart_id()
            cart_totals = calculate_cart_totals([cart_item])
            
            cart_doc = {
                "cart_id": cart_id,
                "user_id": str(user["_id"]),
                "username": current_user,
                "items": [cart_item.dict()],
                "total_items": cart_totals["total_items"],
                "subtotal": cart_totals["subtotal"],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=30)  # Cart expires in 30 days
            }
            
            result = carts_collection.insert_one(cart_doc)
            if not result.inserted_id:
                raise HTTPException(status_code=500, detail="Failed to create cart")
        
        return {
            "message": "Item added to cart successfully",
            "cart_id": cart_id,
            "item": cart_item.dict(),
            "cart_summary": cart_totals
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add item to cart: {str(e)}")

@router.get("/cart")
async def get_cart(current_user: str = Depends(verify_token)):
    """Get the user's cart contents"""
    try:
        cart = carts_collection.find_one({"username": current_user})
        
        if not cart:
            return {
                "cart_id": None,
                "items": [],
                "total_items": 0,
                "subtotal": 0.0,
                "summary": {
                    "total_items": 0,
                    "subtotal": 0.0,
                    "estimated_tax": 0.0,
                    "estimated_shipping": 0.0,
                    "estimated_total": 0.0
                }
            }
        
        # Calculate current totals
        items = [CartItem(**item) for item in cart.get("items", [])]
        cart_totals = calculate_cart_totals(items)
        
        # Update cart totals if they're different
        if (cart.get("total_items") != cart_totals["total_items"] or 
            cart.get("subtotal") != cart_totals["subtotal"]):
            carts_collection.update_one(
                {"_id": cart["_id"]},
                {
                    "$set": {
                        "total_items": cart_totals["total_items"],
                        "subtotal": cart_totals["subtotal"],
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        return {
            "cart_id": cart["cart_id"],
            "items": cart.get("items", []),
            "total_items": cart_totals["total_items"],
            "subtotal": cart_totals["subtotal"],
            "created_at": cart["created_at"].isoformat(),
            "updated_at": cart["updated_at"].isoformat(),
            "summary": cart_totals
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cart: {str(e)}")

@router.put("/cart/item/{product_id}")
async def update_cart_item(
    product_id: str, 
    update_data: CartItemUpdate, 
    old_size: str = None,
    old_color: str = None,
    current_user: str = Depends(verify_token)
):
    """Update quantity, size, or color of a cart item"""
    try:
        cart = carts_collection.find_one({"username": current_user})
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")
        items = cart.get("items", [])
        item_found = False
        item_index = -1

        # Match by product_id and old_size/old_color if provided
        for i, item in enumerate(items):
            if item["product_id"] == product_id:
                size_match = (old_size is None or item.get("size") == old_size)
                color_match = (old_color is None or item.get("color") == old_color)
                if size_match and color_match:
                    item_index = i
                    item_found = True
                    break

        if not item_found:
            raise HTTPException(status_code=404, detail="Item not found in cart")

        # Update the item
        if update_data.quantity is not None:
            items[item_index]["quantity"] = update_data.quantity
            items[item_index]["total_price"] = round(items[item_index]["unit_price"] * update_data.quantity, 2)
        if update_data.size is not None:
            items[item_index]["size"] = update_data.size
        if update_data.color is not None:
            items[item_index]["color"] = update_data.color

        # Calculate new totals
        cart_totals = calculate_cart_totals([CartItem(**item) for item in items])
        # Update cart
        carts_collection.update_one(
            {"_id": cart["_id"]},
            {
                "$set": {
                    "items": items,
                    "total_items": cart_totals["total_items"],
                    "subtotal": cart_totals["subtotal"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return {
            "message": "Cart item updated successfully",
            "updated_item": items[item_index],
            "cart_summary": cart_totals
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update cart item: {str(e)}")
    
@router.delete("/cart/item/{product_id}")
async def remove_cart_item(
    product_id: str, 
    size: str = None, 
    color: str = None,
    current_user: str = Depends(verify_token)
):
    """Remove an item from the cart"""
    try:
        cart = carts_collection.find_one({"username": current_user})
        
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")
        
        items = cart.get("items", [])
        original_length = len(items)
        
        # Remove the item
        items = [
            item for item in items 
            if not (item["product_id"] == product_id and 
                   item.get("size") == size and 
                   item.get("color") == color)
        ]
        
        if len(items) == original_length:
            raise HTTPException(status_code=404, detail="Item not found in cart")
        
        # Calculate new totals
        cart_totals = calculate_cart_totals([CartItem(**item) for item in items])
        
        # Update cart
        carts_collection.update_one(
            {"_id": cart["_id"]},
            {
                "$set": {
                    "items": items,
                    "total_items": cart_totals["total_items"],
                    "subtotal": cart_totals["subtotal"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "message": "Item removed from cart successfully",
            "cart_summary": cart_totals
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove item from cart: {str(e)}")

@router.delete("/cart/clear")
async def clear_cart(current_user: str = Depends(verify_token)):
    """Clear all items from the cart"""
    try:
        result = carts_collection.update_one(
            {"username": current_user},
            {
                "$set": {
                    "items": [],
                    "total_items": 0,
                    "subtotal": 0.0,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Cart not found")
        
        return {"message": "Cart cleared successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cart: {str(e)}")

@router.get("/cart/summary")
async def get_cart_summary(current_user: str = Depends(verify_token)):
    """Get cart summary with totals"""
    try:
        cart = carts_collection.find_one({"username": current_user})
        
        if not cart:
            return CartSummary(
                total_items=0,
                subtotal=0.0,
                estimated_tax=0.0,
                estimated_shipping=0.0,
                estimated_total=0.0
            )
        
        items = [CartItem(**item) for item in cart.get("items", [])]
        cart_totals = calculate_cart_totals(items)
        
        return CartSummary(**cart_totals)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cart summary: {str(e)}")

@router.get("/cart/count")
async def get_cart_item_count(current_user: str = Depends(verify_token)):
    """Get total number of items in cart (for badge display)"""
    try:
        cart = carts_collection.find_one({"username": current_user})
        
        if not cart:
            return {"item_count": 0}
        
        total_items = sum(item["quantity"] for item in cart.get("items", []))
        
        return {"item_count": total_items}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cart count: {str(e)}")
        
        return {"item_count": total_items}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cart count: {str(e)}")
