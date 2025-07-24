from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from connection.database import users_collection
from models.user import UserRegistration, UserLogin, Address
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
        
        # Handle addresses array if it exists
        if "addresses" in user_doc and isinstance(user_doc["addresses"], list):
            for addr in user_doc["addresses"]:
                if "_id" in addr and isinstance(addr["_id"], ObjectId):
                    addr["_id"] = str(addr["_id"])
                if "created_at" in addr:
                    addr["created_at"] = addr["created_at"].isoformat()
                if "updated_at" in addr:
                    addr["updated_at"] = addr["updated_at"].isoformat()
    
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

@router.post("/users/{username}/addresses")
async def add_user_address(
    username: str,
    address: Address,
    current_user: str = Depends(verify_token)
):
    """Add a new address to a user's profile"""
    # Verify the current user can only modify their own address
    if current_user != username:
        raise HTTPException(status_code=403, detail="Can only add address to your own profile")
    
    # Check if user exists
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate required fields
    if not all([address.street, address.barangay, address.city, address.region, 
                address.postal_code, address.contact_number, address.recipient_name]):
        raise HTTPException(status_code=400, detail="All address fields are required")
    
    # Prepare address data
    address_data = address.dict()
    address_data["_id"] = ObjectId()  # Generate ObjectId for the address
    address_data["created_at"] = datetime.utcnow()
    
    # Check if user has any existing addresses
    existing_addresses = user.get("addresses", [])
    
    # If this is the first address or marked as default, set as default
    if not existing_addresses or address.is_default:
        address_data["is_default"] = True
        
        # If there are existing addresses and this is being set as default,
        # remove default flag from existing addresses
        if existing_addresses and address.is_default:
            users_collection.update_one(
                {"username": username},
                {"$set": {"addresses.$[].is_default": False}}
            )
    else:
        # If there are existing addresses and this is not marked as default
        address_data["is_default"] = False
    
    # Add the address to the user's addresses array
    # Use $push to add to array, or $set if addresses field doesn't exist
    if existing_addresses:
        # Addresses array exists, just push the new address
        result = users_collection.update_one(
            {"username": username},
            {"$push": {"addresses": address_data}}
        )
    else:
        # Addresses array doesn't exist, create it with the first address
        result = users_collection.update_one(
            {"username": username},
            {"$set": {"addresses": [address_data]}}
        )
    
    if result.modified_count == 1:
        return {
            "message": "Address added successfully", 
            "address_id": str(address_data["_id"]),
            "is_default": address_data["is_default"]
        }
    raise HTTPException(status_code=500, detail="Failed to add address")

