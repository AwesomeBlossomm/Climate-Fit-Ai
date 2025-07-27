from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Climate Fit AI", description="Clothing recommendation API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "http://localhost:5173","http://localhost:8000","http://localhost:3000" ],  # Vite and React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving images
# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
routes_images_dir = os.path.join(os.path.dirname(__file__), "routes", "images", "images_original")

# Create directories if they don't exist
for directory in [uploads_dir, routes_images_dir]:
    if not os.path.exists(directory):
        os.makedirs(directory)

# Custom static file handler to serve images with proper fallback
class CustomStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except Exception as e:
            # Log the error for debugging
            print(f"Image not found in primary location: {path}")
            # Return 404 instead of raising exception
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=f"Image not found: {path}")

# Mount both directories to serve images
app.mount("/uploads", CustomStaticFiles(directory=uploads_dir), name="uploads")

# Also mount the routes/images/images_original directory
if os.path.exists(routes_images_dir):
    app.mount("/images", CustomStaticFiles(directory=routes_images_dir), name="images")

# Add a comprehensive fallback handler for missing images
@app.get("/uploads/{filename}")
async def serve_upload_file(filename: str):
    """Serve uploaded files with comprehensive fallback"""
    # List of possible locations to check
    possible_paths = [
        os.path.join(uploads_dir, filename),
        os.path.join(routes_images_dir, filename),
        # Also check without extension and add common extensions
        os.path.join(uploads_dir, f"{filename}.jpg"),
        os.path.join(uploads_dir, f"{filename}.png"),
        os.path.join(routes_images_dir, f"{filename}.jpg"),
        os.path.join(routes_images_dir, f"{filename}.png"),
    ]
    
    # Check each possible location
    for file_path in possible_paths:
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
    
    # If no file found, try to create a placeholder or return 404
    print(f"Image not found in any location: {filename}")
    raise HTTPException(status_code=404, detail=f"Image not found: {filename}")

# Add handler for images directory as well
@app.get("/images/{filename}")
async def serve_image_file(filename: str):
    """Serve image files with fallback"""
    file_path = os.path.join(routes_images_dir, filename)
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Try in uploads directory as fallback
    alt_file_path = os.path.join(uploads_dir, filename)
    if os.path.exists(alt_file_path) and os.path.isfile(alt_file_path):
        return FileResponse(alt_file_path)
    
    # File not found
    raise HTTPException(status_code=404, detail=f"Image not found: {filename}")

# Include routers with error handling for missing modules
try:
    from routes import auth
    app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
    print("✓ Auth router loaded successfully")
except ImportError as e:
    print(f"Warning: auth module not found, skipping auth routes: {e}")

try:
    from routes import api
    app.include_router(api.router, prefix="/api/v1", tags=["api"])
    print("✓ API router loaded successfully")
except ImportError as e:
    print(f"Warning: api module not found, skipping api routes: {e}")

try:
    from routes import discounts
    app.include_router(discounts.router, prefix="/api/v1", tags=["discounts"])
    print("✓ Discounts router loaded successfully")
except ImportError as e:
    print(f"Warning: discounts module not found, skipping discount routes: {e}")

try:
    from routes.payments import router as payments_router
    app.include_router(payments_router, prefix="/api/v1", tags=["payments"])
    print("✓ Payments router loaded successfully")
    print("  Available payment endpoints:")
    print("    - GET /api/v1/payments/all-shipping-statuses")
    print("    - GET /api/v1/debug/routes")
    print("    - GET /api/v1/payment-status-overview")
except ImportError as e:
    print(f"Warning: payments module not found, skipping payments routes: {e}")

try:
    from routes import cart
    app.include_router(cart.router, prefix="/api/v1", tags=["cart"])
    print("✓ Cart router loaded successfully")
except ImportError as e:
    print(f"Warning: cart module not found, skipping cart routes: {e}")

@app.get("/")
async def root():
    return {"message": "ClimateAI Fashion API", "status": "running", "version": "1.0"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Climate Fit AI API is running"}

# Debug endpoint to list all routes
@app.get("/api/v1/debug/all-routes")
async def debug_all_routes():
    """List all available routes for debugging"""
    routes_info = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            routes_info.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": getattr(route, 'name', 'unnamed')
            })
    return {
        "message": "All available routes",
        "routes": routes_info,
        "total_routes": len(routes_info)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
