from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

class PaymentMethod(str, Enum):
    GCASH = "gcash"
    PAYMAYA = "paymaya"
    CASH_ON_DELIVERY = "cash_on_delivery"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    FAILED = "failed"  # Add FAILED status

class ShippingStatus(str, Enum):
    NOT_SHIPPED = "not_shipped"
    PREPARING = "preparing" 
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    RETURNED = "returned"

class Currency(str, Enum):
    PHP = "PHP"

class PaymentItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    product_image: Optional[str] = None  # Add product image field

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v

    @validator('unit_price', 'total_price')
    def validate_price(cls, v):
        if v < 0:
            raise ValueError('Price cannot be negative')
        return round(v, 2)

class BillingAddress(BaseModel):
    full_name: str
    address_line1: str
    city: str
    state: str
    postal_code: str
    country: str
    
class PaymentCreate(BaseModel):
    items: List[PaymentItem]
    payment_method: PaymentMethod
    billing_address: BillingAddress
    discount_code: Optional[List[str]] = None  # Now a list of codes
    currency: Currency = Currency.PHP  # Always PHP
    notes: Optional[str] = None

    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('At least one item is required')
        return v

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    payment_details: Optional[Dict[str, Any]] = None

class Payment(BaseModel):
    payment_id: str
    user_id: str
    username: str
    items: List[PaymentItem]
    subtotal: float
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    shipping_amount: float = 0.0
    total_amount: float
    currency: Currency
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    billing_address: BillingAddress
    transaction_id: Optional[str] = None
    discount_code: Optional[List[str]] = None  # Now a list of codes
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    payment_details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    shipping_status: Optional[ShippingStatus] = None  # Add shipping status

class PaymentResponse(BaseModel):
    payment_id: str
    status: PaymentStatus
    total_amount: float
    currency: Currency
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None
    created_at: str
    message: str
    billing_address: BillingAddress
