from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set")

try:
    client = MongoClient(MONGO_URI)
    client.admin.command('ping')
    print("MongoDB connection successful!")
    db = client.climateFitAi  
    users_collection = db.users
    discounts_collection = db.discounts  # Added discounts collection
    payments_collection = db.payments  # Added payments collection
    carts_collection = db.carts  # Added carts collection
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    raise