import React, { useState } from "react";
import PropTypes from "prop-types";
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
  MenuItem, 
  Select,
  Box,
  Chip,
  Avatar,
  IconButton
} from "@mui/material";
import { Link } from "react-router-dom";
import { 
  Receipt,
  Payment,
  Person,
  AttachMoney,
  Check,
  Close,
  Pending,
  Cancel,
  Dashboard as DashboardIcon,
  People,
  Store,
  ShoppingBag,
  BarChart,
  Save
} from "@mui/icons-material";
import { motion } from "framer-motion";

const handleLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

const mockOrders = [
  {
    transaction_id: "PAY12345",
    payment_id: "PAY12345",
    username: "john_doe",
    total_amount: 150.75,
    currency: "USD",
    payment_status: "completed",
  },
  {
    transaction_id: "PAY12345",
    payment_id: "PAY67890",
    username: "jane_smith",
    total_amount: 89.99,
    currency: "USD",
    payment_status: "pending",
  },
];

const OrdersTable = () => {
  const [orders, setOrders] = useState(mockOrders);

  const handleStatusChange = (event, paymentId) => {
    const newStatus = event.target.value;
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.payment_id === paymentId ? { ...order, payment_status: newStatus } : order
      )
    );
  };

  const saveStatus = (paymentId) => {
    const updatedOrder = orders.find((order) => order.payment_id === paymentId);
    console.log("Saving status for order:", updatedOrder);
    // Add API call here to save the updated status to the backend
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return { bg: "rgba(76, 175, 80, 0.2)", color: "#4caf50", icon: <Check sx={{ fontSize: 16 }} /> };
      case "pending":
        return { bg: "rgba(255, 193, 7, 0.2)", color: "#ff9800", icon: <Pending sx={{ fontSize: 16 }} /> };
      case "failed":
        return { bg: "rgba(244, 67, 54, 0.2)", color: "#f44336", icon: <Close sx={{ fontSize: 16 }} /> };
      case "cancelled":
        return { bg: "rgba(158, 158, 158, 0.2)", color: "#9e9e9e", icon: <Cancel sx={{ fontSize: 16 }} /> };
      default:
        return { bg: "rgba(158, 158, 158, 0.2)", color: "#9e9e9e", icon: <Pending sx={{ fontSize: 16 }} /> };
    }
  };

  const getTotalRevenue = () => {
    return orders
      .filter(order => order.payment_status === "completed")
      .reduce((sum, order) => sum + order.total_amount, 0);
  };

  const getPendingCount = () => {
    return orders.filter(order => order.payment_status === "pending").length;
  };

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
              ADMIN - ORDER MANAGEMENT
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
              <Receipt sx={{ fontSize: 40, color: "#ffffff" }} />
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
                Order Management 🛒
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "1rem",
                  lineHeight: 1.5,
                }}
              >
                Monitor and manage customer orders, payments, and transaction statuses
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 3,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  px: 3,
                  py: 2,
                  backdropFilter: "blur(10px)",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "1.3rem",
                  }}
                >
                  {orders.length}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.75rem",
                  }}
                >
                  Total Orders
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  px: 3,
                  py: 2,
                  backdropFilter: "blur(10px)",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "1.3rem",
                  }}
                >
                  ${getTotalRevenue().toFixed(2)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.75rem",
                  }}
                >
                  Total Revenue
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  px: 3,
                  py: 2,
                  backdropFilter: "blur(10px)",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "1.3rem",
                  }}
                >
                  {getPendingCount()}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.75rem",
                  }}
                >
                  Pending Orders
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Orders Table */}
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
                      <Receipt sx={{ fontSize: 20 }} />
                      Transaction
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
                      <Person sx={{ fontSize: 20 }} />
                      Customer
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
                      Amount
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
                      <Payment sx={{ fontSize: 20 }} />
                      Status
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
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                          color: "#4a5d3a",
                        }}
                      >
                        <Receipt sx={{ fontSize: 60, opacity: 0.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          No Orders Found
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          Orders will appear here once customers make purchases
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order, index) => (
                    <TableRow 
                      key={order.payment_id}
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
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: "#4a5d3a",
                              fontSize: "0.9rem",
                            }}
                          >
                            {order.transaction_id}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(74, 93, 58, 0.6)",
                              fontSize: "0.75rem",
                              fontFamily: "monospace",
                            }}
                          >
                            ID: {order.payment_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              bgcolor: "#8fa876",
                              width: 35,
                              height: 35,
                              fontSize: "0.9rem",
                              fontWeight: 600,
                            }}
                          >
                            {order.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                color: "#4a5d3a",
                                fontSize: "0.9rem",
                              }}
                            >
                              {order.username}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(74, 93, 58, 0.7)",
                                fontSize: "0.75rem",
                              }}
                            >
                              Customer
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: "#4a5d3a",
                              fontSize: "1rem",
                            }}
                          >
                            ${order.total_amount.toFixed(2)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(74, 93, 58, 0.6)",
                              fontSize: "0.75rem",
                            }}
                          >
                            {order.currency}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Select
                          value={order.payment_status}
                          onChange={(event) => handleStatusChange(event, order.payment_id)}
                          size="small"
                          sx={{
                            minWidth: 120,
                            backgroundColor: getStatusColor(order.payment_status).bg,
                            color: getStatusColor(order.payment_status).color,
                            borderRadius: "12px",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "transparent",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: getStatusColor(order.payment_status).color,
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: getStatusColor(order.payment_status).color,
                            },
                          }}
                        >
                          <MenuItem value="pending">
                            <Box display="flex" alignItems="center" gap={1}>
                              <Pending sx={{ fontSize: 16 }} />
                              Pending
                            </Box>
                          </MenuItem>
                          <MenuItem value="completed">
                            <Box display="flex" alignItems="center" gap={1}>
                              <Check sx={{ fontSize: 16 }} />
                              Completed
                            </Box>
                          </MenuItem>
                          <MenuItem value="failed">
                            <Box display="flex" alignItems="center" gap={1}>
                              <Close sx={{ fontSize: 16 }} />
                              Failed
                            </Box>
                          </MenuItem>
                          <MenuItem value="cancelled">
                            <Box display="flex" alignItems="center" gap={1}>
                              <Cancel sx={{ fontSize: 16 }} />
                              Cancelled
                            </Box>
                          </MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Save sx={{ fontSize: 16 }} />}
                          onClick={() => saveStatus(order.payment_id)}
                          sx={{
                            backgroundColor: "#8fa876",
                            color: "#ffffff",
                            borderRadius: "12px",
                            px: 2,
                            py: 1,
                            fontWeight: 600,
                            textTransform: "none",
                            fontSize: "0.8rem",
                            "&:hover": {
                              backgroundColor: "#7a956a",
                            },
                          }}
                        >
                          Save
                        </Button>
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

OrdersTable.propTypes = {
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      transaction_id: PropTypes.string.isRequired,
      payment_id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      total_amount: PropTypes.number.isRequired,
      currency: PropTypes.string.isRequired,
      payment_status: PropTypes.string.isRequired,
      created_at: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default OrdersTable;
