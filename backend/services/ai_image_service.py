import os
import random
from PIL import Image
import google.generativeai as genai
from typing import Dict, List, Any
import json
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini AI
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Gemini AI configured successfully")
    else:
        logger.warning("GEMINI_API_KEY not found in environment variables")
        model = None
except Exception as e:
    logger.error(f"Failed to configure Gemini AI: {str(e)}")
    model = None

class AIImageProcessor:
    def __init__(self):
        self.clothing_categories = [
            "T-Shirts", "Jeans", "Dresses", "Jackets", "Shoes", 
            "Accessories", "Hoodies", "Skirts", "Pants", "Shorts"
        ]
        self.sizes = ["XS", "S", "M", "L", "XL", "XXL"]
        
    async def process_image(self, image_path: str) -> Dict[str, Any]:
        """
        Process an image using AI to extract product information
        """
        try:
            logger.info(f"Starting to process image: {image_path}")
            
            # Validate image file exists and is readable
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image file not found: {image_path}")
            
            # Validate file is an image
            valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif')
            if not image_path.lower().endswith(valid_extensions):
                raise ValueError(f"Invalid image format. Supported: {valid_extensions}")
            
            # Open and validate image
            try:
                image = Image.open(image_path)
                # Convert to RGB if necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                logger.info(f"Image opened successfully: {image.size}")
            except Exception as e:
                raise ValueError(f"Cannot open image file: {str(e)}")
            
            # Create detailed prompt for product analysis
            prompt = """
            Analyze this clothing/fashion item image and provide detailed product information in JSON format:
            
            {
                "name": "Product name",
                "description": "Detailed description of the item including style, color, material, and features",
                "category": "Category from: T-Shirts, Jeans, Dresses, Jackets, Shoes, Accessories, Hoodies, Skirts, Pants, Shorts",
                "color": "Primary color of the item",
                "material": "Estimated material type",
                "style": "Style description (casual, formal, sporty, etc.)",
                "season": "Suitable season (Spring, Summer, Fall, Winter, All-season)",
                "gender": "Target gender (Men, Women, Unisex)",
                "brand_style": "Estimated brand style or type"
            }
            
            Be specific and detailed in your analysis. Focus on visible characteristics.
            Return only valid JSON format.
            """
            
            # Check if Gemini API is configured
            if not model or not os.getenv("GEMINI_API_KEY"):
                logger.warning("GEMINI_API_KEY not found, using fallback data")
                ai_data = self._generate_fallback_data()
            else:
                try:
                    logger.info("Sending image to Gemini AI for analysis")
                    # Generate content using Gemini
                    response = model.generate_content([prompt, image])
                    
                    if not response or not response.text:
                        raise Exception("Empty response from AI model")
                    
                    logger.info("Received response from Gemini AI")
                    # Parse AI response
                    ai_data = self._parse_ai_response(response.text)
                except Exception as ai_error:
                    logger.error(f"AI processing failed: {str(ai_error)}, using fallback")
                    ai_data = self._generate_fallback_data()
            
            # Generate additional product data
            product_data = self._generate_product_data(ai_data, image_path)
            logger.info(f"Generated product data: {product_data.get('name')}")
            
            return product_data
            
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            raise Exception(f"Error processing image {image_path}: {str(e)}")
    
    def _generate_fallback_data(self) -> Dict[str, Any]:
        """
        Generate fallback data when AI processing fails
        """
        logger.info("Generating fallback product data")
        return {
            "name": f"Fashion Item {random.randint(1000, 9999)}",
            "description": "Stylish clothing item - AI analysis unavailable. This is a high-quality fashion piece perfect for your wardrobe.",
            "category": random.choice(self.clothing_categories),
            "color": random.choice(["Black", "White", "Blue", "Red", "Green", "Gray", "Brown"]),
            "material": random.choice(["Cotton", "Polyester", "Cotton blend", "Denim", "Wool"]),
            "style": random.choice(["Casual", "Formal", "Sporty", "Trendy", "Classic"]),
            "season": random.choice(["Spring", "Summer", "Fall", "Winter", "All-season"]),
            "gender": random.choice(["Men", "Women", "Unisex"]),
            "brand_style": random.choice(["Contemporary", "Classic", "Trendy", "Urban", "Casual"])
        }
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse AI response and extract JSON data
        """
        try:
            # Clean response text and extract JSON
            cleaned_text = response_text.strip()
            if "```json" in cleaned_text:
                start = cleaned_text.find("```json") + 7
                end = cleaned_text.find("```", start)
                json_text = cleaned_text[start:end].strip()
            elif "{" in cleaned_text and "}" in cleaned_text:
                start = cleaned_text.find("{")
                end = cleaned_text.rfind("}") + 1
                json_text = cleaned_text[start:end]
            else:
                raise ValueError("No valid JSON found in response")
            
            parsed_data = json.loads(json_text)
            
            # Validate required fields
            required_fields = ["name", "description", "category"]
            for field in required_fields:
                if field not in parsed_data or not parsed_data[field]:
                    parsed_data[field] = self._get_default_value(field)
            
            return parsed_data
        except Exception as e:
            logger.error(f"JSON parsing failed: {str(e)}")
            return self._generate_fallback_data()
    
    def _get_default_value(self, field: str) -> str:
        """
        Get default value for required fields
        """
        defaults = {
            "name": "Fashion Item",
            "description": "Stylish clothing item",
            "category": random.choice(self.clothing_categories)
        }
        return defaults.get(field, "Unknown")
    
    def _generate_product_data(self, ai_data: Dict[str, Any], image_path: str) -> Dict[str, Any]:
        """
        Generate complete product data including price, sizes, etc.
        """
        try:
            # Generate price in peso (PHP) based on category
            category = ai_data.get("category", "T-Shirts")
            if category.lower() in ["shoes", "jackets", "dresses"]:
                base_price = random.randint(1500, 5000)
            elif category.lower() in ["jeans", "pants"]:
                base_price = random.randint(1000, 3000)
            else:
                base_price = random.randint(500, 2000)
            
            # Generate available sizes based on category
            if category.lower() == "shoes":
                available_sizes = [str(i) for i in random.sample(range(36, 45), random.randint(3, 6))]
            else:
                num_sizes = random.randint(3, 6)
                available_sizes = random.sample(self.sizes, num_sizes)
            
            # Generate quantity
            quantity = random.randint(10, 100)
            
            product_data = {
                "name": ai_data.get("name", "Fashion Item"),
                "description": ai_data.get("description", "Stylish clothing item"),
                "category": ai_data.get("category", random.choice(self.clothing_categories)),
                "price_php": base_price,
                "sizes_available": available_sizes,
                "quantity": quantity,
                "color": ai_data.get("color", "Multi-color"),
                "material": ai_data.get("material", "Cotton blend"),
                "style": ai_data.get("style", "Casual"),
                "season": ai_data.get("season", "All-season"),
                "gender": ai_data.get("gender", "Unisex"),
                "brand_style": ai_data.get("brand_style", "Contemporary"),
                "image_path": image_path,
                "created_at": datetime.utcnow(),
                "is_active": True
            }
            
            logger.info(f"Generated product data for: {product_data['name']}")
            return product_data
        except Exception as e:
            logger.error(f"Error generating product data: {str(e)}")
            raise Exception(f"Failed to generate product data: {str(e)}")
    
    def generate_seller_data(self, product_category: str) -> Dict[str, Any]:
        """
        Generate seller data based on product category
        """
        # Sample seller data - you can make this more sophisticated
        seller_names = [
            "Fashion Forward Store", "Style Central", "Trendy Threads",
            "Urban Wardrobe", "Classic Collections", "Modern Wear Hub"
        ]
        
        addresses = [
            "Manila, Philippines", "Cebu City, Philippines", "Davao City, Philippines",
            "Quezon City, Philippines", "Makati City, Philippines", "Iloilo City, Philippines"
        ]
        
        owner_names = [
            "Maria Santos", "Juan Dela Cruz", "Ana Reyes", "Carlos Garcia",
            "Sofia Mendoza", "Rico Valdez", "Lisa Chen", "Mark Tan"
        ]
        
        seller_data = {
            "store_name": random.choice(seller_names),
            "owner_full_name": random.choice(owner_names),
            "address": random.choice(addresses),
            "contact_number": f"09{random.randint(100000000, 999999999)}",
            "email": f"store{random.randint(1, 1000)}@example.com",
            "specializes_in": [product_category],
            "established_date": datetime.utcnow(),
            "is_verified": random.choice([True, False]),
            "rating": round(random.uniform(3.5, 5.0), 1)
        }
        
        return seller_data
