import React, { useState, useEffect } from "react";
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
  Avatar
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  Receipt,
  AttachMoney,
  Dashboard as DashboardIcon, 
  Store, 
  Inventory as ShoppingBag, 
  BarChart,
  People,
  ShoppingCart,
  Person,
  LocalShipping
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/orders");
        const updatedOrders = response.data.orders.map((order) => ({
          ...order,
          payment_details: order.payment_details || {}, // Ensure payment_details exists
        }));
        setOrders(updatedOrders);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch orders.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = (event, paymentId) => {
    const newStatus = event.target.value;
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.payment_id === paymentId
          ? { ...order, payment_status: newStatus, reason: newStatus === "failed" ? "" : order.reason }
          : order
      )
    );
  };

  const handleReasonChange = (event, paymentId) => {
    const reason = event.target.value;
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.payment_id === paymentId ? { ...order, reason } : order
      )
    );
  };

  const saveStatus = async (paymentId) => {
    const updatedOrder = orders.find((order) => order.payment_id === paymentId);
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/update-payment-status/${paymentId}`, {
        status: updatedOrder.payment_status,
        reason: updatedOrder.reason,
      });
      alert("Status updated successfully.");
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleShippingStatusChange = (event, paymentId) => {
    const newShippingStatus = event.target.value;
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.payment_id === paymentId ? { ...order, shipping_status: newShippingStatus } : order
      )
    );
  };

  const saveShippingStatus = async (paymentId) => {
    const updatedOrder = orders.find((order) => order.payment_id === paymentId);
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/update-shipping-status/${paymentId}`, {
        shipping_status: updatedOrder.shipping_status,
      });
      alert("Shipping status updated successfully.");
    } catch (err) {
      alert("Failed to update shipping status.");
    }
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
          backgroundColor: "#4a5d3a", // Dark green matching ProductTable.jsx
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

      {/* Main Content with ProductTable.jsx background */}
      <Box
        sx={{
          pt: 12, // Account for fixed header height
          mt: 10, // Add top margin for extra spacing
          minHeight: "100vh",
          backgroundColor: "#f0f8f0", // Light green background matching ProductTable.jsx
          background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)", // Light green gradient matching ProductTable.jsx
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
              background: "#4a5d3a", // Dark green background matching ProductTable.jsx
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
                Manage order payments, shipping status, and transaction details across the platform
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
                    Payment Status
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
                      <LocalShipping sx={{ fontSize: 20 }} />
                      Shipping Status
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
                    Details
                  </TableCell>
                  <TableCell
                    align="center"
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
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
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
                          {error ? "Error Loading Orders" : "No Orders Found"}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          {error ? error : "There are currently no orders in the system"}
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
                            {order.username ? order.username.charAt(0).toUpperCase() : 'U'}
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
                              {order.username || "N/A"}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(74, 93, 58, 0.7)",
                                fontSize: "0.8rem",
                                fontFamily: "monospace",
                              }}
                            >
                              ID: {order.payment_id}
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
                            ₱{order.total_amount.toFixed(2)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(74, 93, 58, 0.7)",
                              fontSize: "0.8rem",
                            }}
                          >
                            Subtotal: ₱{order.subtotal.toFixed(2)}
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
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '& fieldset': {
                                borderColor: 'rgba(74, 93, 58, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: '#4a5d3a',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#4a5d3a',
                              },
                            },
                          }}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="failed">Failed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                        {order.payment_status === "failed" && (
                          <Box mt={2}>
                            <Typography variant="body2" sx={{ color: "#4a5d3a", mb: 1 }}>
                              Reason for Failure:
                            </Typography>
                            <textarea
                              value={order.reason || ""}
                              onChange={(event) => handleReasonChange(event, order.payment_id)}
                              placeholder="Enter reason for failure"
                              style={{
                                width: "100%",
                                minHeight: "50px",
                                borderRadius: "8px",
                                border: "1px solid rgba(74, 93, 58, 0.3)",
                                padding: "8px",
                                fontSize: "0.9rem",
                                color: "#4a5d3a",
                              }}
                            />
                          </Box>
                        )}
                        {order.payment_status === "failed" && order.payment_details?.failure_reason && (
                          <Box mt={1}>
                            <Typography
                              variant="body2"
                              sx={{ color: "#d32f2f", fontWeight: 600 }}
                            >
                              Failure Reason: {order.payment_details.failure_reason}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Select
                          value={order.shipping_status || "not_shipped"}
                          onChange={(event) => handleShippingStatusChange(event, order.payment_id)}
                          size="small"
                          sx={{
                            minWidth: 120,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '& fieldset': {
                                borderColor: 'rgba(74, 93, 58, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: '#4a5d3a',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#4a5d3a',
                              },
                            },
                          }}
                        >
                          <MenuItem value="not_shipped">Not Shipped</MenuItem>
                          <MenuItem value="shipped">Shipped</MenuItem>
                          <MenuItem value="in_transit">In Transit</MenuItem>
                          <MenuItem value="delivered">Delivered</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: "#4a5d3a", mb: 0.5, lineHeight: 1.2 }}>
                            <strong>Discount:</strong> ₱{order.discount_amount.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#4a5d3a", mb: 0.5, lineHeight: 1.2 }}>
                            <strong>Tax:</strong> ₱{order.tax_amount.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#4a5d3a", lineHeight: 1.2 }}>
                            <strong>Shipping:</strong> ₱{order.shipping_amount.toFixed(2)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 3, borderBottom: "1px solid rgba(74, 93, 58, 0.1)" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => saveStatus(order.payment_id)}
                            sx={{
                              backgroundColor: "#8fa876",
                              color: "#ffffff",
                              "&:hover": {
                                backgroundColor: "#7a956a",
                              },
                              fontSize: "0.75rem",
                              px: 2,
                              py: 0.5,
                              borderRadius: "8px",
                              minWidth: "100px",
                            }}
                          >
                            Save Payment
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => saveShippingStatus(order.payment_id)}
                            sx={{
                              backgroundColor: "#6b8459",
                              color: "#ffffff",
                              "&:hover": {
                                backgroundColor: "#5c7349",
                              },
                              fontSize: "0.75rem",
                              px: 2,
                              py: 0.5,
                              borderRadius: "8px",
                              minWidth: "100px",
                            }}
                          >
                            Save Shipping
                          </Button>
                        </Box>
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

OrdersTable.propTypes = {};

export default OrdersTable;
