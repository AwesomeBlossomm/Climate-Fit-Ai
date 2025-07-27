from fastapi import APIRouter, Query, Depends, HTTPException, Body, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from services.image_processing_service import ImageProcessingService
from typing import Optional, Dict, Any
import os
import tempfile
import logging
from dotenv import load_dotenv
import models.user as user_module

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import MongoDB models and auth, create placeholders if they don't exist
try:
    from models.mongodb_models import MongoDBConnection, ProductModel, SellerModel, CommentModel
except ImportError:
    class MongoDBConnection:
        def __init__(self): pass
        def close(self): pass
    
    class ProductModel:
        def __init__(self, db_connection): pass
        async def get_product_by_id(self, product_id: str): return None
        async def search_products(self, query: str, limit: int, offset: int): return []
        async def get_products_by_category(self, category: str, limit: int, offset: int): return []
        async def get_all_products(self, limit: int, offset: int): return []
        async def get_all_products_unlimited(self): return []
        async def get_products_by_category_id(self, category_id: int, limit: int, offset: int): return []
        async def get_categories(self): return []
        async def create_product(self, product_data: dict, seller_id: str): return "placeholder_id"
        async def get_product_with_seller(self, product_id: str): return None
        async def search_products_with_sellers(self, query: str, limit: int, offset: int): return []
        async def get_all_products_with_sellers(self, limit: int, offset: int): return []
        async def get_all_products_with_sellers_unlimited(self): return []
        async def search_products_unlimited(self, query: str): return []
        async def find_products_by_season(self, season: str,limit: int, offset: int): return []
        async def get_products_by_seller(self, seller_id: str, limit: int, offset: int): return []
        # Add missing filter methods as placeholders
        async def search_products_paginated_with_filters(self, query: str, limit: int, offset: int, filters: dict): return []
        async def get_all_products_with_sellers_paginated_with_filters(self, limit: int, offset: int, filters: dict): return []
        async def get_search_results_count_with_filters(self, query: str, filters: dict): return 0
        async def get_total_products_count_with_filters(self, filters: dict): return 0

    class SellerModel:
        def __init__(self, db_connection): pass
        async def get_seller_by_id(self, seller_id: str): return None
        async def create_seller(self, seller_data: dict): return "placeholder_seller_id"
        async def update_seller_products(self, seller_id: str, category: str): pass
        async def get_all_sellers(self, limit: int, offset: int): return []
        
    class UserModel:
        async def get_all_users(self, limit: int, offset: int = 0): return []
        async def update_is_active(self, username: str, is_active: bool): return {"message": "User's is_active status updated successfully."}

    class CommentModel:
        def __init__(self, db_connection): pass
        async def create_comment(self, comment_data: dict): return "placeholder_comment_id"
        async def get_comments_by_product(self, product_id: str, limit: int, offset: int): return []

            
try:
    from routes.auth import verify_token
except ImportError:
    def verify_token(): return "placeholder_user"

router = APIRouter()

# Initialize MongoDB services
db_connection = MongoDBConnection()
product_model = ProductModel(db_connection)
seller_model = SellerModel(db_connection)
comment_model = CommentModel(db_connection)
image_service = ImageProcessingService()

# Add Pydantic model for folder path request
class FolderPathRequest(BaseModel):
    folder_path: str

def process_image_urls(products, request: Request):
    """
    Process product image URLs to serve images from local backend folders
    """
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    
    for product in products:
        if product.get("image_path"):
            image_path = product["image_path"]
            
            # If it's already a full URL, leave it as is
            if image_path.startswith(("http://", "https://")):
                continue
            
            # Extract just the filename from the full path
            filename = os.path.basename(image_path)
            
            # Clean the filename
            filename = filename.strip()
            
            # If filename is empty, set placeholder
            if not filename:
                product["image_path"] = "https://via.placeholder.com/300x400?text=Fashion+Item"
                continue
            
            # Use the image serving endpoint
            product["image_path"] = f"{base_url}/api/v1/serve-image/{filename}"
        else:
            # Set default placeholder if no image_path
            product["image_path"] = "https://via.placeholder.com/300x400?text=Fashion+Item"
    
    return products



