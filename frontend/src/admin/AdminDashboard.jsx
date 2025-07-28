import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Grid, Card, CardContent } from "@mui/material";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import UserTable from "./UserTable";
import SellerTable from "./SellerTable";
import ProductTable from "./ProductTable";
import { motion } from "framer-motion";
import { Person, Store, Inventory, Assessment, ShoppingCart, TrendingUp, Dashboard as DashboardIcon, People, ShoppingBag, BarChart } from "@mui/icons-material";

const AdminDashboard = () => {
  const { user, logout, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]); 
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Admin quick actions
  const adminActions = [
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: <Person sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/admin/users"),
      gradient: "linear-gradient(135deg, #8fa876 0%, #7a956a 100%)",
      count: users.length,
    },
    {
      title: "Manage Sellers",
      description: "Oversee seller accounts and status",
      icon: <Store sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/admin/sellers"),
      gradient: "linear-gradient(135deg, #7a956a 0%, #6b8459 100%)",
      count: sellers.length,
    },
    {
      title: "Manage Products",
      description: "Control product catalog and inventory",
      icon: <Inventory sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/admin/products"),
      gradient: "linear-gradient(135deg, #6b8459 0%, #5c7349 100%)",
      count: products.length,
    },
    {
      title: "View Analytics",
      description: "Analyze platform performance and trends",
      icon: <Assessment sx={{ fontSize: 40, color: "#ffffff" }} />,
      action: () => navigate("/admin/graphs"),
      gradient: "linear-gradient(135deg, #5c7349 0%, #4a5d3a 100%)",
      count: "Reports",
    },
  ];

  useEffect(() => {
    // Fetch users
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/users");
        console.log(response.data); // Debug log (optional)
        setUsers(response.data.users || []); // Extract the users array from the response
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    // Fetch products
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/products");
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    // Fetch sellers
    const fetchSellers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/sellers");
        setSellers(response.data.sellers || []);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };

    fetchUsers();
    fetchProducts();
    fetchSellers();
  }, []);

  return (
    <>
      <Box
        component="header"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        sx={{
          px: 4,
          py: 2,
          backgroundColor: "#4a5d3a", // Dark green matching Dashboard.jsx
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
              src="/src/assets/ClimateFitLogo.png"
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
              ADMIN - DASHBOARD
            </Typography>
          </Box>
        </Box>

        {/* Header Navigation */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            onClick={handleLogout}
            sx={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "25px",
              px: 2,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.85rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#ffffff",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content with Dashboard.jsx background */}
      <Box
        sx={{
          pt: 12, // Account for fixed header height
          mt: 10, // Add top margin for extra spacing
          minHeight: "100vh",
          backgroundColor: "#f0f8f0", // Light green background matching Dashboard.jsx
          background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)", // Light green gradient matching Dashboard.jsx
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
              background: "#4a5d3a", // Dark green background matching Dashboard.jsx
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
              Admin Control Center 🛠️
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
              Welcome, {user?.full_name || user?.username}! Manage your Climate Fit platform with comprehensive admin tools.
            </Typography>

            {/* Admin Stats Cards */}
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
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.75rem",
                  }}
                >
                  Platform Overview
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  {users.length + sellers.length} Total Users • {products.length} Products
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
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.75rem",
                  }}
                >
                  Admin Role
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  System Administrator
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Quick Actions Grid - Right Side */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Statistics Overview */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "#4a5d3a",
                  mb: 3,
                  fontSize: "1.5rem",
                }}
              >
                Platform Statistics
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      background: "linear-gradient(135deg, #8fa876 0%, #7a956a 100%)",
                      borderRadius: "16px",
                      p: 3,
                      color: "#ffffff",
                      textAlign: "center",
                      boxShadow: "0 8px 25px rgba(143, 168, 118, 0.3)",
                    }}
                  >
                    <Person sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {users.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Users
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      background: "linear-gradient(135deg, #7a956a 0%, #6b8459 100%)",
                      borderRadius: "16px",
                      p: 3,
                      color: "#ffffff",
                      textAlign: "center",
                      boxShadow: "0 8px 25px rgba(122, 149, 106, 0.3)",
                    }}
                  >
                    <Store sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {sellers.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Active Sellers
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      background: "linear-gradient(135deg, #6b8459 0%, #5c7349 100%)",
                      borderRadius: "16px",
                      p: 3,
                      color: "#ffffff",
                      textAlign: "center",
                      boxShadow: "0 8px 25px rgba(107, 132, 89, 0.3)",
                    }}
                  >
                    <Inventory sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {products.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Products Listed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      background: "linear-gradient(135deg, #5c7349 0%, #4a5d3a 100%)",
                      borderRadius: "16px",
                      p: 3,
                      color: "#ffffff",
                      textAlign: "center",
                      boxShadow: "0 8px 25px rgba(92, 115, 73, 0.3)",
                    }}
                  >
                    <TrendingUp sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {((users.length + sellers.length + products.length) / 3).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Growth Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Admin Actions */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "#4a5d3a",
                  mb: 3,
                  fontSize: "1.5rem",
                }}
              >
                Quick Admin Actions
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  justifyContent: "center",
                  flexWrap: "nowrap", // Ensure cards stay in one line
                }}
              >
                {adminActions.map((action, index) => (
                  <Box
                    key={index}
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    onClick={action.action}
                    sx={{
                      background: action.gradient,
                      borderRadius: "20px",
                      boxShadow: "0 10px 30px rgba(74, 93, 58, 0.25)",
                      cursor: "pointer",
                      p: 3,
                      flex: "1", // Equal width for all cards
                      minWidth: 0, // Allow shrinking if needed
                      maxWidth: "280px", // Maximum width to maintain proportion
                      height: "200px", // Fixed height for all cards
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      color: "#ffffff",
                      transform: "translateY(0)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-8px)",  
                        boxShadow: "0 15px 40px rgba(74, 93, 58, 0.35)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        mb: 2,
                      }}
                    >
                      {action.icon}
                      <Typography
                        variant="h6"
                        sx={{
                          color: "rgba(255, 255, 255, 0.8)",
                          fontSize: "1.2rem",
                          fontWeight: 600,
                        }}
                      >
                        {typeof action.count === 'number' ? action.count : action.count}
                      </Typography>
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        fontSize: "1.1rem",
                      }}
                    >
                      {action.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.9rem",
                        lineHeight: 1.4,
                      }}
                    >
                      {action.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Optional: Uncomment to show data tables */}
        {/* 
        <Box sx={{ mt: 6, maxWidth: 1400, mx: "auto" }}>
          <UserTable users={users} />
          <ProductTable products={products} />
          <SellerTable sellers={sellers} />
        </Box>
        */}
      </Box>
    </>
  );
};

export default AdminDashboard;
