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
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { 
  Store, 
  Dashboard as DashboardIcon, 
  Person, 
  Inventory as ShoppingBag, 
  BarChart,
  Email,
  Phone,
  Category,
  People,
  ShoppingCart
} from "@mui/icons-material";

const SellerTable = () => {
  const [sellers, setSellers] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/sellers");
        setSellers(response.data.sellers || []);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };

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
            onClick={() => navigate("/admin/dashboard")}
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
              ADMIN - SELLER MANAGEMENT
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
            to="/admin/products"
            startIcon={<ShoppingBag />}
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
            Products
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
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          {/* Page Header */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            sx={{
              background: "#4a5d3a", // Dark green background matching Dashboard.jsx
              borderRadius: "24px",
              p: 4,
              mb: 4,
              boxShadow: "0 10px 30px rgba(74, 93, 58, 0.3)",
              color: "#ffffff",
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    fontSize: "2rem",
                    mb: 1,
                    lineHeight: 1.2,
                  }}
                >
                  Seller Management 🏪
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "1rem",
                    lineHeight: 1.5,
                  }}
                >
                  Manage seller accounts, store information, and business partnerships
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  p: 3,
                  textAlign: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Store sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {sellers.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Active Sellers
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Sellers Table */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <TableContainer 
              component={Paper} 
              sx={{ 
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                overflow: "hidden",
                border: "1px solid rgba(74, 93, 58, 0.1)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      background: "linear-gradient(135deg, #8fa876 0%, #7a956a 100%)",
                      "& .MuiTableCell-head": {
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "1rem",
                        borderBottom: "none",
                        py: 3,
                      },
                    }}
                  >
                    <TableCell>Store</TableCell>
                    <TableCell>Seller ID</TableCell>
                    <TableCell>Store Name</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Specialization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sellers.map((seller, index) => (
                    <TableRow 
                      key={seller._id}
                      component={motion.tr}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "rgba(143, 168, 118, 0.05)",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(143, 168, 118, 0.1)",
                          transform: "scale(1.01)",
                        },
                        transition: "all 0.2s ease",
                        "& .MuiTableCell-root": {
                          borderBottom: "1px solid rgba(74, 93, 58, 0.1)",
                          py: 2,
                        },
                      }}
                    >
                      <TableCell>
                        <Avatar
                          sx={{
                            backgroundColor: "#8fa876",
                            color: "#ffffff",
                            fontWeight: 700,
                          }}
                        >
                          {seller.store_name?.charAt(0).toUpperCase() || "S"}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            color: "#4a5d3a",
                            fontWeight: 600,
                          }}
                        >
                          {seller._id?.slice(-8) || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: "#2c3e2c",
                              mb: 0.5,
                            }}
                          >
                            {seller.store_name || "N/A"}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Email sx={{ fontSize: 14, color: "#6b8459" }} />
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b8459" }}
                            >
                              {seller.email || "No email"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: "#2c3e2c",
                            mb: 0.5,
                          }}
                        >
                          {seller.owner_full_name || "N/A"}
                        </Typography>
                        {seller.contact_number && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Phone sx={{ fontSize: 14, color: "#6b8459" }} />
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b8459" }}
                            >
                              {seller.contact_number}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "#4a5d3a" }}
                        >
                          {seller.email || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {seller.specializes_in && seller.specializes_in.length > 0 ? (
                            seller.specializes_in.map((specialization, idx) => (
                              <Chip
                                key={idx}
                                label={specialization}
                                size="small"
                                sx={{
                                  backgroundColor: `rgba(143, 168, 118, ${0.2 + (idx * 0.1)})`,
                                  color: "#4a5d3a",
                                  fontWeight: 500,
                                  fontSize: "0.75rem",
                                }}
                              />
                            ))
                          ) : (
                            <Chip
                              label="General"
                              size="small"
                              sx={{
                                backgroundColor: "rgba(158, 158, 158, 0.2)",
                                color: "#757575",
                                fontWeight: 500,
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Empty State */}
            {sellers.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  background: "#ffffff",
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                  border: "1px solid rgba(74, 93, 58, 0.1)",
                  mt: 4,
                }}
              >
                <Store sx={{ fontSize: 64, color: "#8fa876", mb: 2 }} />
                <Typography
                  variant="h6"
                  sx={{ color: "#4a5d3a", fontWeight: 600, mb: 1 }}
                >
                  No Sellers Found
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b8459" }}>
                  There are currently no sellers registered in the system.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default SellerTable;
