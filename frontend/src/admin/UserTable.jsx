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
  IconButton,
  Avatar
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { 
  Person, 
  ToggleOff, 
  ToggleOn, 
  Dashboard as DashboardIcon, 
  Store, 
  Inventory as ShoppingBag, 
  BarChart,
  ArrowBack,
  People,
  ShoppingCart
} from "@mui/icons-material";

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/users");
        setUsers(response.data.users || []); // Extract the users array from the response
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const toggleIsActive = async (userId, currentStatus) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/v1/admin/users/${userId}/is_active`, {
        is_active: !currentStatus,
      });
      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, is_active: !currentStatus } : user
          )
        );
      }
    } catch (error) {
      console.error("Error updating is_active status:", error);
    }
  };

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
              ADMIN - USER MANAGEMENT
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
                  User Management 👥
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "1rem",
                    lineHeight: 1.5,
                  }}
                >
                  Manage user accounts, permissions, and status across the platform
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
                <Person sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {users.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Total Users
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Users Table */}
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
                    <TableCell>Avatar</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow 
                      key={user._id}
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
                            backgroundColor: user.is_active ? "#8fa876" : "#9e9e9e",
                            color: "#ffffff",
                            fontWeight: 700,
                          }}
                        >
                          {user.username?.charAt(0).toUpperCase() || "U"}
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
                          {user._id?.slice(-8) || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: "#2c3e2c",
                          }}
                        >
                          {user.username || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "#4a5d3a" }}
                        >
                          {user.email || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role || "user"}
                          size="small"
                          sx={{
                            backgroundColor: user.role === "admin" 
                              ? "linear-gradient(135deg, #4a5d3a 0%, #5c7349 100%)"
                              : "rgba(143, 168, 118, 0.2)",
                            color: user.role === "admin" ? "#ffffff" : "#4a5d3a",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            backgroundColor: user.is_active 
                              ? "rgba(76, 175, 80, 0.2)" 
                              : "rgba(244, 67, 54, 0.2)",
                            color: user.is_active ? "#4caf50" : "#f44336",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => toggleIsActive(user._id, user.is_active)}
                          sx={{
                            backgroundColor: user.is_active 
                              ? "rgba(244, 67, 54, 0.1)" 
                              : "rgba(76, 175, 80, 0.1)",
                            color: user.is_active ? "#f44336" : "#4caf50",
                            "&:hover": {
                              backgroundColor: user.is_active 
                                ? "rgba(244, 67, 54, 0.2)" 
                                : "rgba(76, 175, 80, 0.2)",
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          {user.is_active ? <ToggleOn /> : <ToggleOff />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Empty State */}
            {users.length === 0 && (
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
                <Person sx={{ fontSize: 64, color: "#8fa876", mb: 2 }} />
                <Typography
                  variant="h6"
                  sx={{ color: "#4a5d3a", fontWeight: 600, mb: 1 }}
                >
                  No Users Found
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b8459" }}>
                  There are currently no users in the system.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default UserTable;
