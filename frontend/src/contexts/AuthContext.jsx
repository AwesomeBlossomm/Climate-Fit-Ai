import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null); // Add token state

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem("access_token");
        const userData = localStorage.getItem("user");

        if (storedToken && userData) {
          try {
            // Set token first
            setToken(storedToken);

            // Verify token is still valid
            const profile = await authAPI.getProfile();
            setUser(profile);
            setIsAuthenticated(true);
          } catch (error) {
            // Token is invalid, clear it
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setUser(null);
            setIsAuthenticated(false);
            setToken(null);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setToken(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        setIsAuthenticated(false);
        setToken(null);
      } finally {
        setLoading(false); // Ensure loading is always set to false
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token, token_type } = response;

      if (!access_token) {
        throw new Error("No access token received");
      }

      // Store token
      localStorage.setItem("access_token", access_token);
      setToken(access_token); // Set token in state

      // Get user profile
      const userData = await authAPI.getProfile();
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed";

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      return { success: true };
    } catch (error) {
      let errorMessage = "Registration failed";

      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors
          errorMessage = error.response.data.detail
            .map((err) => err.msg)
            .join(", ");
        } else {
          errorMessage = error.response.data.detail;
        }
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setToken(null); // Clear token from state
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  };

  const value = {
    isAuthenticated,
    user,
    token, // Add token to the context value
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
