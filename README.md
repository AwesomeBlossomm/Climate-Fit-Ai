**Environment Variables Setup**

To run the project successfully, you need to create a .env file for both backend and frontend environments. Copy the variables below and replace with your actual values where necessary.

Backend .env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority&appName=Cluster0
MONGODB_CONNECTION_STRING=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority&appName=Cluster0

ACCESS_TOKEN_EXPIRE_MINUTES=60
SECRET_KEY=<your-secret-key>
ALGORITHM=HS256
BCRYPT_ROUNDS=12
GEMINI_API_KEY=<your-gemini-api-key>

Frontend .env
VITE_GEMINI_API_KEY=<your-gemini-api-key>
VITE_WEATHER_API_KEY=<your-weather-api-key>

Notes:

MONGO_URI and MONGODB_CONNECTION_STRING: Used to connect your backend to MongoDB Atlas.

ACCESS_TOKEN_EXPIRE_MINUTES: Token expiration time in minutes.

SECRET_KEY: A random string for securing JWT tokens.

ALGORITHM: The hashing algorithm for JWT. Default: HS256.

BCRYPT_ROUNDS: Number of hashing rounds for passwords (higher = stronger, but slower).

GEMINI_API_KEY: API key for integrating Gemini AI.

VITE_WEATHER_API_KEY: API key for fetching weather data (frontend only).