@router.get("/serve-image/{filename}")
async def serve_image(filename: str):
    """
    Serve images from the backend images folders
    """
    try:
        # Define possible image folders relative to backend
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Get backend folder
        image_folders = [
            os.path.join(base_path, "routes", "images", "images_original", "images_original"),
            os.path.join(base_path, "routes", "images", "test_image", "test_image"),
            os.path.join(base_path, "routes", "images", "images_original"),
            os.path.join(base_path, "routes", "images", "test_image"),
            os.path.join(base_path, "routes", "images"),
            os.path.join(base_path, "uploads")
        ]
        
        # Search for the image in all possible folders
        for folder in image_folders:
            image_path = os.path.join(folder, filename)
            if os.path.exists(image_path) and os.path.isfile(image_path):
                return FileResponse(
                    image_path,
                    media_type="image/jpeg",
                    headers={"Cache-Control": "public, max-age=3600"}
                )
        
        # If image not found, return 404
        raise HTTPException(status_code=404, detail="Image not found")
        
    except Exception as e:
        logger.error(f"Error serving image {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error serving image")

@router.get("/image/{filename}")
async def serve_image_alt(filename: str):
    """
    Alternative image serving endpoint
    """
    return await serve_image(filename)

@router.get("/clothes")
async def search_clothing_products(
    query: str = Query(default="", description="Search query for clothing items"),
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    current_user: str = Depends(verify_token)
):
    """
    Search for clothing products from MongoDB for authenticated users
    """
    if query.strip():
        products = await product_model.search_products(query=query, limit=limit, offset=offset)
    else:
        products = await product_model.get_all_products(limit=limit, offset=offset)
    
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
    Search for clothing products for public access from MongoDB
    """
    if query.strip():
        products = await product_model.search_products(query=query, limit=limit, offset=offset)
    else:
        products = await product_model.get_all_products(limit=limit, offset=offset)
    
    return {
        "query": query,
        "limit": limit,
        "offset": offset,
        "data": products
    }

@router.get("/products/{product_id}")
async def get_product(product_id: str):
    """
    Get product by ID from MongoDB
    """
    product = await product_model.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"data": product}

@router.get("/products/{product_id}/details")
async def get_product_details(product_id: str, request: Request):
    """
    Get detailed product information with seller info and comments
    """
    product = await product_model.get_product_with_seller(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Process image URL for single product
    products = process_image_urls([product], request)
    
    return {"data": products[0]}

@router.get("/clothes/category/{category_id}")
async def search_clothes_by_category(
    category_id: int,
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    current_user: str = Depends(verify_token)
):
    """
    Search for clothing products by category from MongoDB
    """
    products = await product_model.get_products_by_category_id(category_id=category_id, limit=limit, offset=offset)
    return {
        "category_id": category_id,
        "limit": limit,
        "offset": offset,
        "data": products
    }

@router.get("/categories")
async def get_product_categories():
    """
    Get all available product categories from MongoDB
    """
    categories = await product_model.get_categories()
    return {
        "data": categories
    }

@router.get("/clothes/item/{item_id}")
async def get_clothing_item_details(
    item_id: str,
    current_user: str = Depends(verify_token)
):
    """
    Get detailed information about a specific clothing item by ID from MongoDB
    """
    try:
        item_details = await product_model.get_product_by_id(item_id)
        if not item_details:
            raise HTTPException(status_code=404, detail="Item not found")
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
        item_details = await product_model.get_product_by_id(item_id)
        if not item_details:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Remove sensitive information for public access
        public_item = {k: v for k, v in item_details.items() 
                      if k not in ['seller_contact', 'internal_notes', 'cost_price']}
        
        return {
            "item_id": item_id,
            "data": public_item
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Item not found: {str(e)}")

@router.get("/clothes/seller/{seller_id}")
async def get_seller_information(
    seller_id: str,
    current_user: str = Depends(verify_token)
):
    """
    Get seller information by seller ID from MongoDB
    """
    seller_info = await seller_model.get_seller_by_id(seller_id)
    if not seller_info:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    return {
        "seller_id": seller_id,
        "data": seller_info
    }

@router.get("/clothes/seller/public/{seller_id}")
async def get_seller_information_public(
    seller_id: str
):
    """
    Get limited seller information for public access
    """
    seller_info = await seller_model.get_seller_by_id(seller_id)
    if not seller_info:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    # Remove sensitive seller information for public access
    public_seller_info = {k: v for k, v in seller_info.items() 
                         if not any(term in k.lower() for term in ['contact', 'email', 'phone', 'address'])}
    
    return {
        "seller_id": seller_id,
        "data": public_seller_info
    }

@router.get("/clothes/all")
async def get_all_clothes(
    limit: int = Query(default=50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    current_user: str = Depends(verify_token)
):
    """
    Get all clothing items from MongoDB
    """
    products = await product_model.get_all_products(limit=limit, offset=offset)
    
    return {
        "limit": limit,
        "offset": offset,
        "total_returned": len(products),
        "data": products
    }

@router.get("/clothes/all/public")
async def get_all_clothes_public(
    limit: int = Query(default=20, ge=1, le=50, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination")
):
    """
    Get all clothing items for public access with limited data
    """
    products = await product_model.get_all_products(limit=limit, offset=offset)
    
    return {
        "limit": limit,
        "offset": offset,
        "total_returned": len(products),
        "data": products
    }

@router.get("/clothes/all/unlimited")
async def get_all_clothes_unlimited(
    request: Request,
    current_user: str = Depends(verify_token)
):
    """
    Get all clothing items from MongoDB without pagination - optimized single call
    """
    try:
        # Single call to get all products with sellers
        products = await product_model.get_all_products_with_sellers_unlimited()
        
        # Process image URLs once
        products = process_image_urls(products, request)
        
        return {
            "success": True,
            "total_returned": len(products),
            "data": products
        }
    except Exception as e:
        logger.error(f"Error in get_all_clothes_unlimited: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")

@router.get("/clothes/all/unlimited/public")
async def get_all_clothes_unlimited_public(request: Request):
    """
    Get all clothing items for public access without pagination - optimized single call
    """
    try:
        # Single call to get all products with sellers
        products = await product_model.get_all_products_with_sellers_unlimited()
        
        # Process image URLs once
        products = process_image_urls(products, request)
        
        return {
            "success": True,
            "total_returned": len(products),
            "data": products
        }
    except Exception as e:
        logger.error(f"Error in get_all_clothes_unlimited_public: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")

@router.get("/clothes/search/unlimited")
async def search_clothing_products_unlimited(
    request: Request,
    query: str = Query(default="", description="Search query for clothing items"),
    current_user: str = Depends(verify_token)
):
    """
    Search for clothing products from MongoDB without pagination - optimized single call
    """
    try:
        if query.strip():
            products = await product_model.search_products_unlimited(query=query)
        else:
            products = await product_model.get_all_products_with_sellers_unlimited()
        
        # Process image URLs once
        products = process_image_urls(products, request)
        
        return {
            "success": True,
            "query": query,
            "total_returned": len(products),
            "data": products
        }
    except Exception as e:
        logger.error(f"Error in search_clothing_products_unlimited: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search products: {str(e)}")

@router.get("/clothes/search/unlimited/public")
async def search_clothing_products_unlimited_public(
    request: Request,
    query: str = Query(default="", description="Search query for clothing items")
):
    """
    Search for clothing products for public access without pagination - optimized single call
    """
    try:
        if query.strip():
            products = await product_model.search_products_unlimited(query=query)
        else:
            products = await product_model.get_all_products_with_sellers_unlimited()
        
        # Process image URLs once
        products = process_image_urls(products, request)
        
        return {
            "success": True,
            "query": query,
            "total_returned": len(products),
            "data": products
        }
    except Exception as e:
        logger.error(f"Error in search_clothing_products_unlimited_public: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search products: {str(e)}")

@router.post("/ai/process-images-folder")
async def process_images_folder(
    request: Optional[FolderPathRequest] = Body(None),
    folder_path: Optional[str] = Form(None)
):
    """
    Process all images in a folder using AI recognition and create products/sellers in MongoDB
    Accepts either JSON body with folder_path or form data
    """
    try:
        # Get folder_path from either JSON body or form data
        path = None
        
        # Try to get from JSON body first
        if request and hasattr(request, 'folder_path') and request.folder_path:
            path = request.folder_path
            logger.info(f"API: Got folder path from JSON body: {path}")
        # Then try form data
        elif folder_path:
            path = folder_path
            logger.info(f"API: Got folder path from form data: {path}")
        
        if not path:
            logger.error("No folder_path provided in request")
            raise HTTPException(
                status_code=422, 
                detail={
                    "error": "folder_path is required",
                    "message": "Send as JSON: {'folder_path': '/path/to/folder'} or as form data with key 'folder_path'",
                    "examples": {
                        "json": {"folder_path": "C:\\Users\\yourname\\images"},
                        "form_data": "folder_path=C:\\Users\\yourname\\images"
                    }
                }
            )
        
        # Normalize path separators for Windows
        path = os.path.normpath(path)
        logger.info(f"API: Processing images in normalized folder path: {path}")
        
        # Validate path exists before processing
        if not os.path.exists(path):
            logger.error(f"Folder not found: {path}")
            raise HTTPException(status_code=404, detail=f"Folder not found: {path}")
        
        if not os.path.isdir(path):
            logger.error(f"Path is not a directory: {path}")
            raise HTTPException(status_code=400, detail=f"Path is not a directory: {path}")
        
        # Check if folder has any image files
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif']
        import glob
        image_files = []
        for extension in image_extensions:
            image_files.extend(glob.glob(os.path.join(path, extension)))
            image_files.extend(glob.glob(os.path.join(path, extension.upper())))
        
        if not image_files:
            logger.warning(f"No image files found in folder: {path}")
            raise HTTPException(
                status_code=400, 
                detail=f"No image files found in folder: {path}. Supported formats: {image_extensions}"
            )
        
        logger.info(f"Found {len(image_files)} image files to process")
        
        # Process the images
        result = await image_service.process_images_in_folder(path)
        
        logger.info(f"Processing complete: {result['successfully_processed']} successful, {result['errors']} errors")
        
        return {
            "success": True,
            "message": f"Processed {result['successfully_processed']} images successfully out of {result['total_images']} total images",
            "folder_path": path,
            "data": result
        }
        
    except HTTPException:
        raise
    except FileNotFoundError as e:
        logger.error(f"FileNotFoundError: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        logger.error(f"ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in process_images_folder: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail={
                "error": f"Error processing images: {str(e)}",
                "folder_path": path if 'path' in locals() else "unknown"
            }
        )

@router.post("/ai/process-single-image")
async def process_single_image(
    image: UploadFile = File(...),
    seller_id: Optional[str] = Form(None),
    current_user: str = Depends(verify_token)
):
    """
    Process a single uploaded image using AI recognition
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1]) as tmp_file:
            content = await image.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Process the image
        result = await image_service.process_single_image(tmp_file_path, seller_id)
        
        # Clean up temporary file
        os.unlink(tmp_file_path)
        
        if result["success"]:
            return {
                "success": True,
                "message": "Image processed successfully",
                "data": result
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.get("/products/mongodb/search")
async def search_mongodb_products(
    query: str = Query(..., description="Search query"),
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    current_user: str = Depends(verify_token)
):
    """
    Search products in MongoDB
    """
    products = await product_model.search_products(query, limit, offset)
    return {
        "query": query,
        "limit": limit,
        "offset": offset,
        "data": products
    }

@router.get("/products/mongodb/category/{category}")
async def get_mongodb_products_by_category(
    category: str,
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0)
):
    """
    Get products by category from MongoDB
    """
    products = await product_model.get_products_by_category(category, limit, offset)
    return {
        "category": category,
        "limit": limit,
        "offset": offset,
        "data": products
    }

