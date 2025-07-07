from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, api, discounts, payments, cart

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite and React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(api.router, prefix="/api")
app.include_router(discounts.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(cart.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ClimateAI Fashion API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
