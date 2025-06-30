from fastapi import FastAPI
from routes import auth

app = FastAPI()
app.include_router(auth.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