@router.get("/products/mongodb/all")
async def get_all_mongodb_products(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    """
    Get all products from MongoDB
    """
    products = await product_model.get_all_products(limit, offset)
    return {
        "limit": limit,
        "offset": offset,
        "total_returned": len(products),
        "data": products
    }

@router.post("/products/{product_id}/comments")
async def create_product_comment(
    product_id: str,
    comment_data: dict = Body(...),
    current_user: str = Depends(verify_token)
):
    """
    Create a new comment/review for a product
    """
    try:
        comment_data["product_id"] = product_id
        comment_id = await comment_model.create_comment(comment_data)
        return {
            "success": True,
            "message": "Comment created successfully",
            "comment_id": comment_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create comment: {str(e)}")

@router.get("/products/{product_id}/comments")
async def get_product_comments(
    product_id: str,
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0)
):
    """
    Get comments/reviews for a specific product
    """
    comments = await comment_model.get_comments_by_product(product_id, limit, offset)
    return {
        "product_id": product_id,
        "comments": comments,
        "total_returned": len(comments)
    }

# Helper function to apply basic filters in Python (fallback implementation)
def apply_basic_filters(products, filters):
    """
    Apply basic filters to products list in Python as fallback
    """
    if not filters:
        return products
    
    filtered_products = []
    for product in products:
        # Price filters
        if filters.get('price_min') is not None:
            price = product.get('price_php', 0) or product.get('price', {}).get('original', 0) or 0
            if price < filters['price_min']:
                continue
                
        if filters.get('price_max') is not None:
            price = product.get('price_php', 0) or product.get('price', {}).get('original', 0) or 0
            if price > filters['price_max']:
                continue
        
        # Category filter
        if filters.get('category'):
            product_category = product.get('category', '').lower()
            filter_category = filters['category'].lower()
            if filter_category not in product_category:
                continue
        
        # Weather suitability filter
        if filters.get('weather_suitable') is not None:
            product_weather = product.get('weather_suitable', False)
            if product_weather != filters['weather_suitable']:
                continue
        
        # Rating filter
        if filters.get('min_rating') is not None:
            product_rating = product.get('average_rating', 0) or product.get('rating', 0) or 0
            if product_rating < filters['min_rating']:
                continue
        
        filtered_products.append(product)
    
    return filtered_products

@router.get("/clothes/infinite-scroll")
async def get_clothes_infinite_scroll(
    request: Request,
    page: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=50),
    query: str = Query(default=""),
    price_min: Optional[float] = Query(default=None),
    price_max: Optional[float] = Query(default=None),
    category: Optional[str] = Query(default=None),
    weather_suitable: Optional[str] = Query(default=None),
    weather_suggestions: Optional[str] = Query(default=None),  # New parameter
    min_rating: Optional[float] = Query(default=None),
    get_all: Optional[bool] = Query(default=False),
    current_user: str = Depends(verify_token)
):
    try:
        # Parse weather suggestions if provided
        suggestions = []
        if weather_suggestions:
            suggestions = [s.strip() for s in weather_suggestions.split(',') if s.strip()]
        
        # Build filters
        filters = {}
        if price_min is not None:
            filters['price_min'] = price_min
        if price_max is not None:
            filters['price_max'] = price_max
        if category:
            filters['category'] = category
        if weather_suitable:
            filters['weather_suitable'] = weather_suitable.lower() == 'true'
        if min_rating is not None:
            filters['min_rating'] = min_rating
        
        # Special handling for weather suggestions
        if weather_suitable and weather_suitable.lower() == 'true' and suggestions:
            if get_all:
                if query.strip():
                    products = await product_model.search_products_with_weather_suggestions(
                        query, suggestions, filters
                    )
                else:
                    products = await product_model.get_products_with_weather_suggestions(
                        suggestions, filters
                    )
            else:
                offset = page * limit
                if query.strip():
                    products = await product_model.search_products_with_weather_suggestions(
                        query, suggestions, filters
                    )
                    products = products[offset:offset + limit]
                    total_count = len(products)
                else:
                    all_products = await product_model.get_products_with_weather_suggestions(
                        suggestions, filters
                    )
                    total_count = len(all_products)
                    products = all_products[offset:offset + limit]
            
            # Process and return results
            products = process_image_urls(products, request)
            return {
                "success": True,
                "data": products,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total_count": total_count,
                    "has_more": (offset + len(products)) < total_count,
                    "current_count": len(products),
                    "loaded_count": offset + len(products)
                },
                "query": query,
                "filters": filters
            }
        
        # Rest of your existing implementation...
        # ... (keep the original code for non-weather filtered cases)

    except Exception as e:
        logger.error(f"Error in infinite scroll endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")
    
