import React from "react";
import {
  Box,
  Typography,
  Button,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  LocalOffer,
  Storefront,
} from "@mui/icons-material";
import WeatherMapSection from "../components/WeatherMapSection";
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const quickActions = [
    {
      title: "Browse Products",
      description: "Explore our eco-friendly product collection",
      icon: <Storefront sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/products"),
      gradient: "linear-gradient(135deg, #8fa876 0%, #7a956a 100%)",
    },
    {
      title: "View Discounts",
      description: "Check out available offers and discounts", 
      icon: <LocalOffer sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/discounts"),
      gradient: "linear-gradient(135deg, #7a956a 0%, #6b8459 100%)",
    },
    {
      title: "Shopping Cart",
      description: "Review items in your cart",
      icon: <ShoppingCart sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/cart"),
      gradient: "linear-gradient(135deg, #6b8459 0%, #5c7349 100%)",
    },
    {
      title: "3D Body Scan",
      description: "Explore the Modern way of Shopping",
      icon: <SensorOccupiedIcon sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/bodyscan"),
      gradient: "linear-gradient(135deg, #5c7349 0%, #4a5d3a 100%)",
    },
  ];

  return (
    <>
      {/* Header with Home.jsx styling */}
      <Box
        component="header"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        sx={{
          px: 4,
          py: 2,
          backgroundColor: "#4a5d3a", // Dark green matching Home.jsx
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1100,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* Logo and Title */}
        <Box display="flex" alignItems="center">
          <Box
            display="flex"
            alignItems="center"
            sx={{
              textDecoration: "none",
              cursor: "pointer",
              "&:hover": {
                opacity: 0.9,
              },
              transition: "opacity 0.2s ease",
            }}
          >
            <Box
              component="img"
              src="src/assets/ClimateFitLogo.png"
              alt="Climate Fit Logo"
              sx={{
                width: "50px",
                height: "30px",
                objectFit: "cover",
                mr: 2,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 1.5,
                color: "#ffffff",
                fontSize: "1.2rem",
              }}
            >
              CLIMATE FIT DASHBOARD
            </Typography>
          </Box>
        </Box>

        {/* Header Actions */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            onClick={() => navigate("/products")}
            variant="outlined"
            sx={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "2px solid #ffffff",
              borderRadius: "25px",
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.9rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#ffffff",
              },
            }}
          >
            Shop Now
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            sx={{
              backgroundColor: "#8fa876", // Light green matching Home.jsx
              color: "#ffffff",
              borderRadius: "25px",
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.9rem",
              "&:hover": {
                backgroundColor: "#7a956a",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content with Home.jsx background */}
      <Box 
        sx={{ 
          pt: 12, // Account for fixed header height
          mt: 10, // Add top margin for extra spacing
          minHeight: "100vh",
          backgroundColor: "#f0f8f0", // Light green background matching Home.jsx
          background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)", // Light green gradient matching Home.jsx
          px: { xs: 2, md: 4 },
          py: 4,
        }}
      >
        {/* Content Container */}
        <Box
          sx={{
            display: "flex",
            gap: 4,
            maxWidth: 1400,
            mx: "auto",
          }}
        >
          {/* Welcome Section - Left Side */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            sx={{
              background: "#4a5d3a", // Dark green background matching Home.jsx
              borderRadius: "24px",
              p: 4,
              boxShadow: "0 10px 30px rgba(74, 93, 58, 0.3)",
              flex: "0 0 400px",
              height: "fit-content",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "#ffffff",
                fontSize: "2rem",
                mb: 2,
                lineHeight: 1.2,
              }}
            >
              Welcome Back! 🌱
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                mb: 3,
                fontSize: "1rem",
                lineHeight: 1.5,
              }}
            >
              Hello, {user?.full_name || user?.username}! Ready to make sustainable fashion choices today?
            </Typography>

            {/* User Info Cards */}
            <Box sx={{ space: 2 }}>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  p: 2,
                  mb: 2,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.75rem" }}>
                  Username
                </Typography>
                <Typography variant="body1" sx={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem" }}>
                  {user?.username}
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  p: 2,
                  mb: 2,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.75rem" }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem" }}>
                  {user?.email}
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  p: 2,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.75rem" }}>
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem" }}>
                  {user?.full_name}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Weather Section - Right Side */}
          <Box sx={{ flex: 1 }}>
            <WeatherMapSection />
          </Box>
        </Box>

        {/* Quick Actions Section */}
        <Box sx={{ mt: 6, maxWidth: 1400, mx: "auto" }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 700,
              color: "#4a5d3a", // Dark green matching Home.jsx
              mb: 4,
              fontSize: "1.5rem",
              letterSpacing: 1,
            }}
          >
            QUICK ACTIONS
          </Typography>

          {/* Quick Actions Cards in One Row */}
          <Box
            sx={{
              display: "flex",
              gap: 3,
              justifyContent: "center",
              flexWrap: "nowrap", // Ensure cards stay in one line
            }}
          >
            {quickActions.map((action, index) => (
              <Box
                key={index}
                component={motion.div}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.97 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  hover: { duration: 0.2 }
                }}
                onClick={action.action}
                sx={{
                  borderRadius: "20px",
                  background: action.gradient,
                  boxShadow: "0 8px 25px rgba(74, 93, 58, 0.25)",
                  cursor: "pointer",
                  p: 3,
                  flex: "1", // Equal width for all cards
                  minWidth: 0, // Allow shrinking if needed
                  maxWidth: "250px", // Maximum width to maintain proportion
                  height: "240px", // Fixed height for all cards
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "center",
                  "&:hover": {
                    boxShadow: "0 12px 35px rgba(74, 93, 58, 0.35)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {/* Icon Container */}
                <Box
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    width: 70,
                    height: 70,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                    mb: 2,
                  }}
                >
                  {React.cloneElement(action.icon, { sx: { fontSize: 35, color: "#ffffff" } })}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: "#ffffff", 
                      fontWeight: 700,
                      mb: 1,
                      fontSize: "1.1rem",
                    }}
                  >
                    {action.title}
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: "rgba(255,255,255,0.9)", 
                      fontSize: "0.85rem",
                      lineHeight: 1.3,
                      mb: 2,
                    }}
                  >
                    {action.description}
                  </Typography>
                </Box>

                {/* Action Button */}
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    borderRadius: "16px",
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "0.85rem",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    minWidth: "120px",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Get Started
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
