from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from enum import Enum
import re

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class UserRegistration(BaseModel):
    username: str
    password: str
    email: EmailStr
    full_name: str
    gender: str
    role: UserRole = UserRole.USER

    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3 or len(v) > 20:
            raise ValueError('Username must be between 3 and 20 characters')
        if not re.match("^[a-zA-Z0-9_]+$", v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r"[A-Z]", v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r"[a-z]", v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r"\d", v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError('Password must contain at least one special character')
        return v

    @validator('full_name')
    def validate_full_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        return v.strip()

class UserLogin(BaseModel):
    username: str
    password: str

class UserDiscountAssignment(BaseModel):
    username: str
    discount_code: str
    assigned_by: Optional[str] = None
    notes: Optional[str] = None

class Address(BaseModel):
    street: str
    barangay: str
    city: str
    province: str
    region: str
    postal_code: str
    country: str = "Philippines"  # Default value
    is_default: bool = False
    contact_number: str
    recipient_name: str
    address_type: Optional[str] = "Home"  # Can be Home, Work, etc.