@router.get("/clothes/infinite-scroll/public")
async def get_clothes_infinite_scroll_public(
    request: Request,
    page: int = Query(default=0, ge=0, description="Page number (0-based)"),
    limit: int = Query(default=20, ge=1, le=200, description="Items per page - increased limit"),
    query: str = Query(default="", description="Search query"),
    price_min: Optional[float] = Query(default=None, description="Minimum price filter"),
    price_max: Optional[float] = Query(default=None, description="Maximum price filter"),
    category: Optional[str] = Query(default=None, description="Category filter"),
    weather_suitable: Optional[str] = Query(default=None, description="Weather suitability filter"),
    min_rating: Optional[float] = Query(default=None, description="Minimum rating filter"),
    get_all: Optional[bool] = Query(default=False, description="Get all products at once")
):
    """
    Get clothing products with infinite scroll pagination and filters for public access - enhanced
    """
    try:
        logger.info(f"Public infinite scroll request - Query: '{query}', Page: {page}, Limit: {limit}, Category: {category}")
        
        # Build filters dictionary
        filters = {}
        if price_min is not None:
            filters['price_min'] = price_min
        if price_max is not None:
            filters['price_max'] = price_max
        if category:
            filters['category'] = category
        if weather_suitable:
            filters['weather_suitable'] = weather_suitable.lower() == 'true'
        if min_rating is not None:
            filters['min_rating'] = min_rating
        
        # If get_all is true, ignore pagination and get everything
        if get_all:
            if query.strip():
                # Search all products with query
                products = await product_model.search_products_unlimited(query=query.strip())
                # Apply filters in Python if specified
                if filters:
                    products = apply_basic_filters(products, filters)
            else:
                # Get all products
                products = await product_model.get_all_products_with_sellers_paginated_with_filters()
                # Apply filters in Python if specified
                if filters:
                    products = apply_basic_filters(products, filters)
            
            # Process image URLs
            products = process_image_urls(products, request)
            
            return {
                "success": True,
                "data": products,
                "pagination": {
                    "page": 0,
                    "limit": len(products),
                    "total_count": len(products),
                    "has_more": False,
                    "current_count": len(products),
                    "loaded_count": len(products)
                },
                "query": query,
                "filters": filters
            }
        
        # Regular pagination
        offset = page * limit
        
        # Try to use optimized filter methods, otherwise use fallback
        try:
            if query.strip():
                # Search with filters
                logger.info(f"Searching with query: '{query}' and filters: {filters}")
                
                if hasattr(product_model, 'search_products_paginated_with_filters'):
                    products = await product_model.search_products_paginated_with_filters(
                        query=query.strip(), limit=limit, offset=offset, filters=filters
                    )
                    total_count = await product_model.get_search_results_count_with_filters(query.strip(), filters)
                else:
                    # Fallback: get all search results and apply filters in Python
                    logger.info("Using fallback search method")
                    all_products = await product_model.search_products_unlimited(query.strip())
                    filtered_products = apply_basic_filters(all_products, filters)
                    total_count = len(filtered_products)
                    products = filtered_products[offset:offset + limit]
            else:
                # Get all products with filters
                logger.info(f"Getting all products with filters: {filters}")
                
                if hasattr(product_model, 'get_all_products_with_sellers_paginated_with_filters'):
                    products = await product_model.get_all_products_with_sellers_paginated_with_filters(
                        limit=limit, offset=offset, filters=filters
                    )
                    total_count = await product_model.get_total_products_count_with_filters(filters)
                else:
                    # Fallback: get all products and apply filters in Python
                    logger.info("Using fallback get all method")
                    all_products = await product_model.get_all_products_with_sellers_paginated_with_filters()
                    filtered_products = apply_basic_filters(all_products, filters)
                    total_count = len(filtered_products)
                    products = filtered_products[offset:offset + limit]
        
        except Exception as method_error:
            logger.warning(f"Filter method failed, using fallback: {str(method_error)}")
            # Fallback implementation
            if query.strip():
                all_products = await product_model.search_products_unlimited(query.strip())
            else:
                all_products = await product_model.get_all_products_with_sellers_paginated_with_filters()
            
            filtered_products = apply_basic_filters(all_products, filters)
            total_count = len(filtered_products)
            products = filtered_products[offset:offset + limit]
        
        # Process image URLs
        products = process_image_urls(products, request)
        
        has_more = (offset + len(products)) < total_count
        
        logger.info(f"Returning {len(products)} products out of {total_count} total")
        
        return {
            "success": True,
            "data": products,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "has_more": has_more,
                "current_count": len(products),
                "loaded_count": offset + len(products)
            },
            "query": query,
            "filters": filters
        }
    except Exception as e:
        logger.error(f"Error in public infinite scroll endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")

