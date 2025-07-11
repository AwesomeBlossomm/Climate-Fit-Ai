import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (userData) => {
    const response = await api.post("/register", userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("/login", credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/profile");
    return response.data;
  },
};

export const clothingAPI = {
  searchClothes: async (query = "", limit = 10, offset = 0) => {
    const response = await api.get("/clothes", {
      params: { query: query || "", limit, offset },
    });
    return response.data;
  },

  searchClothesPublic: async (query = "", limit = 5, offset = 0) => {
    const response = await api.get("/clothes/public", {
      params: { query: query || "", limit, offset },
    });
    return response.data;
  },

  searchClothesByCategory: async (category, limit = 10, offset = 0) => {
    const response = await api.get(`/clothes/category/${category}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  getItemDetails: async (itemId) => {
    const response = await api.get(`/clothes/item/${itemId}`);
    return response.data;
  },

  getItemDetailsPublic: async (itemId) => {
    const response = await api.get(`/clothes/item/public/${itemId}`);
    return response.data;
  },
};

export default api;
