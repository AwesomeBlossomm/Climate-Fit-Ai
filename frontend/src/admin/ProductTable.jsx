import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Button,
  Box,
  Chip,
  Avatar
} from "@mui/material";
import { Link } from "react-router-dom";
import { 
  Inventory, 
  Category, 
  AttachMoney,
  ShoppingBag,
  Dashboard as DashboardIcon,
  People,
  Store,
  ShoppingCart,
  BarChart
} from "@mui/icons-material";
import { motion } from "framer-motion";

const ProductTable = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/products");
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      {/* Fixed Header */}
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
              ADMIN - PRODUCT MANAGEMENT
            </Typography>
          </Box>
        </Box>

        {/* Header Navigation */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            component={Link}
            to="/admin/dashboard"
            startIcon={<DashboardIcon />}
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
            Dashboard
          </Button>
          <Button
            component={Link}
            to="/admin/users"
            startIcon={<People />}
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
            Users
          </Button>
          <Button
            component={Link}
            to="/admin/sellers"
            startIcon={<Store />}
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
            Sellers
          </Button>
          <Button
            component={Link}
            to="/admin/orders"
            startIcon={<ShoppingCart />}
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
            Orders
          </Button>
          <Button
            component={Link}
            to="/admin/graphs"
            startIcon={<BarChart />}
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
            Analytics
          </Button>
          <Button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/';
            }}
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
        {/* Page Header */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          sx={{
            maxWidth: 1400,
            mx: "auto",
            mb: 4,
          }}
        >
          <Box
            sx={{
              background: "#4a5d3a", // Dark green background matching Dashboard.jsx
              borderRadius: "24px",
              p: 4,
              boxShadow: "0 10px 30px rgba(74, 93, 58, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Box
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Inventory sx={{ fontSize: 40, color: "#ffffff" }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: "#ffffff",
                  fontSize: "2rem",
                  mb: 1,
                  lineHeight: 1.2,
                }}
              >
                Product Management 📦
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "1rem",
                  lineHeight: 1.5,
                }}
              >
                Manage your product catalog, inventory, and pricing across all categories
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  px: 3,
                  py: 1,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "1.5rem",
                  }}
                >
                  {products.length}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.75rem",
                  }}
                >
                  Total Products
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Products Table */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          sx={{
            maxWidth: 1400,
            mx: "auto",
          }}
        >
          <TableContainer 
            component={Paper}
            sx={{
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
              overflow: "hidden",
              background: "#ffffff",
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: "linear-gradient(135deg, #4a5d3a 0%, #5c7349 100%)",
                  }}
                >
                  <TableCell
                    sx={{
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "1rem",
                      borderBottom: "none",
                      py: 3,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <ShoppingBag sx={{ fontSize: 20 }} />
                      Product Info
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "1rem",
                      borderBottom: "none",
                      py: 3,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Category sx={{ fontSize: 20 }} />
                      Category
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "1rem",
                      borderBottom: "none",
                      py: 3,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachMoney sx={{ fontSize: 20 }} />
                      Price
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "1rem",
                      borderBottom: "none",
                      py: 3,
                    }}
                  >
                    Product ID
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                          color: "#4a5d3a",
                        }}
                      >
                        <Inventory sx={{ fontSize: 60, opacity: 0.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          No Products Found
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          Start by adding products to your inventory
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
                    <TableRow 
                      key={product._id}
                      component={motion.tr}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(74, 93, 58, 0.05)",
                        },
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              bgcolor: "#8fa876",
                              width: 40,
                              height: 40,
                              fontSize: "1rem",
                              fontWeight: 600,
                            }}
                          >
                            {product.name ? product.name.charAt(0).toUpperCase() : 'P'}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                color: "#4a5d3a",
                                fontSize: "0.95rem",
                              }}
                            >
                              {product.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(74, 93, 58, 0.7)",
                                fontSize: "0.8rem",
                              }}
                            >
                              Product Item
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Chip
                          label={product.category}
                          sx={{
                            backgroundColor: "rgba(143, 168, 118, 0.2)",
                            color: "#4a5d3a",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            borderRadius: "12px",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            color: "#4a5d3a",
                            fontSize: "1rem",
                          }}
                        >
                          ₱{product.price_php}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(74, 93, 58, 0.6)",
                            fontSize: "0.8rem",
                            fontFamily: "monospace",
                          }}
                        >
                          {product._id}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </>
  );
};

export default ProductTable;