@router.get("/sellers/{seller_id}/products")
async def get_seller_products(
    seller_id: str,
    request: Request,
    limit: int = Query(default=50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination")
):
    """
    Get all products for a specific seller with enhanced debugging
    """
    try:
        logger.info(f"Fetching products for seller: {seller_id}")
        
        # Log the raw seller_id before processing
        logger.debug(f"Raw seller_id from request: {seller_id}")
        
        # Clean the seller_id
        clean_seller_id = seller_id.strip('{}')
        logger.debug(f"Cleaned seller_id: {clean_seller_id}")
        
        products = await product_model.get_products_by_seller(clean_seller_id, limit, offset)
        
        logger.debug(f"Found {len(products)} products for seller {clean_seller_id}")
        
        # Process image URLs
        products = process_image_urls(products, request)
        
        return {
            "success": True,
            "seller_id": clean_seller_id,
            "total_returned": len(products),
            "data": products
        }
    except Exception as e:
        logger.error(f"Error fetching seller products: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch seller products: {str(e)}")
    
@router.get("/products")
async def find_products_by_season(season: str):
    """
    Fetch products based on the season category.
    Returns all products where the season field contains the specified season.
    Handles cases where season field contains multiple comma-separated values.
    """
    try:
        if not season:
            raise HTTPException(status_code=400, detail="Season is required")

        # Clean and prepare the season input
        season_clean = season.strip().lower()
        
        # Query products where the season field contains the requested season
        products = await product_model.find_products_by_season(season_clean)

        if not products:
            return {"products": []}
        
        return {"products": products}
    except Exception as e:
        logger.error(f"Error fetching products for season {season}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Admin routes

@router.get("/admin/sellers")
async def get_sellers():
    """
    Fetch all sellers.
    """
    try:
        db_connection = MongoDBConnection()  # Initialize the database connection
        sellers = await SellerModel(db_connection).get_all_sellers()
        return {"success": True, "sellers": sellers}
    except Exception as e:
        logger.error(f"Error fetching sellers: {str(e)}")
        return {"success": False, "error": str(e)}
    
@router.get("/admin/users")
async def get_users():
    """
    Fetch all users.
    """
    try:
        user_model = user_module.UserModel()
        users = await user_model.get_all_users()  # Removed db_connection
        return {"success": True, "users": users}
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        return {"success": False, "error": str(e)}
@router.put("/admin/users/{user_id}/is_active")
async def update_user_is_active(user_id: str, payload: dict):
    """
    Update the is_active status of a user.
    """
    try:
        is_active = payload.get("is_active")
        if is_active is None:
            raise ValueError("Missing 'is_active' in request body.")

        user_model = user_module.UserModel()
        result = user_model.update_is_active(user_id, is_active)
        return result
    except Exception as e:
        logger.error(f"Error updating user is_active status: {str(e)}")
        return {"success": False, "error": str(e)}

@router.get("/admin/products")
async def get_products():
    """
    Fetch all products.
    """
    try:
        db_connection = MongoDBConnection() 
        products = await ProductModel(db_connection).get_all_products_unlimited()
        return {"success": True, "products": products}
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        return {"success": False, "error": str(e)}