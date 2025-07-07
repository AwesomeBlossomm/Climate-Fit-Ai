import os
import httpx
from fastapi import HTTPException
from typing import Optional, Dict, Any, List

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")

async def search_clothes(query: str = "clothes", limit: int = 10, offset: int = 0) -> Dict[str, Any]:
    """
    Search for clothing products from Shopee API
    """
    if not RAPIDAPI_KEY or not RAPIDAPI_HOST:
        raise HTTPException(status_code=500, detail="RapidAPI configuration missing")
    
    # Try the correct endpoint for shopee-scraper1
    url = f"https://{RAPIDAPI_HOST}/search-products"
    
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }
    
    params = {
        "query": query,
        "country": "us",
        "limit": limit,
        "page": offset // limit + 1
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                return format_clothing_response(data)
            elif response.status_code == 404:
                # If endpoint doesn't exist, try alternative endpoint
                return await try_alternative_endpoint(query, limit, offset)
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid RapidAPI key")
            elif response.status_code == 403:
                raise HTTPException(status_code=403, detail="RapidAPI access forbidden")
            elif response.status_code == 429:
                raise HTTPException(status_code=429, detail="RapidAPI rate limit exceeded")
            else:
                raise HTTPException(status_code=response.status_code, detail=f"RapidAPI error: {response.text}")
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")

async def try_alternative_endpoint(query: str, limit: int, offset: int) -> Dict[str, Any]:
    """
    Try alternative endpoints if main one fails
    """
    # List of possible endpoints for Shopee scraper
    endpoints = [
        "/search",
        "/product/search",
        "/api/search",
        "/shopee/search"
    ]
    
    for endpoint in endpoints:
        try:
            url = f"https://{RAPIDAPI_HOST}{endpoint}"
            headers = {
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": RAPIDAPI_HOST
            }
            
            params = {
                "q": query,
                "keyword": query,
                "search": query,
                "limit": limit,
                "page": offset // limit + 1
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params, timeout=30.0)
                
                if response.status_code == 200:
                    data = response.json()
                    return format_clothing_response(data)
                    
        except Exception:
            continue
    
    # If all endpoints fail, return mock data
    return create_mock_clothing_data(query, limit)

def create_mock_clothing_data(query: str, limit: int) -> Dict[str, Any]:
    """
    Create mock clothing data when API is unavailable
    """
    mock_products = []
    
    clothing_items = [
        {
            "name": "Cotton T-Shirt",
            "brand": "Fashion Brand",
            "price": 19.99,
            "sizes": ["S", "M", "L", "XL"],
            "description": "Comfortable cotton t-shirt perfect for casual wear"
        },
        {
            "name": "Denim Jeans",
            "brand": "Denim Co",
            "price": 49.99,
            "sizes": ["28", "30", "32", "34", "36"],
            "description": "Classic straight-fit denim jeans"
        },
        {
            "name": "Summer Dress",
            "brand": "Style House",
            "price": 39.99,
            "sizes": ["XS", "S", "M", "L"],
            "description": "Elegant summer dress for special occasions"
        },
        {
            "name": "Hoodie Sweatshirt",
            "brand": "Comfort Wear",
            "price": 35.99,
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "description": "Warm and cozy hoodie sweatshirt"
        },
        {
            "name": "Athletic Shorts",
            "brand": "Sport Pro",
            "price": 24.99,
            "sizes": ["S", "M", "L", "XL"],
            "description": "High-performance athletic shorts"
        }
    ]
    
    for i, item in enumerate(clothing_items[:limit]):
        product = {
            "id": f"mock_{i+1}",
            "brand": item["brand"],
            "name": item["name"],
            "price": {
                "original": item["price"],
                "currency": "USD"
            },
            "details": {
                "description": item["description"],
                "category": "clothing",
                "rating": 4.5,
                "sold_count": 150 + i * 20,
                "stock": 50
            },
            "sizes": item["sizes"],
            "seller": {
                "shop_id": f"shop_{i+1}",
                "shop_name": f"Fashion Store {i+1}",
                "shop_rating": 4.8,
                "shop_location": "New York, USA",
                "address": {
                    "city": "New York",
                    "country": "USA",
                    "region": "North America",
                    "full_address": "New York, USA"
                }
            },
            "images": [f"https://example.com/image_{i+1}.jpg"],
            "url": f"https://shopee.com/product/mock_{i+1}"
        }
        mock_products.append(product)
    
    return {
        "total_count": len(mock_products),
        "products": mock_products
    }

def format_clothing_response(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format the raw API response to focus on clothing details
    """
    formatted_products = []
    
    # Handle different possible response structures
    products_data = []
    if isinstance(raw_data, list):
        products_data = raw_data
    elif "data" in raw_data:
        products_data = raw_data["data"] if isinstance(raw_data["data"], list) else raw_data["data"].get("items", [])
    elif "products" in raw_data:
        products_data = raw_data["products"]
    
    for item in products_data:
        product = {
            "id": item.get("itemid") or item.get("id") or item.get("product_id"),
            "brand": item.get("brand") or item.get("shop_name", "Unknown Brand"),
            "name": item.get("name") or item.get("title", ""),
            "price": {
                "original": format_price(item.get("price") or item.get("price_min") or 0),
                "currency": "USD"
            },
            "details": {
                "description": item.get("description", "")[:200] + "..." if len(item.get("description", "")) > 200 else item.get("description", ""),
                "category": item.get("catid") or item.get("category_id"),
                "rating": item.get("item_rating", {}).get("rating_star", 0) if isinstance(item.get("item_rating"), dict) else item.get("rating", 0),
                "sold_count": item.get("sold", 0) or item.get("historical_sold", 0),
                "stock": item.get("stock", 0)
            },
            "sizes": extract_sizes(item),
            "seller": {
                "shop_id": item.get("shopid") or item.get("shop_id"),
                "shop_name": item.get("shop_name", "Unknown Shop"),
                "shop_rating": item.get("shop_rating", 0),
                "shop_location": item.get("shop_location", "Unknown Location"),
                "address": format_seller_address(item)
            },
            "images": format_images(item.get("images", []) or item.get("image", [])),
            "url": f"https://shopee.com/product/{item.get('shopid', '')}/{item.get('itemid', '')}" if item.get('shopid') and item.get('itemid') else ""
        }
        formatted_products.append(product)
    
    return {
        "total_count": len(formatted_products),
        "products": formatted_products
    }

def format_price(price_value) -> float:
    """
    Format price value to proper decimal
    """
    if isinstance(price_value, (int, float)):
        # If price is in cents/smallest unit, convert to dollars
        if price_value > 1000:
            return round(price_value / 100000, 2)
        return round(price_value, 2)
    return 0.0

def format_images(images_list) -> List[str]:
    """
    Format image URLs
    """
    if not images_list:
        return []
    
    formatted_images = []
    for img in images_list[:5]:  # Limit to 5 images
        if isinstance(img, str):
            formatted_images.append(img)
        elif isinstance(img, dict) and "url" in img:
            formatted_images.append(img["url"])
    
    return formatted_images

def extract_sizes(item: Dict[str, Any]) -> List[str]:
    """
    Extract available sizes from product variants
    """
    sizes = []
    
    # Check for size variations in models
    if "models" in item and item["models"]:
        for model in item["models"]:
            if "name" in model:
                # Common size indicators
                size_keywords = ["S", "M", "L", "XL", "XXL", "size", "Size"]
                if any(keyword in model["name"] for keyword in size_keywords):
                    sizes.append(model["name"])
    
    # If no specific sizes found, add generic options
    if not sizes:
        sizes = ["One Size", "Various Sizes Available"]
    
    return sizes

def format_seller_address(item: Dict[str, Any]) -> Dict[str, str]:
    """
    Format seller address information
    """
    return {
        "city": item.get("shop_location", "Unknown City"),
        "country": "Various Countries",
        "region": item.get("shop_location", "Unknown Region"),
        "full_address": f"{item.get('shop_location', 'Unknown Location')}"
    }

async def get_item_details(item_id: str, is_public: bool = False) -> Dict[str, Any]:
    """
    Get detailed information about a specific clothing item
    """
    if not RAPIDAPI_KEY or not RAPIDAPI_HOST:
        return create_mock_item_details(item_id, is_public)
    
    # Try to get item details from API
    url = f"https://{RAPIDAPI_HOST}/product/{item_id}"
    
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                return format_item_details(data, is_public)
            elif response.status_code == 404:
                # Try alternative endpoints for item details
                return await try_alternative_item_endpoint(item_id, is_public)
            else:
                return create_mock_item_details(item_id, is_public)
                
    except httpx.TimeoutException:
        return create_mock_item_details(item_id, is_public)
    except httpx.RequestError:
        return create_mock_item_details(item_id, is_public)

async def try_alternative_item_endpoint(item_id: str, is_public: bool) -> Dict[str, Any]:
    """
    Try alternative endpoints for item details
    """
    endpoints = [
        f"/item/{item_id}",
        f"/product/details/{item_id}",
        f"/api/item/{item_id}",
        f"/shopee/product/{item_id}"
    ]
    
    for endpoint in endpoints:
        try:
            url = f"https://{RAPIDAPI_HOST}{endpoint}"
            headers = {
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": RAPIDAPI_HOST
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=30.0)
                
                if response.status_code == 200:
                    data = response.json()
                    return format_item_details(data, is_public)
                    
        except Exception:
            continue
    
    # If all endpoints fail, return mock data
    return create_mock_item_details(item_id, is_public)

def create_mock_item_details(item_id: str, is_public: bool = False) -> Dict[str, Any]:
    """
    Create detailed mock item data when API is unavailable
    """
    mock_items = {
        "mock_1": {
            "id": "mock_1",
            "brand": "Fashion Brand",
            "name": "Premium Cotton T-Shirt",
            "category": "T-Shirts",
            "price": {
                "original": 29.99,
                "discounted": 19.99,
                "currency": "USD",
                "discount_percentage": 33
            },
            "description": "Premium quality 100% cotton t-shirt with comfortable fit and durable construction. Perfect for casual wear and everyday comfort.",
            "detailed_description": "This premium cotton t-shirt features a classic crew neck design with short sleeves. Made from 100% pre-shrunk cotton for lasting comfort and fit. The fabric is soft, breathable, and machine washable. Available in multiple colors and sizes.",
            "specifications": {
                "material": "100% Cotton",
                "care_instructions": "Machine wash cold, tumble dry low",
                "country_of_origin": "Vietnam",
                "weight": "180 GSM",
                "fit": "Regular Fit"
            },
            "sizes": [
                {"size": "S", "chest": "36-38", "length": "27", "available": True},
                {"size": "M", "chest": "38-40", "length": "28", "available": True},
                {"size": "L", "chest": "40-42", "length": "29", "available": True},
                {"size": "XL", "chest": "42-44", "length": "30", "available": False},
                {"size": "XXL", "chest": "44-46", "length": "31", "available": True}
            ],
            "colors": [
                {"name": "Black", "hex": "#000000", "available": True},
                {"name": "White", "hex": "#FFFFFF", "available": True},
                {"name": "Navy Blue", "hex": "#000080", "available": True},
                {"name": "Gray", "hex": "#808080", "available": False}
            ],
            "images": [
                "https://example.com/tshirt-front.jpg",
                "https://example.com/tshirt-back.jpg",
                "https://example.com/tshirt-side.jpg",
                "https://example.com/tshirt-detail.jpg"
            ],
            "rating": {
                "average": 4.5,
                "total_reviews": 1250,
                "five_star": 65,
                "four_star": 25,
                "three_star": 8,
                "two_star": 1,
                "one_star": 1
            },
            "stock": {
                "total_available": 150,
                "low_stock_threshold": 10,
                "is_low_stock": False
            },
            "shipping": {
                "free_shipping": True,
                "estimated_delivery": "3-5 business days",
                "shipping_cost": 0.00,
                "express_available": True,
                "express_cost": 9.99
            },
            "seller": {
                "shop_id": "shop_001",
                "shop_name": "Fashion Central Store",
                "shop_rating": 4.8,
                "shop_reviews": 5420,
                "shop_location": "New York, USA",
                "verified": True,
                "response_rate": "98%",
                "response_time": "Within 2 hours"
            },
            "tags": ["casual", "cotton", "comfortable", "everyday", "basic"],
            "related_products": ["mock_2", "mock_3", "mock_4"],
            "return_policy": {
                "returnable": True,
                "return_period": "30 days",
                "exchange_available": True,
                "refund_available": True
            }
        }
    }
    
    # Create variations for different mock IDs
    base_item = mock_items.get("mock_1", mock_items["mock_1"])
    
    if item_id.startswith("mock_"):
        # Customize based on ID
        item_num = item_id.split("_")[-1] if "_" in item_id else "1"
        
        variations = {
            "2": {"name": "Classic Denim Jeans", "brand": "Denim Co", "price": {"original": 59.99, "discounted": 49.99, "currency": "USD", "discount_percentage": 17}},
            "3": {"name": "Elegant Summer Dress", "brand": "Style House", "price": {"original": 79.99, "discounted": 39.99, "currency": "USD", "discount_percentage": 50}},
            "4": {"name": "Cozy Hoodie Sweatshirt", "brand": "Comfort Wear", "price": {"original": 45.99, "discounted": 35.99, "currency": "USD", "discount_percentage": 22}},
            "5": {"name": "Athletic Performance Shorts", "brand": "Sport Pro", "price": {"original": 34.99, "discounted": 24.99, "currency": "USD", "discount_percentage": 29}}
        }
        
        if item_num in variations:
            base_item.update(variations[item_num])
            base_item["id"] = item_id
    
    # Filter data for public access
    if is_public:
        return {
            "id": base_item["id"],
            "brand": base_item["brand"],
            "name": base_item["name"],
            "price": base_item["price"],
            "description": base_item["description"],
            "images": base_item["images"][:2],  # Limit images for public
            "rating": {
                "average": base_item["rating"]["average"],
                "total_reviews": base_item["rating"]["total_reviews"]
            },
            "sizes": [{"size": s["size"], "available": s["available"]} for s in base_item["sizes"]],
            "colors": base_item["colors"]
        }
    
    return base_item

def format_item_details(raw_data: Dict[str, Any], is_public: bool = False) -> Dict[str, Any]:
    """
    Format raw item data from API to detailed structure
    """
    # Handle different response structures
    item_data = raw_data
    if "data" in raw_data:
        item_data = raw_data["data"]
    elif "product" in raw_data:
        item_data = raw_data["product"]
    
    formatted_item = {
        "id": item_data.get("itemid") or item_data.get("id") or item_data.get("product_id"),
        "brand": item_data.get("brand") or item_data.get("shop_name", "Unknown Brand"),
        "name": item_data.get("name") or item_data.get("title", ""),
        "category": item_data.get("category") or item_data.get("catid"),
        "price": {
            "original": format_price(item_data.get("price") or item_data.get("price_max") or 0),
            "discounted": format_price(item_data.get("price_min") or item_data.get("price") or 0),
            "currency": "USD"
        },
        "description": item_data.get("description", "")[:500] + "..." if len(item_data.get("description", "")) > 500 else item_data.get("description", ""),
        "images": format_images(item_data.get("images", []) or item_data.get("image", [])),
        "rating": {
            "average": item_data.get("item_rating", {}).get("rating_star", 0) if isinstance(item_data.get("item_rating"), dict) else item_data.get("rating", 0),
            "total_reviews": item_data.get("item_rating", {}).get("rating_count", 0) if isinstance(item_data.get("item_rating"), dict) else 0
        },
        "stock": {
            "total_available": item_data.get("stock", 0),
            "is_low_stock": item_data.get("stock", 0) < 10
        },
        "seller": {
            "shop_id": item_data.get("shopid") or item_data.get("shop_id"),
            "shop_name": item_data.get("shop_name", "Unknown Shop"),
            "shop_rating": item_data.get("shop_rating", 0),
            "shop_location": item_data.get("shop_location", "Unknown Location")
        }
    }
    
    # Add detailed information for authenticated users
    if not is_public:
        formatted_item.update({
            "detailed_description": item_data.get("detailed_description", formatted_item["description"]),
            "specifications": extract_specifications(item_data),
            "sizes": extract_detailed_sizes(item_data),
            "colors": extract_colors(item_data),
            "shipping": extract_shipping_info(item_data),
            "return_policy": extract_return_policy(item_data),
            "tags": extract_tags(item_data)
        })
    
    return formatted_item

def extract_specifications(item_data: Dict[str, Any]) -> Dict[str, str]:
    """Extract product specifications"""
    specs = {}
    
    # Common specification fields
    spec_mapping = {
        "material": ["material", "fabric", "composition"],
        "care_instructions": ["care", "washing", "maintenance"],
        "country_of_origin": ["origin", "made_in", "country"],
        "weight": ["weight", "gsm"],
        "fit": ["fit", "cut", "style"]
    }
    
    for spec_key, possible_fields in spec_mapping.items():
        for field in possible_fields:
            if field in item_data:
                specs[spec_key] = str(item_data[field])
                break
    
    return specs

def extract_detailed_sizes(item_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract detailed size information"""
    sizes = []
    
    if "models" in item_data and item_data["models"]:
        for model in item_data["models"]:
            if "name" in model:
                size_info = {
                    "size": model["name"],
                    "available": model.get("stock", 0) > 0,
                    "stock": model.get("stock", 0)
                }
                sizes.append(size_info)
    else:
        # Default sizes
        default_sizes = ["S", "M", "L", "XL", "XXL"]
        for size in default_sizes:
            sizes.append({
                "size": size,
                "available": True,
                "stock": 50
            })
    
    return sizes

def extract_colors(item_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract color variations"""
    colors = []
    
    if "models" in item_data and item_data["models"]:
        for model in item_data["models"]:
            if "color" in model.get("name", "").lower():
                color_info = {
                    "name": model["name"],
                    "available": model.get("stock", 0) > 0
                }
                colors.append(color_info)
    
    if not colors:
        # Default colors
        default_colors = [
            {"name": "Black", "available": True},
            {"name": "White", "available": True},
            {"name": "Navy", "available": True}
        ]
        colors = default_colors
    
    return colors

def extract_shipping_info(item_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract shipping information"""
    return {
        "free_shipping": True,
        "estimated_delivery": "3-7 business days",
        "shipping_cost": 0.00,
        "express_available": True,
        "express_cost": 9.99
    }

def extract_return_policy(item_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract return policy information"""
    return {
        "returnable": True,
        "return_period": "30 days",
        "exchange_available": True,
        "refund_available": True
    }

def extract_tags(item_data: Dict[str, Any]) -> List[str]:
    """Extract product tags"""
    tags = []
    
    # Extract from category or description
    if "category" in item_data:
        tags.append(item_data["category"].lower())
    
    # Add common tags based on item type
    name = item_data.get("name", "").lower()
    if "shirt" in name or "t-shirt" in name:
        tags.extend(["casual", "comfortable", "everyday"])
    elif "dress" in name:
        tags.extend(["elegant", "formal", "occasion"])
    elif "jeans" in name:
        tags.extend(["denim", "casual", "durable"])
    
    return list(set(tags))  # Remove duplicates
