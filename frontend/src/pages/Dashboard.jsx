import React, { useState, useEffect } from "react";
import AddressForm from "../components/AddressForm.jsx";
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
<<<<<<< HEAD
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';
import { motion } from "framer-motion";
=======
import SensorOccupiedIcon from "@mui/icons-material/SensorOccupied";
>>>>>>> cf7914bf3a2bb8df10269ec4b5a60dc25e8d142e

const Dashboard = () => {
  const { user, logout, token } = useAuth(); // Add token to destructuring
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!user || !token) {
      console.log("No user or token found, redirecting to login");
      navigate("/login");
      return;
    }
  }, [user, token, navigate]);

  const handleSaveAddress = (addressData) => {
    // In a real app, you would send this to your backend API
    console.log("Saving address:", addressData);
    setAddresses([...addresses, addressData]);
    // You might want to show a success message here
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    console.log("Selected address:", address);
  };

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

  // Add authentication check before rendering
  if (!user || !token) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Typography>Authenticating...</Typography>
      </Box>
    );
  }

  return (
    <>
<<<<<<< HEAD
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
=======
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ClimateFit Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate("/products")}>
            Shop Now
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
        <Paper
          elevation={3}
          sx={{ p: 4, maxWidth: 1200, mx: "auto", borderRadius: 3 }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#2e7d32" }}
          >
            Welcome to ClimateFit! 🌱
          </Typography>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Hello, {user?.full_name || user?.username}!
          </Typography>

          {/* Weather and Map Section */}
          <WeatherMapSection selectedAddress={selectedAddress} />

          <Box mt={3} mb={4}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Account Information:</strong>
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Username:</strong> {user?.username}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Email:</strong> {user?.email}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Full Name:</strong> {user?.full_name}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <AddressForm onAddressSelect={handleAddressSelect} />
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: "bold", mb: 3 }}
          >
            Quick Actions
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    borderRadius: 2,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Box
                      sx={{
                        bgcolor: action.color,
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                    <Button
                      variant="contained"
                      onClick={action.action}
                      sx={{
                        bgcolor: "#2e7d32",
                        "&:hover": { bgcolor: "#1b5e20" },
                      }}
                    >
                      Get Started
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

>>>>>>> cf7914bf3a2bb8df10269ec4b5a60dc25e8d142e
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