@router.get("/users/{username}/addresses")
async def get_user_addresses(
    username: str,
    current_user: str = Depends(verify_token)
):
    """Get all addresses for a user"""
    if current_user != username:
        raise HTTPException(status_code=403, detail="Can only view your own addresses")
    
    user = users_collection.find_one(
        {"username": username},
        {"addresses": 1, "_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user.get("addresses", [])
    
    # Convert ObjectId to string for JSON serialization
    for addr in addresses:
        if "_id" in addr:
            addr["_id"] = str(addr["_id"])
        if "created_at" in addr:
            addr["created_at"] = addr["created_at"].isoformat()
        if "updated_at" in addr:
            addr["updated_at"] = addr["updated_at"].isoformat()
    
    return addresses

@router.put("/users/{username}/addresses/{address_id}")
async def update_user_address(
    username: str,
    address_id: str,
    address: Address,
    current_user: str = Depends(verify_token)
):
    """Update an existing address"""
    if current_user != username:
        raise HTTPException(status_code=403, detail="Can only update your own addresses")
    
    # Validate ObjectId format
    try:
        address_obj_id = ObjectId(address_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid address ID format")
    
    # Validate required fields
    if not all([address.street, address.barangay, address.city, address.region, 
                address.postal_code, address.contact_number, address.recipient_name]):
        raise HTTPException(status_code=400, detail="All address fields are required")
    
    # Check if address exists
    user = users_collection.find_one(
        {"username": username, "addresses._id": address_obj_id}
    )
    if not user:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # If this address is being set as default, remove default from others
    if address.is_default:
        users_collection.update_one(
            {"username": username},
            {"$set": {"addresses.$[].is_default": False}}
        )
    
    # Update the specific address
    result = users_collection.update_one(
        {"username": username, "addresses._id": address_obj_id},
        {"$set": {
            "addresses.$.street": address.street,
            "addresses.$.barangay": address.barangay,
            "addresses.$.city": address.city,
            "addresses.$.province": address.province,
            "addresses.$.region": address.region,
            "addresses.$.postal_code": address.postal_code,
            "addresses.$.country": address.country,
            "addresses.$.is_default": address.is_default,
            "addresses.$.contact_number": address.contact_number,
            "addresses.$.recipient_name": address.recipient_name,
            "addresses.$.address_type": address.address_type,
            "addresses.$.updated_at": datetime.utcnow()
        }}
    )
    
    if result.modified_count == 1:
        return {"message": "Address updated successfully"}
    raise HTTPException(status_code=404, detail="Failed to update address")

@router.delete("/users/{username}/addresses/{address_id}")
async def delete_user_address(
    username: str,
    address_id: str,
    current_user: str = Depends(verify_token)
):
    """Delete an address from user's profile"""
    if current_user != username:
        raise HTTPException(status_code=403, detail="Can only delete your own addresses")
    
    # Validate ObjectId format
    try:
        address_obj_id = ObjectId(address_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid address ID format")
    
    # First check if this address exists and if it's the default
    user = users_collection.find_one(
        {"username": username, "addresses._id": address_obj_id},
        {"addresses.$": 1}
    )
    
    if not user or not user.get("addresses"):
        raise HTTPException(status_code=404, detail="Address not found")
    
    is_default = user["addresses"][0].get("is_default", False)
    
    # Remove the address
    result = users_collection.update_one(
        {"username": username},
        {"$pull": {"addresses": {"_id": address_obj_id}}}
    )
    
    if result.modified_count == 1:
        # If we deleted the default address, set a new default if any addresses remain
        if is_default:
            remaining_user = users_collection.find_one(
                {"username": username},
                {"addresses": 1}
            )
            remaining_addresses = remaining_user.get("addresses", [])
            
            if remaining_addresses:
                # Set the first remaining address as default
                first_address_id = remaining_addresses[0]["_id"]
                users_collection.update_one(
                    {"username": username, "addresses._id": first_address_id},
                    {"$set": {"addresses.$.is_default": True}}
                )
        
        return {"message": "Address deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete address")

@router.put("/users/{username}/addresses/{address_id}/set-default")
async def set_default_address(
    username: str,
    address_id: str,
    current_user: str = Depends(verify_token)
):
    """Set an address as the default shipping address"""
    if current_user != username:
        raise HTTPException(status_code=403, detail="Can only modify your own addresses")
    
    # Validate ObjectId format
    try:
        address_obj_id = ObjectId(address_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid address ID format")
    
    # Check if address exists
    user = users_collection.find_one(
        {"username": username, "addresses._id": address_obj_id}
    )
    if not user:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # First unset any existing default addresses
    users_collection.update_one(
        {"username": username},
        {"$set": {"addresses.$[].is_default": False}}
    )
    
    # Set the new default address
    result = users_collection.update_one(
        {"username": username, "addresses._id": address_obj_id},
        {"$set": {"addresses.$.is_default": True}}
    )
    
    if result.modified_count == 1:
        return {"message": "Default address updated successfully"}
    raise HTTPException(status_code=404, detail="Address not found")

# Optional: Add an endpoint to initialize addresses array for existing users
@router.post("/users/{username}/addresses/initialize")
async def initialize_user_addresses(
    username: str,
    current_user: str = Depends(verify_token)
):
    """Initialize addresses array for users who don't have it"""
    if current_user != username:
        raise HTTPException(status_code=403, detail="Can only initialize your own addresses")
    
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if addresses field exists
    if "addresses" not in user:
        result = users_collection.update_one(
            {"username": username},
            {"$set": {"addresses": []}}
        )
        if result.modified_count == 1:
            return {"message": "Addresses array initialized successfully"}
    
    return {"message": "Addresses array already exists"}