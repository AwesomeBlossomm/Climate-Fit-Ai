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
  // AppBar,
  // Toolbar,
  // IconButton,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ArrowBack,
  Refresh,
  Dashboard,
  ShoppingCart,
  Store,
  Receipt,
  LocalShipping,
  QrCode,
  Phone,
  ExpandMore,
} from "@mui/icons-material";
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
  const [selectedPayment, setSelectedPayment] = useState(null);

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

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
  };

  const closePaymentDetails = () => {
    setSelectedPayment(null);
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

  // Generate QR code URL
  const generateQRCode = (phoneNumber, amount, sellerName) => {
    const data = `${phoneNumber}\nAmount: ₱${amount.toFixed(
      2
    )}\nSeller: ${sellerName}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      data
    )}`;
  };

  if (loading) {
    return (
      <>
        {/* Fixed Header - Show even during loading */}
        <Box
          component="header"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          sx={{
            px: 4,
            py: 2,
            backgroundColor: "#4a5d3a",
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
              onClick={() => navigate("/dashboard")}
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
                ORDER MANAGER
              </Typography>
            </Box>
          </Box>

          {/* Header Actions - Disabled during loading */}
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              onClick={() => navigate("/dashboard")}
              startIcon={<ArrowBack />}
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
              Back
            </Button>
            <Button
              disabled
              startIcon={<Refresh />}
              variant="outlined"
              sx={{
                backgroundColor: "transparent",
                color: "rgba(255,255,255,0.5)",
                border: "2px solid rgba(255,255,255,0.3)",
                borderRadius: "25px",
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.9rem",
              }}
            >
              Loading...
            </Button>
          </Box>
        </Box>

        {/* Loading Content with ProductTable.jsx style */}
        <Box
          sx={{
            pt: 12,
            mt: 10,
            minHeight: "100vh",
            backgroundColor: "#f0f8f0",
            background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)",
            px: { xs: 2, md: 4 },
            py: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Page Header with loading animation */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            sx={{
              maxWidth: 1400,
              width: "100%",
              mx: "auto",
              mb: 4,
            }}
          >
            <Box
              sx={{
                background: "#4a5d3a",
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
                  Order Manager 📋
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "1rem",
                    lineHeight: 1.5,
                  }}
                >
                  Loading payment data and order information...
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  px: 3,
                  py: 1,
                  backdropFilter: "blur(10px)",
                  textAlign: "center",
                }}
              >
                <CircularProgress size={24} sx={{ color: "#ffffff", mb: 1 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.75rem",
                  }}
                >
                  Loading...
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Loading Content Area */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            sx={{
              maxWidth: 1400,
              width: "100%",
              mx: "auto",
            }}
          >
            <Paper
              sx={{
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                overflow: "hidden",
                background: "#ffffff",
                p: 6,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  color: "#4a5d3a",
                }}
              >
                <CircularProgress size={80} sx={{ color: "#4a5d3a" }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: "#4a5d3a",
                  }}
                >
                  Loading Payment Manager
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      {/* Header with Dashboard.jsx styling */}
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
            onClick={() => navigate("/dashboard")}
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
              ORDER MANAGER
            </Typography>
          </Box>
        </Box>

        {/* Header Actions */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            onClick={() => navigate("/dashboard")}
            startIcon={<ArrowBack />}
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
            Back
          </Button>
          <Button
            onClick={fetchPayments}
            startIcon={<Refresh />}
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
            Refresh
          </Button>
          <Button
            onClick={() => navigate("/products")}
            startIcon={<Store />}
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
            Products
          </Button>
          <Button
            onClick={() => navigate("/cart")}
            startIcon={<ShoppingCart />}
            variant="contained"
            sx={{
              backgroundColor: "#8fa876", // Light green matching Dashboard.jsx
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
            Cart
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
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Page Header with Dashboard.jsx styling */}
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
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box display="flex" alignItems="center" gap={3}>
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
                    Order Manager 📋
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: "1rem",
                      lineHeight: 1.5,
                    }}
                  >
                    Track your orders, payments, and shipping status
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  px: 3,
                  py: 1,
                  backdropFilter: "blur(10px)",
                  textAlign: "center",
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
                  {getAllPayments().length}
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

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(244, 67, 54, 0.2)",
                }}
              >
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

            {/* Payment Status Section */}
            {activeMainTab === 0 && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    borderRadius: "20px",
                    overflow: "hidden",
                    mb: 4,
                    background: "#ffffff",
                    boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                    border: "1px solid rgba(74, 93, 58, 0.1)",
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                      background:
                        "linear-gradient(135deg, #4a5d3a 0%, #5c7349 100%)",
                      "& .MuiTab-root": {
                        color: "#ffffff",
                        fontWeight: 600,
                        py: 2,
                      },
                      "& .Mui-selected": {
                        backgroundColor: "rgba(255,255,255,0.1)",
                      },
                      "& .MuiTabs-indicator": {
                        backgroundColor: "#ffffff",
                        height: 3,
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
                        <Receipt
                          sx={{ fontSize: 64, color: "#8fa876", mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          sx={{ color: "#4a5d3a", fontWeight: 600, mb: 1 }}
                        >
                          No {paymentStatuses[activeTab].label.toLowerCase()}{" "}
                          payments found
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={fetchPayments}
                          sx={{
                            mt: 2,
                            backgroundColor: "#8fa876",
                            color: "#ffffff",
                            borderRadius: "12px",
                            px: 3,
                            py: 1,
                            "&:hover": {
                              backgroundColor: "#7a956a",
                            },
                          }}
                          startIcon={<Refresh />}
                        >
                          Refresh
                        </Button>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow
                              sx={{
                                "& .MuiTableCell-head": {
                                  backgroundColor: "rgba(74, 93, 58, 0.1)",
                                  color: "#4a5d3a",
                                  fontWeight: 700,
                                  borderBottom:
                                    "2px solid rgba(74, 93, 58, 0.2)",
                                },
                              }}
                            >
                              <TableCell>Payment ID</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Payment Method</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Shipping Status</TableCell>
                              <TableCell>Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getFilteredPayments().map((payment, index) => (
                              <TableRow
                                key={payment.payment_id}
                                component={motion.tr}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.5,
                                  delay: index * 0.1,
                                }}
                                sx={{
                                  "&:hover": {
                                    backgroundColor: "rgba(74, 93, 58, 0.05)",
                                    transform: "scale(1.01)",
                                  },
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  "& .MuiTableCell-root": {
                                    borderBottom:
                                      "1px solid rgba(74, 93, 58, 0.1)",
                                  },
                                }}
                                onClick={() => handleRowClick(payment)}
                              >
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontFamily: "monospace",
                                      color: "#4a5d3a",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {payment.payment_id}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 700,
                                      color: "#4a5d3a",
                                    }}
                                  >
                                    {formatCurrency(payment.total_amount)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      payment.payment_method?.toUpperCase() ||
                                      "N/A"
                                    }
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                      borderColor: "#8fa876",
                                      color: "#4a5d3a",
                                      fontWeight: 600,
                                    }}
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
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "#6b8459" }}
                                  >
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
              </Box>
            )}

            {/* Shipping Summary Cards - Show only on Shipping Status tab */}
            {activeMainTab === 1 && shippingDataLoaded && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
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
                            borderRadius: "16px",
                            background: "#ffffff",
                            boxShadow: "0 4px 15px rgba(74, 93, 58, 0.1)",
                            border: "1px solid rgba(74, 93, 58, 0.1)",
                            "&:hover": {
                              boxShadow: "0 8px 25px rgba(74, 93, 58, 0.2)",
                              transform: "translateY(-4px)",
                            },
                            transition: "all 0.3s ease",
                          }}
                          onClick={() => {
                            const tabIndex = shippingStatuses.findIndex(
                              (s) => s.value === status.value
                            );
                            setActiveShippingTab(tabIndex);
                          }}
                        >
                          <CardContent sx={{ textAlign: "center", py: 2 }}>
                            <LocalShipping
                              sx={{ fontSize: 24, color: "#4a5d3a", mb: 1 }}
                            />
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 700,
                                color: "#4a5d3a",
                              }}
                            >
                              {statusPayments.length}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b8459", fontWeight: 600 }}
                            >
                              {status.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                mt: 0.5,
                                display: "block",
                                fontWeight: 700,
                                color: "#4a5d3a",
                              }}
                            >
                              {formatCurrency(totalAmount)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* Payment Details Dialog with QR codes */}
            {selectedPayment && (
              <Dialog
                open={true}
                onClose={closePaymentDetails}
                maxWidth="md"
                fullWidth
                PaperProps={{
                  sx: {
                    borderRadius: "20px",
                    background: "#ffffff",
                    boxShadow: "0 20px 60px rgba(74, 93, 58, 0.3)",
                  },
                }}
              >
                <DialogTitle
                  sx={{
                    backgroundColor: "#4a5d3a",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "1.3rem",
                  }}
                >
                  Payment Details
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                  <Box sx={{ color: "#4a5d3a" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Payment ID: {selectedPayment.payment_id}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography sx={{ color: "#6b8459" }}>
                          <strong>User ID:</strong> {selectedPayment.user_id}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ color: "#6b8459" }}>
                          <strong>Username:</strong> {selectedPayment.username}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ color: "#6b8459" }}>
                          <strong>Subtotal:</strong>{" "}
                          {formatCurrency(selectedPayment.subtotal)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ color: "#6b8459" }}>
                          <strong>Total Amount:</strong>{" "}
                          {formatCurrency(selectedPayment.total_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ color: "#6b8459" }}>
                          <strong>Payment Method:</strong>{" "}
                          {selectedPayment.payment_method}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ color: "#6b8459" }}>
                          <strong>Status:</strong>{" "}
                          {selectedPayment.payment_status}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography sx={{ color: "#6b8459" }}>
                          <strong>Created At:</strong>{" "}
                          {formatDate(selectedPayment.created_at)}
                        </Typography>
                      </Grid>
                      {selectedPayment.notes && (
                        <Grid item xs={12}>
                          <Typography sx={{ color: "#6b8459" }}>
                            <strong>Notes:</strong> {selectedPayment.notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>

                    {/* Show QR codes for GCash/PayMaya payments */}
                    {(selectedPayment.payment_method === "gcash" ||
                      selectedPayment.payment_method === "paymaya") &&
                      selectedPayment.sellers_info &&
                      selectedPayment.sellers_info.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 2,
                            }}
                          >
                            <QrCode sx={{ color: "#4a5d3a" }} />
                            <Typography
                              variant="h6"
                              sx={{ color: "#4a5d3a", fontWeight: 600 }}
                            >
                              Payment QR Codes
                            </Typography>
                          </Box>

                          <Grid container spacing={2}>
                            {selectedPayment.sellers_info.map(
                              (seller, index) => (
                                <Grid
                                  item
                                  xs={12}
                                  md={6}
                                  key={seller.seller_id}
                                >
                                  <Card
                                    sx={{
                                      borderRadius: "12px",
                                      border: "1px solid rgba(74, 93, 58, 0.3)",
                                      background: "rgba(74, 93, 58, 0.05)",
                                    }}
                                  >
                                    <CardContent
                                      sx={{ textAlign: "center", p: 2 }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        sx={{
                                          color: "#4a5d3a",
                                          fontWeight: 600,
                                          mb: 1,
                                        }}
                                      >
                                        {seller.seller_name}
                                      </Typography>

                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 1,
                                          mb: 1,
                                        }}
                                      >
                                        <Phone
                                          sx={{
                                            fontSize: 14,
                                            color: "#6b8459",
                                          }}
                                        />
                                        <Typography
                                          variant="body2"
                                          sx={{ color: "#6b8459" }}
                                        >
                                          {seller.phone_number}
                                        </Typography>
                                      </Box>

                                      <Typography
                                        variant="h6"
                                        sx={{
                                          color: "#4a5d3a",
                                          fontWeight: 700,
                                          mb: 2,
                                        }}
                                      >
                                        {formatCurrency(seller.total_amount)}
                                      </Typography>

                                      <Box
                                        sx={{
                                          display: "flex",
                                          justifyContent: "center",
                                          mb: 1,
                                          p: 1,
                                          backgroundColor: "#ffffff",
                                          borderRadius: "8px",
                                          border:
                                            "1px solid rgba(74, 93, 58, 0.2)",
                                        }}
                                      >
                                        <img
                                          src={generateQRCode(
                                            seller.phone_number,
                                            seller.total_amount,
                                            seller.seller_name
                                          )}
                                          alt={`QR Code for ${seller.seller_name}`}
                                          style={{
                                            width: "120px",
                                            height: "120px",
                                            objectFit: "contain",
                                          }}
                                        />
                                      </Box>

                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "#6b8459",
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        Scan with{" "}
                                        {selectedPayment.payment_method ===
                                        "gcash"
                                          ? "GCash"
                                          : "PayMaya"}
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              )
                            )}
                          </Grid>
                        </Box>
                      )}
                  </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                  <Button
                    onClick={closePaymentDetails}
                    variant="contained"
                    sx={{
                      backgroundColor: "#8fa876",
                      color: "#ffffff",
                      borderRadius: "12px",
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: "#7a956a",
                      },
                    }}
                  >
                    Close
                  </Button>
                </DialogActions>
              </Dialog>
            )}
          </motion.div>
        </Container>
      </Box>
    </>
  );
};

export default PaymentManager;
