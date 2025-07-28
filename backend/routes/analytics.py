from fastapi import APIRouter
from datetime import datetime, timedelta
from connection.database import client
from pymongo import MongoClient

router = APIRouter()

def generate_date_range(start_date, end_date):
    current_date = start_date
    while current_date <= end_date:
        yield current_date
        current_date += timedelta(days=1)

@router.get("/analytics/user-seller-growth")
async def user_seller_growth():
    db = client.climateFitAi
    users_collection = db["users"]
    sellers_collection = db["sellers"]

    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    user_growth = []
    seller_growth = []

    for date in generate_date_range(start_date, end_date):
        next_date = date + timedelta(days=1)

        user_count = users_collection.count_documents({
            "created_at": {"$gte": date, "$lt": next_date}
        })

        seller_count = sellers_collection.count_documents({
            "created_at": {"$gte": date, "$lt": next_date}
        })

        user_growth.append({"date": date.strftime("%Y-%m-%d"), "count": user_count})
        seller_growth.append({"date": date.strftime("%Y-%m-%d"), "count": seller_count})

    return {"user_growth": user_growth, "seller_growth": seller_growth}
