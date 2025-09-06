
# 🌱 Environment Variables Setup

To run the project successfully, you need to create a `.env` file for both **backend** and **frontend** environments.
Copy the variables below and replace them with your actual values where necessary.

---

## 🖥️ Backend `.env`

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority&appName=Cluster0
MONGODB_CONNECTION_STRING=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority&appName=Cluster0

# JWT & Security Settings
ACCESS_TOKEN_EXPIRE_MINUTES=60
SECRET_KEY=<your-secret-key>
ALGORITHM=HS256
BCRYPT_ROUNDS=12

# API Keys
GEMINI_API_KEY=<your-gemini-api-key>
```

---

## 🌐 Frontend `.env`

```env
# API Keys for Frontend
VITE_GEMINI_API_KEY=<your-gemini-api-key>
VITE_WEATHER_API_KEY=<your-weather-api-key>
```

---

## 📋 Notes

* **MONGO\_URI** & **MONGODB\_CONNECTION\_STRING** → Connects backend to **MongoDB Atlas**.
* **ACCESS\_TOKEN\_EXPIRE\_MINUTES** → Token expiry duration in minutes.
* **SECRET\_KEY** → Secure random string for **JWT tokens**.
* **ALGORITHM** → Hashing algorithm, default is **HS256**.
* **BCRYPT\_ROUNDS** → Rounds of password hashing (**higher = stronger but slower**).
* **GEMINI\_API\_KEY** → Key for integrating **Gemini AI** services.
* **VITE\_WEATHER\_API\_KEY** → Key for fetching weather data on the **frontend** only.

