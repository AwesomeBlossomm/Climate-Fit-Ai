import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Paper,
  Button,
  Alert,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { ArrowBack, Refresh } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";

const PaymentManager = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [activeShippingTab, setActiveShippingTab] = useState(0);
  const [payments, setPayments] = useState({
    pending: [],
    processing: [],
    completed: [],
    cancelled: [],
    refunded: [],
  });
  const [shippingPayments, setShippingPayments] = useState({
    not_shipped: [],
    preparing: [],
    shipped: [],
    in_transit: [],
    out_for_delivery: [],
    delivered: [],
    returned: [],
  });
  const [loading, setLoading] = useState(true);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingDataLoaded, setShippingDataLoaded] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState(0); // 0 = Payment Status, 1 = Shipping Status

  const paymentStatuses = [
    { value: "pending", label: "Pending", color: "#ff9800" },
    { value: "processing", label: "Processing", color: "#2196f3" },
    { value: "completed", label: "Completed", color: "#4caf50" },
    { value: "cancelled", label: "Cancelled", color: "#f44336" },
    { value: "refunded", label: "Refunded", color: "#9c27b0" },
  ];

  const shippingStatuses = [
    { value: "not_shipped", label: "Not Shipped", color: "#757575" },
    { value: "preparing", label: "Preparing", color: "#ff9800" },
    { value: "shipped", label: "Shipped", color: "#2196f3" },
    { value: "in_transit", label: "In Transit", color: "#673ab7" },
    { value: "out_for_delivery", label: "Out for Delivery", color: "#ff5722" },
    { value: "delivered", label: "Delivered", color: "#4caf50" },
    { value: "returned", label: "Returned", color: "#f44336" },
  ];

  useEffect(() => {
    fetchPayments();
    // Remove automatic shipping data fetch - load only when needed
  }, [token]);

  const fetchPayments = async () => {
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        "http://localhost:8000/api/v1/payment-status-overview",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      // Structure the payments data from the API response
      const structuredPayments = {
        pending: data.status_breakdown.PENDING.payments || [],
        processing: data.status_breakdown.PROCESSING.payments || [],
        completed: data.status_breakdown.COMPLETED.payments || [],
        cancelled: data.status_breakdown.CANCELLED.payments || [],
        refunded: data.status_breakdown.REFUNDED.payments || [],
      };

      setPayments(structuredPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      if (error.response?.status === 401) {
        setError("Authentication expired. Please log in again.");
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 2000);
      } else {
        setError(
          error.response?.data?.detail ||
            "Failed to fetch payments. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a debug function to test the connection
  const testPaymentsConnection = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/debug/routes",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Debug routes response:", response.data);
    } catch (error) {
      console.error("Debug routes error:", error);
    }
  };

  // Add a comprehensive debug function
  const debugAllRoutes = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/debug/all-routes",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("All available routes:", response.data);

      // Check if our specific route exists
      const shippingRoute = response.data.routes.find(
        (route) => route.path === "/api/v1/payments/all-shipping-statuses"
      );
      console.log("Shipping status route found:", shippingRoute);
    } catch (error) {
      console.error("Debug all routes error:", error);
    }
  };

  // Update fetchAllShippingStatusPayments with better error handling
  const fetchAllShippingStatusPayments = async () => {
    if (!token) {
      setError("No authentication token found");
      return;
    }

    try {
      setShippingLoading(true);
      setError(null);

      console.log("Attempting to fetch shipping status payments...");

      // Debug all routes first
      await debugAllRoutes();

      // Test the debug endpoint
      await testPaymentsConnection();

      console.log("Making request to shipping endpoint...");
      const response = await axios.get(
        "http://localhost:8000/api/v1/payments/all-shipping-statuses",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("Shipping status response:", response.data);

      if (response.data && response.data.success) {
        const shippingData = response.data.shipping_data;

        // Transform the data to match our component state structure
        const transformedData = {};
        for (const status of shippingStatuses) {
          transformedData[status.value] =
            shippingData[status.value]?.payments || [];
        }

        setShippingPayments(transformedData);
        setShippingDataLoaded(true);
        console.log("Successfully loaded shipping data:", transformedData);
      } else {
        console.error("Invalid response structure:", response.data);
        setError("Failed to fetch shipping status payments - invalid response");
      }
    } catch (error) {
      console.error("Error fetching all shipping status payments:", error);

      if (error.response?.status === 404) {
        setError(
          `Shipping status endpoint not found (404). URL: ${error.config?.url}. Please check if the backend payments router is properly registered.`
        );
      } else if (error.response?.status === 401) {
        setError("Authentication expired. Please log in again.");
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 2000);
      } else if (error.response?.status === 500) {
        setError(
          `Server error: ${
            error.response?.data?.detail || "Internal server error"
          }`
        );
      } else if (error.code === "ECONNREFUSED") {
        setError(
          "Cannot connect to server. Please ensure the backend is running on port 8000."
        );
      } else if (error.code === "ECONNABORTED") {
        setError("Request timed out. The server may be slow or unresponsive.");
      } else {
        setError(
          error.response?.data?.detail ||
            error.message ||
            "Failed to fetch shipping status payments. Please try again."
        );
      }
    } finally {
      setShippingLoading(false);
    }
  };

  // Remove fetchShippingPayments function and replace with optimized version
  const fetchPaymentsByShippingStatus = async (shippingStatus) => {
    if (!token) {
      setError("No authentication token found");
      return [];
    }

    try {
      const response = await axios.get(
        `http://localhost:8000/api/v1/payments/shipping-status/${shippingStatus}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        return response.data.payments || [];
      } else {
        console.error("Failed to fetch payments by shipping status");
        return [];
      }
    } catch (error) {
      console.error(`Error fetching ${shippingStatus} payments:`, error);
      if (error.response?.status === 401) {
        setError("Authentication expired. Please log in again.");
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 2000);
      } else {
        setError(
          error.response?.data?.detail ||
            `Failed to fetch ${shippingStatus} payments. Please try again.`
        );
      }
      return [];
    }
  };

  // New function to refresh specific shipping status
  const refreshShippingStatus = async (shippingStatus) => {
    if (!token) return;

    try {
      const payments = await fetchPaymentsByShippingStatus(shippingStatus);
      setShippingPayments((prev) => ({
        ...prev,
        [shippingStatus]: payments,
      }));
    } catch (error) {
      console.error(`Error refreshing ${shippingStatus} payments:`, error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleShippingTabChange = (event, newValue) => {
    setActiveShippingTab(newValue);
  };

  const handleMainTabChange = (event, newValue) => {
    setActiveMainTab(newValue);
    // Load shipping data when switching to shipping tab
    if (newValue === 1 && !shippingDataLoaded) {
      fetchAllShippingStatusPayments();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getFilteredPayments = () => {
    const currentStatus = paymentStatuses[activeTab].value;
    return Array.isArray(payments[currentStatus])
      ? payments[currentStatus]
      : [];
  };

  const getAllPayments = () => {
    return [
      ...payments.pending,
      ...payments.processing,
      ...payments.completed,
      ...payments.cancelled,
      ...payments.refunded,
    ];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `₱${Number(amount).toFixed(2)}`;
  };

  const getStatusChip = (status) => {
    // Handle undefined/null status
    if (!status) {
      return (
        <Chip
          label="UNKNOWN"
          sx={{
            bgcolor: "#757575",
            color: "white",
            fontWeight: "bold",
            fontSize: "0.75rem",
          }}
          size="small"
        />
      );
    }

    const statusInfo = paymentStatuses.find(
      (s) => s.value === status.toLowerCase()
    );
    return (
      <Chip
        label={status.toUpperCase()}
        sx={{
          bgcolor: statusInfo?.color || "#757575",
          color: "white",
          fontWeight: "bold",
          fontSize: "0.75rem",
        }}
        size="small"
      />
    );
  };

  const getFilteredShippingPayments = () => {
    const currentStatus = shippingStatuses[activeShippingTab].value;
    return Array.isArray(shippingPayments[currentStatus])
      ? shippingPayments[currentStatus]
      : [];
  };

  const getShippingStatusChip = (status) => {
    if (!status) {
      return (
        <Chip
          label="UNKNOWN"
          sx={{
            bgcolor: "#757575",
            color: "white",
            fontWeight: "bold",
            fontSize: "0.75rem",
          }}
          size="small"
        />
      );
    }

    const statusInfo = shippingStatuses.find(
      (s) => s.value === status.toLowerCase()
    );
    return (
      <Chip
        label={status.replace(/_/g, " ").toUpperCase()}
        sx={{
          bgcolor: statusInfo?.color || "#757575",
          color: "white",
          fontWeight: "bold",
          fontSize: "0.75rem",
        }}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress size={60} sx={{ color: "#2e7d32" }} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading payments...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate("/dashboard")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Order Manager
          </Typography>
          <IconButton color="inherit" onClick={fetchPayments}>
            <Refresh />
          </IconButton>
          <Button color="inherit" onClick={() => navigate("/products")}>
            Products
          </Button>
          <Button color="inherit" onClick={() => navigate("/cart")}>
            Cart
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            {error.includes("Authentication expired") && (
              <Button
                color="inherit"
                onClick={() => navigate("/login")}
                sx={{ ml: 2 }}
              >
                Go to Login
              </Button>
            )}
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Payment Status Section */}
          {activeMainTab === 0 && (
            <Paper
              elevation={3}
              sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  bgcolor: "#1976d2",
                  "& .MuiTab-root": {
                    color: "white",
                    fontWeight: "bold",
                  },
                  "& .Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {paymentStatuses.map((status, index) => (
                  <Tab
                    key={status.value}
                    label={`${status.label} (${
                      Array.isArray(payments[status.value])
                        ? payments[status.value].length
                        : 0
                    })`}
                  />
                ))}
              </Tabs>

              <Box sx={{ p: 3 }}>
                {getFilteredPayments().length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      No {paymentStatuses[activeTab].label.toLowerCase()}{" "}
                      payments found
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={fetchPayments}
                      sx={{ mt: 2 }}
                      startIcon={<Refresh />}
                    >
                      Refresh
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <strong>Payment ID</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Amount</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Payment Method</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Status</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Shipping Status</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Date</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getFilteredPayments().map((payment) => (
                          <TableRow
                            key={payment.payment_id}
                            sx={{
                              "&:hover": { bgcolor: "#f5f5f5" },
                              cursor: "pointer",
                            }}
                          >
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: "monospace" }}
                              >
                                {payment.payment_id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(payment.total_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  payment.payment_method?.toUpperCase() || "N/A"
                                }
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {getStatusChip(payment.payment_status)}
                            </TableCell>
                            <TableCell>
                              {getShippingStatusChip(
                                payment.shipping_status || "not_shipped"
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(payment.created_at)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Paper>
          )}

          {/* Payment Summary Cards - Show only on Payment Status tab */}
          {activeMainTab === 0 && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {paymentStatuses.map((status) => {
                const statusPayments = Array.isArray(payments[status.value])
                  ? payments[status.value]
                  : [];
                const totalAmount = statusPayments.reduce(
                  (sum, payment) => sum + Number(payment.total_amount || 0),
                  0
                );

                return (
                  <Grid item xs={12} sm={6} md={2.4} key={status.value}>
                    <Card
                      sx={{
                        borderTop: `4px solid ${status.color}`,
                        cursor: "pointer",
                        "&:hover": { boxShadow: 4 },
                      }}
                      onClick={() => {
                        const tabIndex = paymentStatuses.findIndex(
                          (s) => s.value === status.value
                        );
                        setActiveTab(tabIndex);
                      }}
                    >
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography variant="h4" fontWeight="bold">
                          {statusPayments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {status.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ mt: 1 }}
                        >
                          {formatCurrency(totalAmount)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {/* Shipping Summary Cards - Show only on Shipping Status tab */}
          {activeMainTab === 1 && shippingDataLoaded && (
            <Grid container spacing={3}>
              {shippingStatuses.map((status) => {
                const statusPayments = Array.isArray(
                  shippingPayments[status.value]
                )
                  ? shippingPayments[status.value]
                  : [];
                const totalAmount = statusPayments.reduce(
                  (sum, payment) => sum + Number(payment.total_amount || 0),
                  0
                );

                return (
                  <Grid item xs={12} sm={6} md={1.7} key={status.value}>
                    <Card
                      sx={{
                        borderTop: `4px solid ${status.color}`,
                        cursor: "pointer",
                        "&:hover": { boxShadow: 4 },
                      }}
                      onClick={() => {
                        const tabIndex = shippingStatuses.findIndex(
                          (s) => s.value === status.value
                        );
                        setActiveShippingTab(tabIndex);
                      }}
                    >
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h5" fontWeight="bold">
                          {statusPayments.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {status.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          sx={{ mt: 0.5, display: "block" }}
                        >
                          {formatCurrency(totalAmount)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </motion.div>
      </Container>
    </Box>
  );
};

export default PaymentManager;
