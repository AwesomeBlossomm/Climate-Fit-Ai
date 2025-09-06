---

````markdown
# Climate-Fit-AI

Climate-Fit-AI is a full-stack application that integrates climate data with AI-powered insights.  
This guide explains how to set up and run both the **backend** (FastAPI) and **frontend** (React + Vite) locally.

---

## 🚀 Tech Stack

- **Backend:** FastAPI (Python)  
- **Frontend:** React + Vite (JavaScript)  
- **Database:** MongoDB Atlas  
- **APIs:** Gemini AI, Weather API  

---

## 📦 Prerequisites

Make sure you have the following installed:

- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js 16+](https://nodejs.org/en/download/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- npm or yarn package manager

---

## ⚙️ Environment Variables Setup

You need to create a `.env` file for both **backend** and **frontend**.  
Copy the variables below and replace them with your actual values.

### 🖥️ Backend `.env`
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
````

### 🌐 Frontend `.env`

```env
# API Keys for Frontend
VITE_GEMINI_API_KEY=<your-gemini-api-key>
VITE_WEATHER_API_KEY=<your-weather-api-key>
```

### 📋 Notes

* **MONGO\_URI** & **MONGODB\_CONNECTION\_STRING** → Connects backend to MongoDB Atlas.
* **ACCESS\_TOKEN\_EXPIRE\_MINUTES** → Token expiry in minutes.
* **SECRET\_KEY** → Secure string for JWT tokens.
* **ALGORITHM** → Hashing algorithm (default: HS256).
* **BCRYPT\_ROUNDS** → Rounds of password hashing. Higher = stronger but slower.
* **GEMINI\_API\_KEY** → Gemini AI integration key.
* **VITE\_WEATHER\_API\_KEY** → Weather data API key for frontend.

---

## 🖥️ Running the Backend

1. Navigate to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:

```bash
uvicorn main:app --reload
```

**Backend will be running at:**

```
http://127.0.0.1:8000
```

Access the auto-generated API docs:

```
http://127.0.0.1:8000/docs
```

---

## 🖥️ Running the Frontend

1. Navigate to the frontend folder:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

**Frontend will be running at:**

```
http://localhost:5173
```

---

## 📂 Project Structure

```
Climate-Fit-Ai/
├── backend/          # FastAPI backend
│   ├── main.py       # Entry point for FastAPI
│   ├── requirements.txt
│   └── ...
├── frontend/         # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
```

---

## 👩‍💻 Developers

* Justine Juliana Balla
* Raymond Lei Nogalo
* Kristine Mae Prado
* Angel Galapon

---

