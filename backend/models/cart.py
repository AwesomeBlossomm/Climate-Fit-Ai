from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List
from enum import Enum

class CartItem(BaseModel):
    product_id: str
    product_name: str
    brand: str
    unit_price: float
    quantity: int
    size: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    total_price: float

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        if v > 50:
            raise ValueError('Quantity cannot exceed 50 items')
        return v

    @validator('unit_price')
    def validate_unit_price(cls, v):
        if v < 0:
            raise ValueError('Unit price cannot be negative')
        return round(v, 2)

    @validator('total_price')
    def validate_total_price(cls, v, values):
        if 'unit_price' in values and 'quantity' in values:
            expected_total = round(values['unit_price'] * values['quantity'], 2)
            if abs(v - expected_total) > 0.01:
                raise ValueError('Total price must equal unit price × quantity')
        return round(v, 2)

class CartItemAdd(BaseModel):
    product_id: str
    product_name: str
    brand: str
    unit_price: float
    quantity: int = 1
    size: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None

class CartItemUpdate(BaseModel):
    quantity: int
    size: Optional[str] = None
    color: Optional[str] = None

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        if v > 50:
            raise ValueError('Quantity cannot exceed 50 items')
        return v

class Cart(BaseModel):
    cart_id: str
    user_id: str
    username: str
    items: List[CartItem]
    total_items: int
    subtotal: float
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None

class CartSummary(BaseModel):
    total_items: int
    subtotal: float
    estimated_tax: float
    estimated_shipping: float
    estimated_total: float
