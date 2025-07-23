from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from connection.database import users_collection
from models.user import UserRegistration, UserLogin
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
import os
import httpx

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify if the current user is an admin"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if user is admin
        user = users_collection.find_one({"username": username})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def serialize_user(user_doc):
    """Convert MongoDB document to JSON serializable format"""
    if user_doc:
        user_doc["_id"] = str(user_doc["_id"])
        if "created_at" in user_doc:
            user_doc["created_at"] = user_doc["created_at"].isoformat()
    return user_doc

@router.post("/register")
async def register(user: UserRegistration):
    # Check if username or email already exists
    if users_collection.find_one({"$or": [{"username": user.username}, {"email": user.email}]}):
        raise HTTPException(status_code=400, detail="Username or email already taken")
    
    hashed_password = hash_password(user.password)
    user_data = user.dict()
    user_data["gender"] = user.gender
    user_data["password"] = hashed_password
    user_data["created_at"] = datetime.utcnow()
    user_data["is_active"] = True
    user_data["welcome_vouchers_assigned"] = False  # Track if welcome vouchers have been assigned
    
    result = users_collection.insert_one(user_data)
    if result.inserted_id:
        return {"message": "User registered successfully"}
    raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
async def login(user: UserLogin):
    db_user = users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not db_user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account deactivated")
    
    access_token = create_access_token(data={"sub": user.username})
    
    # Check if this is the first login and assign welcome vouchers
    if not db_user.get("welcome_vouchers_assigned", False):
        try:
            async with httpx.AsyncClient() as client:
                voucher_response = await client.post(f"http://localhost:8000/discounts/auto-assign-vouchers/{user.username}")
                if voucher_response.status_code == 200:
                    # Mark welcome vouchers as assigned
                    users_collection.update_one(
                        {"username": user.username},
                        {"$set": {"welcome_vouchers_assigned": True}}
                    )
                    
                    voucher_data = voucher_response.json()
                    return {
                        "access_token": access_token,
                        "token_type": "bearer",
                        "vouchers_assigned": voucher_data.get("assigned_count", 0),
                        "voucher_message": "Welcome! 20 vouchers assigned for your first login!",
                        "first_login": True
                    }
        except Exception as e:
            # If voucher assignment fails, still return login success but don't mark as assigned
            pass
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "first_login": False
    }

@router.get("/profile")
async def get_profile(current_user: str = Depends(verify_token)):
    user = users_collection.find_one({"username": current_user}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert ObjectId to string for JSON serialization
    return serialize_user(user)