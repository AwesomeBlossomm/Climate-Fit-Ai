from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional
import random
import string

class Discount(BaseModel):
    code: str
    percentage: int
    description: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    usage_limit: Optional[int] = None
    used_count: int = 0

    @validator('percentage')
    def validate_percentage(cls, v):
        valid_percentages = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
        if v not in valid_percentages:
            raise ValueError(f'Percentage must be one of: {valid_percentages}')
        return v

    @validator('code')
    def validate_code(cls, v):
        if len(v) < 3 or len(v) > 20:
            raise ValueError('Discount code must be between 3 and 20 characters')
        return v.upper()

class DiscountCreate(BaseModel):
    percentage: int
    description: Optional[str] = None
    usage_limit: Optional[int] = None
    expires_at: Optional[datetime] = None

class DiscountApply(BaseModel):
    code: str
    total_amount: float
