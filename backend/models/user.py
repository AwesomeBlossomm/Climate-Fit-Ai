from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from enum import Enum
import re
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import asyncio

# Load environment variables
load_dotenv()

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

class UserModel:
    def __init__(self):
        connection_string = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        self.client = MongoClient(connection_string)
        self.db = self.client.climateFitAi
        self.users_collection = self.db.users

    async def get_all_users(self, limit: int = 1000, offset: int = 0):
        """
        Fetch all users from the database with pagination.
        """
        def _convert_objectid_to_str(data):
            if isinstance(data, list):
                return [_convert_objectid_to_str(item) for item in data]
            elif isinstance(data, dict):
                return {key: _convert_objectid_to_str(value) for key, value in data.items()}
            elif isinstance(data, ObjectId):
                return str(data)
            else:
                return data

        def _fetch_users():
            users = list(self.users_collection.find().skip(offset).limit(limit))
            return [_convert_objectid_to_str(user) for user in users]

        return await asyncio.get_event_loop().run_in_executor(None, _fetch_users)

    def update_is_active(self, user_id: str, is_active: bool):
        """
        Update the `is_active` status of a user using their ID.
        """
        try:
            object_id = ObjectId(user_id)  # Convert the string ID to ObjectId
        except Exception:
            raise ValueError("Invalid user ID format.")

        result = self.users_collection.update_one(
            {"_id": object_id},
            {"$set": {"is_active": is_active}}
        )
        if result.modified_count == 1:
            return {"message": "User's is_active status updated successfully."}
        raise ValueError("Failed to update user's is_active status or user not found.")

    def close_connection(self):
        self.client.close()

# Example usage (for testing purposes only)
if __name__ == "__main__":
    import asyncio

    async def main():
        user_model = UserModel()
        users = await user_model.get_all_users()
        print(users)
        user_model.close_connection()

    asyncio.run(main())
