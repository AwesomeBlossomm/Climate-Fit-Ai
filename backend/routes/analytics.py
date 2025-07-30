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
async def user_seller_growth(filter: str = None, value: str = None):
    db = client.climateFitAi
    users_collection = db["users"]
    sellers_collection = db["sellers"]

    # Determine the date range based on the filter
    if filter == "month" and value:
        start_date = datetime.strptime(value, "%B")
        start_date = start_date.replace(year=datetime.now().year)
        end_date = start_date + timedelta(days=31)
    elif filter == "year" and value:
        start_date = datetime.strptime(value, "%Y")
        end_date = start_date.replace(month=12, day=31)
    else:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)  # Default to last 30 days

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

@router.get("/analytics/monthly-sales")
async def monthly_sales(filter: str = None, value: str = None):
    db = client.climateFitAi
    payments_collection = db["payments"]

    # Determine the date range based on the filter
    if filter == "month" and value:
        start_date = datetime.strptime(value, "%B")
        start_date = start_date.replace(year=datetime.now().year)
        end_date = start_date + timedelta(days=31)
    elif filter == "year" and value:
        start_date = datetime.strptime(value, "%Y")
        end_date = start_date.replace(month=12, day=31)
    else:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)  # Default to last 6 months

    monthly_sales = {}

    for date in generate_date_range(start_date, end_date):
        month_year = date.strftime("%Y-%m")
        if month_year not in monthly_sales:
            monthly_sales[month_year] = 0

        next_date = date + timedelta(days=1)

        total_amount = payments_collection.aggregate([
            {
                "$match": {
                    "payment_status": {"$regex": "^completed$", "$options": "i"},
                    "created_at": {"$gte": date, "$lt": next_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$total_amount"}
                }
            }
        ])

        for result in total_amount:
            monthly_sales[month_year] += result["total"]

    # Format the data for the frontend
    sales_data = [
        {"month": month, "profit": round(profit, 2)}
        for month, profit in sorted(monthly_sales.items())
    ]

    return {"sales_data": sales_data}
