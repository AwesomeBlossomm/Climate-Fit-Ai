import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

// Helper function to ensure image URLs are properly formatted
const processImageUrl = (imagePath) => {
  if (!imagePath) {
    return "https://via.placeholder.com/300x400?text=Fashion+Item";
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Extract just the filename from any path format
  let filename = imagePath;
  if (imagePath.includes("\\") || imagePath.includes("/")) {
    filename = imagePath.split(/[\\/]/).pop();
  }

  // Clean the filename
  filename = filename.trim();

  // If no filename, return placeholder
  if (!filename) {
    return "https://via.placeholder.com/300x400?text=Fashion+Item";
  }

  // Use the new comprehensive image endpoint
  return `http://localhost:8000/api/v1/image/${filename}`;
};

// Helper function to process products and ensure image URLs are correct
const processProducts = (products) => {
  return products.map((product) => ({
    ...product,
    image_path: processImageUrl(product.image_path),
    images: product.images ? product.images.map(processImageUrl) : [],
  }));
};

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

class ClothingAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("token");

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all products without pagination
  async getAllProductsUnlimited() {
    try {
      const token = localStorage.getItem("token");
      const url = token
        ? "/clothes/all/unlimited"
        : "/clothes/all/unlimited/public";

      const config = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await fetch(`${API_BASE_URL}${url}`, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Process image URLs in the response
      if (data.data && Array.isArray(data.data)) {
        data.data = processProducts(data.data);
      }

      return data;
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw error;
    }
  }

  // Search products without pagination
  async searchProductsUnlimited(query = "") {
    const token = localStorage.getItem("token");
    const endpoint = token
      ? "/clothes/search/unlimited"
      : "/clothes/search/unlimited/public";
    const params = query ? `?query=${encodeURIComponent(query)}` : "";
    return this.makeRequest(`${endpoint}${params}`);
  }

  // Get product details
  async getProductDetails(productId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/${productId}/details`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Process image URL for single product
      if (data.data) {
        data.data.image_path = processImageUrl(data.data.image_path);
        if (data.data.images) {
          data.data.images = data.data.images.map(processImageUrl);
        }
      }

      return data;
    } catch (error) {
      console.error("Error fetching product details:", error);
      throw error;
    }
  }

  // Get categories
  async getCategories() {
    return this.makeRequest("/categories");
  }

  // Create product comment
  async createProductComment(productId, commentData) {
    return this.makeRequest(`/products/${productId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  // Get product comments
  async getProductComments(productId, limit = 50, offset = 0) {
    return this.makeRequest(
      `/products/${productId}/comments?limit=${limit}&offset=${offset}`
    );
  }

  // Infinite scroll methods
  async getProductsInfiniteScroll(page = 0, limit = 20, query = "") {
    try {
      const token = localStorage.getItem("token");
      const endpoint = token
        ? "/clothes/infinite-scroll"
        : "/clothes/infinite-scroll/public";

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(query && { query }),
      });

      const config = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await fetch(
        `${API_BASE_URL}${endpoint}?${params}`,
        config
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Process image URLs in the response
      if (data.data && Array.isArray(data.data)) {
        data.data = processProducts(data.data);
      }

      return data;
    } catch (error) {
      console.error("Error fetching products with infinite scroll:", error);
      throw error;
    }
  }

  // Infinite scroll methods with filters
  async getProductsInfiniteScroll(
    page = 0,
    limit = 20,
    query = "",
    filters = {}
  ) {
    try {
      console.log("API: Searching with params:", {
        page,
        limit,
        query,
        filters,
      });

      const token = localStorage.getItem("token");
      const endpoint = token
        ? "/clothes/infinite-scroll"
        : "/clothes/infinite-scroll/public";

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add query parameter
      if (query && query.trim()) {
        params.append("query", query.trim());
      }

      // Add filter parameters
      if (filters.priceMin !== undefined && filters.priceMin !== "") {
        params.append("price_min", filters.priceMin);
      }
      if (filters.priceMax !== undefined && filters.priceMax !== "") {
        params.append("price_max", filters.priceMax);
      }
      if (filters.category && filters.category !== "") {
        params.append("category", filters.category);
      }
      if (filters.weather && filters.weather !== "") {
        params.append("weather_suitable", filters.weather);
      }
      if (filters.rating && filters.rating !== "") {
        params.append("min_rating", filters.rating);
      }

      const config = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const url = `${API_BASE_URL}${endpoint}?${params}`;
      console.log("API: Making request to:", url);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API: Received response:", {
        success: data.success,
        dataLength: data.data?.length || 0,
        totalCount: data.pagination?.total_count || 0,
      });

      // Process image URLs in the response
      if (data.data && Array.isArray(data.data)) {
        data.data = processProducts(data.data);
      }

      return data;
    } catch (error) {
      console.error("Error fetching products with infinite scroll:", error);
      throw error;
    }
  }

  // Infinite scroll methods with filters - enhanced to get all products
  async getProductsInfiniteScroll(
    page = 0,
    limit = 50,
    query = "",
    filters = {}
  ) {
    try {
      console.log("API: Searching with params:", {
        page,
        limit,
        query,
        filters,
      });

      const token = localStorage.getItem("token");
      const endpoint = token
        ? "/clothes/infinite-scroll"
        : "/clothes/infinite-scroll/public";

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add query parameter
      if (query && query.trim()) {
        params.append("query", query.trim());
      }

      // Add filter parameters
      if (filters.priceMin !== undefined && filters.priceMin !== "") {
        params.append("price_min", filters.priceMin);
      }
      if (filters.priceMax !== undefined && filters.priceMax !== "") {
        params.append("price_max", filters.priceMax);
      }
      if (filters.category && filters.category !== "") {
        params.append("category", filters.category);
      }
      if (filters.weather && filters.weather !== "") {
        params.append("weather_suitable", filters.weather);
      }
      if (filters.rating && filters.rating !== "") {
        params.append("min_rating", filters.rating);
      }

      const config = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const url = `${API_BASE_URL}${endpoint}?${params}`;
      console.log("API: Making request to:", url);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API: Received response:", {
        success: data.success,
        dataLength: data.data?.length || 0,
        totalCount: data.pagination?.total_count || 0,
      });

      // Process image URLs in the response
      if (data.data && Array.isArray(data.data)) {
        data.data = processProducts(data.data);
      }

      return data;
    } catch (error) {
      console.error("Error fetching products with infinite scroll:", error);
      throw error;
    }
  }

  // New method to get all products at once
  async getAllProductsAtOnce(query = "", filters = {}) {
    console.log(
      "API: Getting all products at once with query:",
      query,
      "and filters:",
      filters
    );

    try {
      const token = localStorage.getItem("token");
      const endpoint = token
        ? "/clothes/infinite-scroll"
        : "/clothes/infinite-scroll/public";

      const params = new URLSearchParams({
        page: "0",
        limit: "10000",
        get_all: "true",
      });

      // Add query parameter
      if (query && query.trim()) {
        params.append("query", query.trim());
      }

      // Add filter parameters
      if (filters.priceMin !== undefined && filters.priceMin !== "") {
        params.append("price_min", filters.priceMin);
      }
      if (filters.priceMax !== undefined && filters.priceMax !== "") {
        params.append("price_max", filters.priceMax);
      }
      if (filters.category && filters.category !== "") {
        params.append("category", filters.category);
      }
      if (filters.weather && filters.weather !== "") {
        params.append("weather_suitable", filters.weather);
      }
      if (filters.rating && filters.rating !== "") {
        params.append("min_rating", filters.rating);
      }

      const config = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const url = `${API_BASE_URL}${endpoint}?${params}`;
      console.log("API: Making get all request to:", url);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API: Get all response:", {
        success: data.success,
        dataLength: data.data?.length || 0,
        totalCount: data.pagination?.total_count || 0,
      });

      // Process image URLs in the response
      if (data.data && Array.isArray(data.data)) {
        data.data = processProducts(data.data);
      }

      return data;
    } catch (error) {
      console.error("Error getting all products at once:", error);
      throw error;
    }
  }

  // Get seller profile
  async getSellerProfile(sellerId) {
    try {
      const token = localStorage.getItem("token");
      const endpoint = token
        ? `/clothes/seller/${sellerId}`
        : `/clothes/seller/public/${sellerId}`;

      const config = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching seller profile:", error);
      throw error;
    }
  }

  // Get seller products
  async getSellerProducts(sellerId, limit = 50, offset = 0) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sellers/${sellerId}/products?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Process image URLs in the response
      if (data.data && Array.isArray(data.data)) {
        data.data = processProducts(data.data);
      }

      return data;
    } catch (error) {
      console.error("Error fetching seller products:", error);
      throw error;
    }
  }

  // Legacy methods for backward compatibility
  async searchClothesWithSellers(query, limit, offset) {
    return this.searchProductsUnlimited(query);
  }

  async searchClothesWithSellersPublic(query, limit, offset) {
    return this.searchProductsUnlimited(query);
  }
}

export const clothingAPI = new ClothingAPI();
