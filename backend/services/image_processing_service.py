import os
import glob
from typing import List, Dict, Any
from services.ai_image_service import AIImageProcessor
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import MongoDB models, create placeholders if they don't exist
try:
    from models.mongodb_models import MongoDBConnection, ProductModel, SellerModel
    MONGODB_AVAILABLE = True
    logger.info("MongoDB models imported successfully")
except ImportError as e:
    logger.error(f"MongoDB models import failed: {str(e)}")
    MONGODB_AVAILABLE = False
    class MongoDBConnection:
        def __init__(self): 
            logger.warning("Using placeholder MongoDB connection")
        def close(self): pass
    
    class ProductModel:
        def __init__(self, db_connection): pass
        async def create_product(self, product_data: dict, seller_id: str): 
            logger.info(f"Placeholder: Would create product {product_data.get('name')}")
            return f"product_{hash(str(product_data))}"
    
    class SellerModel:
        def __init__(self, db_connection): pass
        async def create_seller(self, seller_data: dict): 
            logger.info(f"Placeholder: Would create seller {seller_data.get('store_name')}")
            return f"seller_{hash(str(seller_data))}"
        async def update_seller_products(self, seller_id: str, category: str): 
            logger.info(f"Placeholder: Would update seller {seller_id} with category {category}")

class ImageProcessingService:
    def __init__(self):
        self.ai_processor = AIImageProcessor()
        try:
            self.db_connection = MongoDBConnection()
            self.product_model = ProductModel(self.db_connection)
            self.seller_model = SellerModel(self.db_connection)
            logger.info("ImageProcessingService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ImageProcessingService: {str(e)}")
            raise Exception(f"Service initialization failed: {str(e)}")
    
    async def process_images_in_folder(self, folder_path: str) -> Dict[str, Any]:
        """
        Process all images in a folder and create products/sellers in MongoDB
        """
        try:
            logger.info(f"Starting to process images in folder: {folder_path}")
            
            # Normalize path for cross-platform compatibility
            folder_path = os.path.normpath(folder_path)
            
            if not os.path.exists(folder_path):
                raise FileNotFoundError(f"Folder not found: {folder_path}")
            
            if not os.path.isdir(folder_path):
                raise ValueError(f"Path is not a directory: {folder_path}")
            
            # Get all image files with more comprehensive search
            image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif', '*.webp']
            image_files = []
            
            for extension in image_extensions:
                # Search for both lowercase and uppercase extensions
                image_files.extend(glob.glob(os.path.join(folder_path, extension)))
                image_files.extend(glob.glob(os.path.join(folder_path, extension.upper())))
                # Also search with mixed case
                if extension.startswith('*.j'):
                    image_files.extend(glob.glob(os.path.join(folder_path, extension.replace('*.j', '*.J'))))
            
            # Remove duplicates
            image_files = list(set(image_files))
            
            logger.info(f"Found {len(image_files)} image files")
            
            if not image_files:
                raise ValueError(f"No image files found in the specified folder: {folder_path}")
            
            # Log some sample filenames for debugging
            sample_files = image_files[:3]
            logger.info(f"Sample files found: {[os.path.basename(f) for f in sample_files]}")
            
            processed_products = []
            created_sellers = {}
            errors = []
            
            for i, image_path in enumerate(image_files):
                try:
                    image_filename = os.path.basename(image_path)
                    logger.info(f"Processing image {i+1}/{len(image_files)}: {image_filename}")
                    
                    # Verify file exists and is accessible
                    if not os.path.exists(image_path):
                        raise FileNotFoundError(f"Image file not found: {image_path}")
                    
                    # Check file size
                    file_size = os.path.getsize(image_path)
                    if file_size == 0:
                        raise ValueError(f"Image file is empty: {image_filename}")
                    
                    logger.info(f"Processing file: {image_filename} (size: {file_size} bytes)")
                    
                    # Process image with AI
                    product_data = await self.ai_processor.process_image(image_path)
                    logger.info(f"AI processing completed for: {product_data.get('name', 'Unknown')}")
                    
                    # Check if we need to create a seller for this category
                    category = product_data.get("category", "General")
                    seller_id = created_sellers.get(category)
                    
                    if not seller_id:
                        # Create new seller for this category
                        logger.info(f"Creating new seller for category: {category}")
                        seller_data = self.ai_processor.generate_seller_data(category)
                        seller_id = await self.seller_model.create_seller(seller_data)
                        created_sellers[category] = seller_id
                        logger.info(f"Created seller with ID: {seller_id}")
                    
                    # Create product
                    logger.info(f"Creating product for seller: {seller_id}")
                    product_id = await self.product_model.create_product(product_data, seller_id)
                    logger.info(f"Created product with ID: {product_id}")
                    
                    # Update seller's product categories
                    await self.seller_model.update_seller_products(seller_id, category)
                    
                    processed_products.append({
                        "product_id": product_id,
                        "seller_id": seller_id,
                        "image_path": image_path,
                        "image_filename": image_filename,
                        "product_name": product_data.get("name"),
                        "category": category,
                        "price_php": product_data.get("price_php")
                    })
                    
                    logger.info(f"Successfully processed: {product_data.get('name')} from {image_filename}")
                    
                except Exception as e:
                    error_msg = f"Failed to process {image_filename}: {str(e)}"
                    logger.error(error_msg)
                    import traceback
                    traceback.print_exc()
                    errors.append({
                        "image_path": image_path,
                        "image_filename": image_filename,
                        "error": str(e)
                    })
            
            result = {
                "folder_path": folder_path,
                "total_images": len(image_files),
                "successfully_processed": len(processed_products),
                "errors": len(errors),
                "products": processed_products,
                "sellers_created": list(created_sellers.values()),
                "processing_errors": errors,
                "mongodb_available": MONGODB_AVAILABLE
            }
            
            logger.info(f"Processing complete. Successfully processed: {len(processed_products)}, Errors: {len(errors)}")
            return result
            
        except Exception as e:
            logger.error(f"Critical error in process_images_in_folder: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Image processing service failed: {str(e)}")
    
    async def process_single_image(self, image_path: str, seller_id: str = None) -> Dict[str, Any]:
        """
        Process a single image and create product in MongoDB
        """
        try:
            logger.info(f"Processing single image: {os.path.basename(image_path)}")
            
            # Process image with AI
            product_data = await self.ai_processor.process_image(image_path)
            
            # If no seller_id provided, create a new seller
            if not seller_id:
                category = product_data.get("category", "General")
                seller_data = self.ai_processor.generate_seller_data(category)
                seller_id = await self.seller_model.create_seller(seller_data)
            
            # Create product
            product_id = await self.product_model.create_product(product_data, seller_id)
            
            logger.info(f"Successfully created product: {product_data.get('name')}")
            
            return {
                "success": True,
                "product_id": product_id,
                "seller_id": seller_id,
                "product_data": product_data
            }
            
        except Exception as e:
            error_msg = f"Failed to process single image: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": str(e)
            }
    
    def close_connection(self):
        """
        Close database connection
        """
        self.db_connection.close()
