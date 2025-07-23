from pymongo import MongoClient
from datetime import datetime
from typing import Optional, List, Dict, Any
import os
from bson import ObjectId
import asyncio
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MongoDBConnection:
    def __init__(self):
        try:
            # Use MONGO_URI from .env file
            connection_string = os.getenv("MONGO_URI")
            if not connection_string:
                # Fallback to local MongoDB
                connection_string = "mongodb://localhost:27017/"
                logger.warning("MONGO_URI not found in environment, using local MongoDB")
            
            logger.info(f"Connecting to MongoDB...")
            self.client = MongoClient(connection_string)
            self.db = self.client.climateFitAi  # Match your database name from .env
            self.products_collection = self.db.products
            self.sellers_collection = self.db.sellers
            
            # Test connection
            self.client.admin.command('ismaster')
            logger.info("MongoDB connection established successfully")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise Exception(f"MongoDB connection failed: {str(e)}")
    
    def close(self):
        if hasattr(self, 'client'):
            self.client.close()
            logger.info("MongoDB connection closed")

class ProductModel:
    def __init__(self, db_connection: MongoDBConnection):
        self.collection = db_connection.products_collection
        self.db = db_connection.db
        self.sellers_collection = db_connection.sellers_collection
    
    async def create_product(self, product_data: Dict[str, Any], seller_id: str) -> str:
        """
        Create a new product in MongoDB
        """
        def _create_product():
            try:
                # Ensure proper data types
                product_document = {
                    "name": str(product_data.get("name", "Unknown Product")),
                    "description": str(product_data.get("description", "")),
                    "category": str(product_data.get("category", "General")),
                    "price_php": float(product_data.get("price_php", 0)),
                    "sizes_available": product_data.get("sizes_available", []),
                    "quantity": int(product_data.get("quantity", 0)),
                    "color": str(product_data.get("color", "")),
                    "material": str(product_data.get("material", "")),
                    "style": str(product_data.get("style", "")),
                    "season": str(product_data.get("season", "")),
                    "gender": str(product_data.get("gender", "")),
                    "brand_style": str(product_data.get("brand_style", "")),
                    "image_path": str(product_data.get("image_path", "")),
                    "seller_id": str(seller_id),
                    "created_at": datetime.utcnow(),
                    "is_active": True
                }
                
                result = self.collection.insert_one(product_document)
                logger.info(f"Created product with ID: {result.inserted_id}")
                return str(result.inserted_id)
            except Exception as e:
                logger.error(f"Error creating product: {str(e)}")
                raise Exception(f"Failed to create product: {str(e)}")
        
        return await asyncio.get_event_loop().run_in_executor(None, _create_product)
    
    async def get_product_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Get product by ID
        """
        def _get_product():
            try:
                product = self.collection.find_one({"_id": ObjectId(product_id)})
                if product:
                    product["_id"] = str(product["_id"])
                return product
            except Exception:
                return None
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_product)
    
    async def search_products(self, query: str, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Search products by name or description
        """
        def _search_products():
            search_filter = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"category": {"$regex": query, "$options": "i"}}
                ]
            }
            
            products = list(self.collection.find(search_filter).skip(offset).limit(limit))
            for product in products:
                product["_id"] = str(product["_id"])
            
            return products
        
        return await asyncio.get_event_loop().run_in_executor(None, _search_products)
    
    async def get_products_by_category(self, category: str, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get products by category
        """
        def _get_by_category():
            products = list(self.collection.find({"category": category}).skip(offset).limit(limit))
            for product in products:
                product["_id"] = str(product["_id"])
            return products
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_by_category)
    
    async def get_all_products(self, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get all products
        """
        def _get_all():
            products = list(self.collection.find().skip(offset).limit(limit))
            for product in products:
                product["_id"] = str(product["_id"])
            return products
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_all)

    async def get_products_by_category_id(self, category_id: int, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get products by category ID
        """
        def _get_by_category_id():
            products = list(self.collection.find({"category_id": category_id}).skip(offset).limit(limit))
            for product in products:
                product["_id"] = str(product["_id"])
            return products
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_by_category_id)

    async def get_categories(self) -> List[Dict[str, Any]]:
        """
        Get all available product categories
        """
        def _get_categories():
            categories = self.collection.distinct("category")
            return [{"name": cat, "id": i} for i, cat in enumerate(categories)]
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_categories)

    async def get_product_with_seller(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Get product by ID with seller information and comments
        """
        def _get_product_with_seller():
            try:
                # Aggregation pipeline to join product with seller
                pipeline = [
                    {"$match": {"_id": ObjectId(product_id)}},
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {"$avg": "$comments.rating"},
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0
                        }
                    }
                ]
                
                result = list(self.collection.aggregate(pipeline))
                if result:
                    product = result[0]
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                    
                    # Convert comment ObjectIds to strings
                    for comment in product.get("comments", []):
                        if comment.get("_id"):
                            comment["_id"] = str(comment["_id"])
                        if comment.get("product_id"):
                            comment["product_id"] = str(comment["product_id"])
                    
                    return product
                return None
            except Exception as e:
                logger.error(f"Error getting product with seller: {str(e)}")
                return None
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_product_with_seller)

    async def get_all_products_with_sellers(self, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get all products with seller information
        """
        def _get_all_with_sellers():
            try:
                pipeline = [
                    {"$skip": offset},
                    {"$limit": limit},
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {"$avg": "$comments.rating"},
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0,
                            "comments": 0  # Don't include all comments in list view
                        }
                    }
                ]
                
                products = list(self.collection.aggregate(pipeline))
                for product in products:
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                
                return products
            except Exception as e:
                logger.error(f"Error getting products with sellers: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_all_with_sellers)

    async def search_products_with_sellers(self, query: str, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Search products with seller information
        """
        def _search_with_sellers():
            try:
                search_filter = {
                    "$or": [
                        {"name": {"$regex": query, "$options": "i"}},
                        {"description": {"$regex": query, "$options": "i"}},
                        {"category": {"$regex": query, "$options": "i"}}
                    ]
                }
                
                pipeline = [
                    {"$match": search_filter},
                    {"$skip": offset},
                    {"$limit": limit},
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {"$avg": "$comments.rating"},
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0,
                            "comments": 0
                        }
                    }
                ]
                
                products = list(self.collection.aggregate(pipeline))
                for product in products:
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                
                return products
            except Exception as e:
                logger.error(f"Error searching products with sellers: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _search_with_sellers)

    async def get_all_products_unlimited(self) -> List[Dict[str, Any]]:
        """
        Get all products without pagination limits
        """
        def _get_all_unlimited():
            products = list(self.collection.find())
            for product in products:
                product["_id"] = str(product["_id"])
            return products
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_all_unlimited)

    async def get_all_products_with_sellers_unlimited(self) -> List[Dict[str, Any]]:
        """
        Get all products with seller information without pagination - optimized
        """
        def _get_all_with_sellers_unlimited():
            try:
                pipeline = [
                    # Remove any limits - fetch ALL products
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {
                                "$cond": {
                                    "if": {"$gt": [{"$size": "$comments"}, 0]},
                                    "then": {"$avg": "$comments.rating"},
                                    "else": 4.0
                                }
                            },
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0,
                            "comments": 0
                        }
                    }
                ]
                
                # Execute aggregation and get ALL results
                cursor = self.collection.aggregate(pipeline, allowDiskUse=True)
                products = []
                
                for product in cursor:
                    # Convert ObjectIds to strings in one pass
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                    products.append(product)
                
                logger.info(f"Retrieved ALL {len(products)} products with sellers (unlimited)")
                return products
            except Exception as e:
                logger.error(f"Error getting all products with sellers: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_all_with_sellers_unlimited)

    async def get_all_products_with_sellers_paginated_with_filters(self, limit: int = 50, offset: int = 0, filters: dict = None) -> List[Dict[str, Any]]:
        """
        Get products with seller information with pagination and filters for infinite scroll
        """
        def _get_paginated_with_filters():
            try:
                # Build match stage based on filters
                match_stage = {}
                
                if filters:
                    if filters.get('price_min') is not None:
                        match_stage['price_php'] = match_stage.get('price_php', {})
                        match_stage['price_php']['$gte'] = float(filters['price_min'])
                    
                    if filters.get('price_max') is not None:
                        match_stage['price_php'] = match_stage.get('price_php', {})
                        match_stage['price_php']['$lte'] = float(filters['price_max'])
                    
                    if filters.get('category'):
                        match_stage['category'] = {"$regex": filters['category'], "$options": "i"}
                    
                    if filters.get('weather_suitable') is not None:
                        match_stage['weather_suitable'] = filters['weather_suitable']
                    
                    if filters.get('min_rating') is not None:
                        # This will be handled in post-processing since rating is calculated
                        pass

                pipeline = []
                
                # Add match stage if we have filters
                if match_stage:
                    pipeline.append({"$match": match_stage})
                
                # Add pagination only if limit is reasonable (not trying to get everything at once)
                if limit <= 100:
                    pipeline.extend([
                        {"$skip": offset},
                        {"$limit": limit * 2}  # Get more to account for rating filter
                    ])
                
                pipeline.extend([
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {
                                "$cond": {
                                    "if": {"$gt": [{"$size": "$comments"}, 0]},
                                    "then": {"$avg": "$comments.rating"},
                                    "else": 4.0
                                }
                            },
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0,
                            "comments": 0
                        }
                    }
                ])
                
                cursor = self.collection.aggregate(pipeline, allowDiskUse=True)
                products = []
                
                for product in cursor:
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                    
                    # Apply rating filter if specified
                    if filters and filters.get('min_rating') is not None:
                        if product.get('average_rating', 0) < float(filters['min_rating']):
                            continue
                    
                    products.append(product)
                
                # Apply final limit after rating filter
                if limit <= 100:
                    products = products[:limit]
                
                logger.info(f"Retrieved {len(products)} products with filters (offset: {offset}, limit: {limit})")
                return products
            except Exception as e:
                logger.error(f"Error getting paginated products with filters: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_paginated_with_filters)

    async def get_total_products_count_with_filters(self, filters: dict = None) -> int:
        """
        Get total count of products with filters for pagination
        """
        def _get_filtered_count():
            try:
                match_stage = {}
                
                if filters:
                    if filters.get('price_min') is not None:
                        match_stage['price_php'] = match_stage.get('price_php', {})
                        match_stage['price_php']['$gte'] = float(filters['price_min'])
                    
                    if filters.get('price_max') is not None:
                        match_stage['price_php'] = match_stage.get('price_php', {})
                        match_stage['price_php']['$lte'] = float(filters['price_max'])
                    
                    if filters.get('category'):
                        match_stage['category'] = {"$regex": filters['category'], "$options": "i"}
                    
                    if filters.get('weather_suitable') is not None:
                        match_stage['weather_suitable'] = filters['weather_suitable']
                
                if match_stage:
                    return self.collection.count_documents(match_stage)
                else:
                    return self.collection.count_documents({})
            except Exception as e:
                logger.error(f"Error getting filtered products count: {str(e)}")
                return 0
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_filtered_count)

    async def search_products_unlimited(self, query: str) -> List[Dict[str, Any]]:
        """
        Search products without pagination limits with seller information
        """
        def _search_unlimited():
            try:
                search_filter = {
                    "$or": [
                        {"name": {"$regex": query, "$options": "i"}},
                        {"description": {"$regex": query, "$options": "i"}},
                        {"category": {"$regex": query, "$options": "i"}},
                        {"brand_style": {"$regex": query, "$options": "i"}},
                        {"material": {"$regex": query, "$options": "i"}},
                        {"color": {"$regex": query, "$options": "i"}}
                    ]
                }
                
                pipeline = [
                    {"$match": search_filter},
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {
                                "$cond": {
                                    "if": {"$gt": [{"$size": "$comments"}, 0]},
                                    "then": {"$avg": "$comments.rating"},
                                    "else": 4.0
                                }
                            },
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0,
                            "comments": 0
                        }
                    }
                ]
                
                cursor = self.collection.aggregate(pipeline, allowDiskUse=True)
                products = []
                
                for product in cursor:
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                    products.append(product)
                
                logger.info(f"Search found {len(products)} products for query: {query}")
                return products
            except Exception as e:
                logger.error(f"Error searching products unlimited: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _search_unlimited)

    async def search_products_paginated_with_filters(self, query: str, limit: int = 50, offset: int = 0, filters: dict = None) -> List[Dict[str, Any]]:
        """
        Search products with pagination and filters
        """
        def _search_paginated_with_filters():
            try:
                # Build search filter
                search_filter = {
                    "$or": [
                        {"name": {"$regex": query, "$options": "i"}},
                        {"description": {"$regex": query, "$options": "i"}},
                        {"category": {"$regex": query, "$options": "i"}},
                        {"brand_style": {"$regex": query, "$options": "i"}},
                        {"material": {"$regex": query, "$options": "i"}},
                        {"color": {"$regex": query, "$options": "i"}}
                    ]
                }
                
                # Add additional filters
                if filters:
                    if filters.get('price_min') is not None:
                        search_filter['price_php'] = search_filter.get('price_php', {})
                        search_filter['price_php']['$gte'] = float(filters['price_min'])
                    
                    if filters.get('price_max') is not None:
                        search_filter['price_php'] = search_filter.get('price_php', {})
                        search_filter['price_php']['$lte'] = float(filters['price_max'])
                    
                    if filters.get('category'):
                        # Override the OR condition for category if specific category filter is applied
                        search_filter['category'] = {"$regex": filters['category'], "$options": "i"}
                    
                    if filters.get('weather_suitable') is not None:
                        search_filter['weather_suitable'] = filters['weather_suitable']

                pipeline = [
                    {"$match": search_filter},
                    {"$skip": offset},
                    {"$limit": limit * 2},  # Get more to account for rating filter
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {
                                "$cond": {
                                    "if": {"$gt": [{"$size": "$comments"}, 0]},
                                    "then": {"$avg": "$comments.rating"},
                                    "else": 4.0
                                }
                            },
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0,
                            "comments": 0
                        }
                    }
                ]
                
                cursor = self.collection.aggregate(pipeline, allowDiskUse=True)
                products = []
                
                for product in cursor:
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                    
                    # Apply rating filter if specified
                    if filters and filters.get('min_rating') is not None:
                        if product.get('average_rating', 0) < float(filters['min_rating']):
                            continue
                    
                    products.append(product)
                
                # Apply final limit after rating filter
                products = products[:limit]
                
                logger.info(f"Search with filters found {len(products)} products for query: {query}")
                return products
            except Exception as e:
                logger.error(f"Error searching products with filters: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _search_paginated_with_filters)

    async def get_search_results_count_with_filters(self, query: str, filters: dict = None) -> int:
        """
        Get total count of search results with filters
        """
        def _get_search_count():
            try:
                search_filter = {
                    "$or": [
                        {"name": {"$regex": query, "$options": "i"}},
                        {"description": {"$regex": query, "$options": "i"}},
                        {"category": {"$regex": query, "$options": "i"}},
                        {"brand_style": {"$regex": query, "$options": "i"}},
                        {"material": {"$regex": query, "$options": "i"}},
                        {"color": {"$regex": query, "$options": "i"}}
                    ]
                }
                
                if filters:
                    if filters.get('price_min') is not None:
                        search_filter['price_php'] = search_filter.get('price_php', {})
                        search_filter['price_php']['$gte'] = float(filters['price_min'])
                    
                    if filters.get('price_max') is not None:
                        search_filter['price_php'] = search_filter.get('price_php', {})
                        search_filter['price_php']['$lte'] = float(filters['price_max'])
                    
                    if filters.get('category'):
                        search_filter['category'] = {"$regex": filters['category'], "$options": "i"}
                    
                    if filters.get('weather_suitable') is not None:
                        search_filter['weather_suitable'] = filters['weather_suitable']
                
                return self.collection.count_documents(search_filter)
            except Exception as e:
                logger.error(f"Error getting search count: {str(e)}")
                return 0
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_search_count)

    async def get_products_by_seller(self, seller_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get all products for a specific seller
        """
        def _get_products_by_seller():
            try:
                # Convert seller_id to ObjectId for lookup
                try:
                    seller_object_id = ObjectId(seller_id)
                except:
                    # If seller_id is stored as string, search by string
                    seller_object_id = seller_id
                
                pipeline = [
                    {"$match": {"seller_id": seller_object_id}},
                    {"$skip": offset},
                    {"$limit": limit},
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {
                                "$cond": {
                                    "if": {"$gt": [{"$size": "$comments"}, 0]},
                                    "then": {"$avg": "$comments.rating"},
                                    "else": 4.0
                                }
                            },
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0,
                            "comments": 0
                        }
                    }
                ]
                
                cursor = self.collection.aggregate(pipeline)
                products = []
                
                for product in cursor:
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                    products.append(product)
                
                logger.info(f"Retrieved {len(products)} products for seller {seller_id}")
                return products
            except Exception as e:
                logger.error(f"Error getting products by seller: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_products_by_seller)

class SellerModel:
    def __init__(self, db_connection: MongoDBConnection):
        self.collection = db_connection.sellers_collection
        self.db = db_connection.db
    
    async def create_seller(self, seller_data: Dict[str, Any]) -> str:
        """
        Create a new seller in MongoDB
        """
        def _create_seller():
            try:
                # Ensure proper data types
                seller_document = {
                    "store_name": str(seller_data.get("store_name", "Unknown Store")),
                    "owner_full_name": str(seller_data.get("owner_full_name", "Unknown Owner")),
                    "address": str(seller_data.get("address", "")),
                    "contact_number": str(seller_data.get("contact_number", "")),
                    "email": str(seller_data.get("email", "")),
                    "specializes_in": seller_data.get("specializes_in", []),
                    "established_date": datetime.utcnow(),
                    "is_verified": bool(seller_data.get("is_verified", False)),
                    "rating": float(seller_data.get("rating", 4.0)),
                    "created_at": datetime.utcnow()
                }
                
                result = self.collection.insert_one(seller_document)
                logger.info(f"Created seller with ID: {result.inserted_id}")
                return str(result.inserted_id)
            except Exception as e:
                logger.error(f"Error creating seller: {str(e)}")
                raise Exception(f"Failed to create seller: {str(e)}")
        
        return await asyncio.get_event_loop().run_in_executor(None, _create_seller)
    
    async def get_seller_by_id(self, seller_id: str) -> Optional[Dict[str, Any]]:
        """
        Get seller by ID
        """
        def _get_seller():
            try:
                seller = self.collection.find_one({"_id": ObjectId(seller_id)})
                if seller:
                    seller["_id"] = str(seller["_id"])
                return seller
            except Exception:
                return None
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_seller)
    
    async def update_seller_products(self, seller_id: str, product_category: str):
        """
        Update seller's product categories
        """
        def _update_seller():
            try:
                self.collection.update_one(
                    {"_id": ObjectId(seller_id)},
                    {"$addToSet": {"specializes_in": product_category}}
                )
                logger.info(f"Updated seller {seller_id} with category {product_category}")
            except Exception as e:
                logger.error(f"Error updating seller: {str(e)}")
                raise Exception(f"Failed to update seller: {str(e)}")
        
        await asyncio.get_event_loop().run_in_executor(None, _update_seller)

class CommentModel:
    def __init__(self, db_connection: MongoDBConnection):
        self.collection = db_connection.db.comments
        self.db = db_connection.db
    
    async def create_comment(self, comment_data: Dict[str, Any]) -> str:
        """
        Create a new comment in MongoDB
        """
        def _create_comment():
            try:
                comment_document = {
                    "product_id": ObjectId(comment_data.get("product_id")),
                    "user_name": str(comment_data.get("user_name", "Anonymous")),
                    "user_email": str(comment_data.get("user_email", "")),
                    "comment": str(comment_data.get("comment", "")),
                    "rating": int(comment_data.get("rating", 5)),
                    "created_at": datetime.utcnow(),
                    "is_approved": True
                }
                
                result = self.collection.insert_one(comment_document)
                logger.info(f"Created comment with ID: {result.inserted_id}")
                return str(result.inserted_id)
            except Exception as e:
                logger.error(f"Error creating comment: {str(e)}")
                raise Exception(f"Failed to create comment: {str(e)}")
        
        return await asyncio.get_event_loop().run_in_executor(None, _create_comment)
    
    async def get_comments_by_product(self, product_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get comments for a specific product
        """
        def _get_comments():
            try:
                comments = list(
                    self.collection.find({"product_id": ObjectId(product_id)})
                    .sort("created_at", -1)
                    .skip(offset)
                    .limit(limit)
                )
                for comment in comments:
                    comment["_id"] = str(comment["_id"])
                    comment["product_id"] = str(comment["product_id"])
                return comments
            except Exception as e:
                logger.error(f"Error getting comments: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_comments)

    async def get_products_by_seller(self, seller_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get all products for a specific seller
        """
        def _get_products_by_seller():
            try:
                # Convert seller_id to ObjectId for lookup
                try:
                    seller_object_id = ObjectId(seller_id)
                except:
                    # If seller_id is stored as string, search by string
                    seller_object_id = seller_id
                
                # Use the correct collection for products
                pipeline = [
                    {"$match": {"seller_id": seller_object_id}},
                    {"$skip": offset},
                    {"$limit": limit},
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {
                                "$cond": {
                                    "if": {"$gt": [{"$size": "$comments"}, 0]},
                                    "then": {"$avg": "$comments.rating"},
                                    "else": 4.0
                                }
                            },
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0,
                            "comments": 0
                        }
                    }
                ]
                
                # Use products collection instead of comments collection
                cursor = self.db.products.aggregate(pipeline)
                products = []
                
                for product in cursor:
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                    products.append(product)
                
                logger.info(f"Retrieved {len(products)} products for seller {seller_id}")
                return products
            except Exception as e:
                logger.error(f"Error getting products by seller: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_products_by_seller)
        """
        Get comments for a specific product
        """
        def _get_comments():
            try:
                comments = list(
                    self.collection.find({"product_id": ObjectId(product_id)})
                    .sort("created_at", -1)
                    .skip(offset)
                    .limit(limit)
                )
                for comment in comments:
                    comment["_id"] = str(comment["_id"])
                    comment["product_id"] = str(comment["product_id"])
                return comments
            except Exception as e:
                logger.error(f"Error getting comments: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_comments)

    async def get_products_by_seller(self, seller_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get all products for a specific seller
        """
        def _get_products_by_seller():
            try:
                # Convert seller_id to ObjectId for lookup
                try:
                    seller_object_id = ObjectId(seller_id)
                except:
                    # If seller_id is stored as string, search by string
                    seller_object_id = seller_id
                
                pipeline = [
                    {"$match": {"seller_id": seller_object_id}},
                    {"$skip": offset},
                    {"$limit": limit},
                    {
                        "$lookup": {
                            "from": "sellers",
                            "localField": "seller_id",
                            "foreignField": "_id",
                            "as": "seller_info"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "comments",
                            "localField": "_id",
                            "foreignField": "product_id",
                            "as": "comments"
                        }
                    },
                    {
                        "$addFields": {
                            "seller": {"$arrayElemAt": ["$seller_info", 0]},
                            "average_rating": {
                                "$cond": {
                                    "if": {"$gt": [{"$size": "$comments"}, 0]},
                                    "then": {"$avg": "$comments.rating"},
                                    "else": 4.0
                                }
                            },
                            "total_comments": {"$size": "$comments"}
                        }
                    },
                    {
                        "$project": {
                            "seller_info": 0,
                            "comments": 0
                        }
                    }
                ]
                
                cursor = self.collection.aggregate(pipeline)
                products = []
                
                for product in cursor:
                    product["_id"] = str(product["_id"])
                    if product.get("seller") and product["seller"].get("_id"):
                        product["seller"]["_id"] = str(product["seller"]["_id"])
                    products.append(product)
                
                logger.info(f"Retrieved {len(products)} products for seller {seller_id}")
                return products
            except Exception as e:
                logger.error(f"Error getting products by seller: {str(e)}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _get_products_by_seller)
