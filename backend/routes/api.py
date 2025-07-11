from fastapi import APIRouter, Query, Depends, HTTPException
from services.rapidapi_service import search_clothes, get_item_details
from routes.auth import verify_token
from typing import Optional

router = APIRouter()

@router.get("/clothes")
async def search_clothing_products(
    query: str = Query(default="clothes", description="Search query for clothing items"),
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    current_user: str = Depends(verify_token)
):
    """
    Search for clothing products with brand, size, seller details for authenticated users
    """
    products = await search_clothes(query=query, limit=limit, offset=offset)
    return {
        "query": query,
        "limit": limit,
        "offset": offset,
        "data": products
    }

@router.get("/clothes/public")
async def search_clothing_products_public(
    query: str = Query(default="", description="Search query for clothing items"),
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination")
):
    """
    Search for clothing products for public access - with proper search filtering
    """
    # Pass the actual query to the search function
    products = await search_clothes(query=query, limit=limit, offset=offset)
    return {
        "query": query,
        "limit": limit,
        "offset": offset,
        "data": products
    }

@router.get("/clothes/category/{category}")
async def search_clothes_by_category(
    category: str,
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    current_user: str = Depends(verify_token)
):
    """
    Search for clothing products by category (e.g., shirts, pants, dresses)
    """
    query = f"{category} clothes"
    products = await search_clothes(query=query, limit=limit, offset=offset)
    return {
        "category": category,
        "query": query,
        "limit": limit,
        "offset": offset,
        "data": products
    }

@router.get("/clothes/item/{item_id}")
async def get_clothing_item_details(
    item_id: str,
    current_user: str = Depends(verify_token)
):
    """
    Get detailed information about a specific clothing item by ID
    """
    try:
        item_details = await get_item_details(item_id)
        return {
            "item_id": item_id,
            "data": item_details
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Item not found: {str(e)}")

@router.get("/clothes/item/public/{item_id}")
async def get_clothing_item_details_public(
    item_id: str
):
    """
    Get limited information about a specific clothing item for public access
    """
    try:
        item_details = await get_item_details(item_id, is_public=True)
        return {
            "item_id": item_id,
            "data": item_details
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Item not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Item not found: {str(e)}")
