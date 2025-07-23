from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List
from enum import Enum

class DiscountType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"

class VoucherType(str, Enum):
    CLOTHES = "clothes"
    SHIPPING = "shipping"

class DiscountCreate(BaseModel):
    code: str
    percentage: float
    description: str
    detailed_description: Optional[str] = None
    expires_at: Optional[datetime] = None
    usage_limit: Optional[int] = None
    is_active: bool = True
    voucher_type: VoucherType = VoucherType.CLOTHES

    @validator('code')
    def validate_code(cls, v):
        if len(v) < 3 or len(v) > 20:
            raise ValueError('Discount code must be between 3 and 20 characters')
        return v.upper()

    @validator('percentage')
    def validate_percentage(cls, v):
        if v <= 0 or v > 100:
            raise ValueError('Percentage must be between 1 and 100')
        return v

class DiscountApply(BaseModel):
    code: str
    total_amount: float

    @validator('total_amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Total amount must be greater than 0')
        return v

class VoucherCollect(BaseModel):
    voucher_id: str

class Discount(BaseModel):
    code: str
    percentage: float
    description: str
    detailed_description: Optional[str] = None
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    usage_limit: Optional[int] = None
    used_count: int = 0
    user_assignments: Optional[List[dict]] = []
    voucher_type: VoucherType = VoucherType.CLOTHES
