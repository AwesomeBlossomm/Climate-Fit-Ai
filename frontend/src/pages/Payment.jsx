import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  CardMedia,
} from "@mui/material";
import {
  Payment,
  AccountBalance,
  CheckCircle,
  Store,
  LocationOn,
  MoreVert,
  Visibility,
  ArrowBack,
  CreditCard,
  Security,
  ShoppingCart,
  Dashboard,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useSnackbar } from "notistack";
import { discountAPI } from "../services/discountApi";

const API_BASE_URL = "http://localhost:8000/api/v1";

const PaymentPage = () => {
  const { user, logout, token } = useAuth();
  debugger;
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar
    ? useSnackbar()
    : { enqueueSnackbar: () => {} };

  // Get cart data from navigation state
  const {
    cartItems = [],
    subtotal = 0,
    discount = 0,
    total = 0,
    appliedDiscount,
  } = location.state || {};

  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [billingInfo, setBillingInfo] = useState({});
  const [cardInfo, setCardInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [error, setError] = useState("");
  const [appliedDiscountInfo, setAppliedDiscountInfo] = useState(null);
  const [discountError, setDiscountError] = useState("");

  // Voucher selection state
  const [clothesVouchers, setClothesVouchers] = useState([]);
  const [shippingVouchers, setShippingVouchers] = useState([]);
  const [selectedClothesVoucher, setSelectedClothesVoucher] = useState(null);
  const [selectedShippingVoucher, setSelectedShippingVoucher] = useState(null);

  // Discount logic
  const [clothesDiscountInfo, setClothesDiscountInfo] = useState(null);
  const [shippingDiscountInfo, setShippingDiscountInfo] = useState(null);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false); // Add modal state

  // Notes state
  const [buyerNotes, setBuyerNotes] = useState(""); // Add state for notes

  const steps = ["Billing Information", "Payment Method", "Review Order"];

  // Helper function to format address like in Dashboard
  const formatAddress = (address) => {
    const parts = [
      address.street,
      address.barangay?.match(/^\d+$/) ? `Barangay ${address.barangay}` : address.barangay,
      address.city,
      address.province,
      address.region,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const handleBillingChange = (field, value) => {
    setBillingInfo({ ...billingInfo, [field]: value });
  };

  const handleCardChange = (field, value) => {
    setCardInfo({ ...cardInfo, [field]: value });
  };

  // Validation for Billing Information step
  const validateStep = () => {
    switch (activeStep) {
      case 0:
        // Require fullName, email, and address to be non-empty and not just whitespace
        return (
          billingInfo.fullName &&
          billingInfo.fullName.trim() !== "" &&
          billingInfo.email &&
          billingInfo.email.trim() !== "" &&
          billingInfo.address &&
          billingInfo.address.trim() !== ""
        );
      case 1:
        if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
          return (
            cardInfo.cardNumber &&
            cardInfo.expiryDate &&
            cardInfo.cvv &&
            cardInfo.cardholderName
          );
        }
        return true;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Helper to delete purchased items from cart
  const deletePurchasedCartItems = async () => {
    try {
      for (const item of cartItems) {
        // Use product_id, size, color for uniqueness
        await fetch(
          `http://localhost:8000/api/cart/item/${
            item.product_id
          }?size=${encodeURIComponent(
            item.size || ""
          )}&color=${encodeURIComponent(item.color || "")}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }
    } catch (err) {
      // Optionally handle error
      console.error("Failed to delete purchased cart items", err);
    }
  };

  // Modified createPayment to delete items after payment
  const createPayment = async () => {
    setProcessing(true);
    try {
      const paymentItems = cartItems.map((item) => ({
        product_id: item.id.toString(),
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      // Prepare discount codes array
      const discount_codes = [];
      if (selectedClothesVoucher) {
        discount_codes.push(
          selectedClothesVoucher.discount_code || selectedClothesVoucher.code
        );
      }
      if (selectedShippingVoucher) {
        discount_codes.push(
          selectedShippingVoucher.discount_code || selectedShippingVoucher.code
        );
      }
      debugger;
      const paymentData = {
        items: paymentItems,
        payment_method: paymentMethod,
        billing_address: {
          full_name: billingInfo.fullName,
          address_line1: billingInfo.address,
          city: billingInfo.city,
          state: billingInfo.state,
          postal_code: billingInfo.zipCode,
          country: billingInfo.country,
        },
        discount_code: discount_codes,
        currency: "PHP",
        notes: buyerNotes,
      };
      debugger;
      // FIX: Use API_BASE_URL for correct endpoint
      const response = await fetch(
        `http://localhost:8000/api/v1/create-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        }
      );
      debugger;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create payment");
      }
      const result = await response.json();

      // After successful payment, delete purchased items from cart
      await deletePurchasedCartItems();

      // Redirect to payment pending page
      navigate("/payment-manager", {
        state: {
          orderNumber: result.order_number || "",
          paymentId: result.payment_id || "",
          total: calculatedTotal,
        },
      });

      setProcessing(false);
      return result.payment_id;
    } catch (error) {
      setError(error.message || "Payment failed");
      setProcessing(false);
      throw error;
    }
  };

  // Add discount validation
  const validateDiscountCode = async (code) => {
    if (!code.trim()) {
      setDiscountError("Please enter a discount code");
      return false;
    }

    try {
      setDiscountError("");
      // Try to apply the discount to validate it
      const discountResult = await discountAPI.applyDiscount(
        code.trim(),
        subtotal
      );

      setAppliedDiscountInfo({
        code: discountResult.discount_code,
        percentage: discountResult.discount_percentage,
        discountAmount: discountResult.discount_amount,
        originalAmount: discountResult.original_amount,
        finalAmount: discountResult.final_amount,
        description: discountResult.description,
      });

      return true;
    } catch (error) {
      // Try assigned discount if regular discount fails
      try {
        const assignedDiscountResult = await discountAPI.applyDiscount(
          code.trim(),
          subtotal
        );

        setAppliedDiscountInfo({
          code: assignedDiscountResult.discount_code,
          percentage: assignedDiscountResult.discount_percentage,
          discountAmount: assignedDiscountResult.discount_amount,
          originalAmount: assignedDiscountResult.original_amount,
          finalAmount: assignedDiscountResult.final_amount,
          description: assignedDiscountResult.description,
        });

        return true;
      } catch (assignedError) {
        setDiscountError(error.message || "Invalid discount code");
        return false;
      }
    }
  };

  // Fetch vouchers per type (use getMyDiscounts instead of getAvailableVouchers)
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const data = await discountAPI.getMyDiscounts();
        setClothesVouchers(
          (data.discounts || []).filter((v) => v.voucher_type === "clothes")
        );
        setShippingVouchers(
          (data.discounts || []).filter((v) => v.voucher_type === "shipping")
        );
      } catch (err) {
        // handle error
      }
    };
    fetchVouchers();
  }, []);
  // Shipping fee logic
  const clothingCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  let shippingFee = 40;
  if (clothingCount > 3) {
    shippingFee += (clothingCount - 3) * 10;
  }

  // Apply clothes voucher when selected
  useEffect(() => {
    const applyClothesVoucher = async () => {
      if (selectedClothesVoucher) {
        try {
          // Always use the correct code property for backend
          const voucherCode =
            selectedClothesVoucher.discount_code || selectedClothesVoucher.code;
          if (!voucherCode) {
            setClothesDiscountInfo(null);
            return;
          }
          const result = await discountAPI.applyDiscount(voucherCode, subtotal);
          setClothesDiscountInfo(result);
        } catch (err) {
          setClothesDiscountInfo(null);
        }
      } else {
        setClothesDiscountInfo(null);
      }
    };
    applyClothesVoucher();
  }, [selectedClothesVoucher, subtotal]);

  // Apply shipping voucher when selected
  useEffect(() => {
    const applyShippingVoucher = async () => {
      if (selectedShippingVoucher) {
        try {
          // Always use the correct code property for backend
          const voucherCode =
            selectedShippingVoucher.discount_code ||
            selectedShippingVoucher.code;
          if (!voucherCode) {
            setShippingDiscountInfo(null);
            return;
          }
          const result = await discountAPI.applyDiscount(
            voucherCode,
            shippingFee
          );
          setShippingDiscountInfo(result);
        } catch (err) {
          setShippingDiscountInfo(null);
        }
      } else {
        setShippingDiscountInfo(null);
      }
    };
    applyShippingVoucher();
  }, [selectedShippingVoucher, shippingFee]);

  // Discount values
  const clothesDiscount = clothesDiscountInfo?.discount_amount || 0;
  const shippingDiscount = shippingDiscountInfo?.discount_amount || 0;

  // Final total
  const calculatedTotal =
    subtotal - clothesDiscount + shippingFee - shippingDiscount;

  // Fetch saved addresses for user
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      const token = localStorage.getItem("access_token");
      if (!user?.username || !token) return;

      try {
        setLoadingAddresses(true);
        const response = await fetch(
          `${API_BASE_URL}/users/${user.username}/addresses`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const addresses = await response.json();
          setSavedAddresses(addresses);
          // Auto-select default address if available
          const defaultAddress = addresses.find((addr) => addr.is_default);
          if (defaultAddress && !selectedAddressId) {
            setSelectedAddressId(defaultAddress._id);
            setBillingInfo({
              fullName: user?.full_name || "",
              email: user?.email || "",
              address: defaultAddress.address_line1,
              city: defaultAddress.city,
              state: defaultAddress.state,
              zipCode: defaultAddress.postal_code,
              country: defaultAddress.country || "USA",
            });
          }
        } else if (response.status === 401) {
          enqueueSnackbar("Authentication expired. Please log in again.", {
            variant: "error",
          });
        } else if (response.status === 404) {
          setSavedAddresses([]);
        } else {
          const errorData = await response.json();
          enqueueSnackbar(errorData.detail || "Failed to fetch addresses", {
            variant: "error",
          });
        }
      } catch (error) {
        enqueueSnackbar("Network error. Please check your connection.", {
          variant: "error",
        });
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchSavedAddresses();
    // eslint-disable-next-line
  }, [user?.username]);

  // When user selects an address, update billing info
  useEffect(() => {
    if (!selectedAddressId) return;
    const selected = savedAddresses.find(
      (addr) => addr._id === selectedAddressId
    );
    if (selected) {
      setBillingInfo({
        fullName: user?.full_name || "",
        email: user?.email || "",
        address: selected.address_line1 || selected.street || "",
        city: selected.city || "",
        state: selected.state || selected.province || "",
        zipCode: selected.postal_code || "",
        country: selected.country || "USA",
      });
    }
    // eslint-disable-next-line
  }, [selectedAddressId, savedAddresses]);

  // Handles clothes voucher selection and applies discount
  const handleClothesDiscount = async (code) => {
    if (!code) {
      setSelectedClothesVoucher(null);
      setClothesDiscountInfo(null);
      return;
    }
    // Try to find by discount_code (assigned) or code (public)
    const voucher =
      clothesVouchers.find((v) => v.discount_code === code) ||
      clothesVouchers.find((v) => v.code === code);
    setSelectedClothesVoucher(voucher || null);
    if (voucher) {
      try {
        // Use correct code property for API
        const voucherCode = voucher.discount_code || voucher.code;
        let result;
        // If assigned voucher, use applyDiscount
        if (voucher.discount_code) {
          result = await discountAPI.applyDiscount(voucherCode, subtotal);
        } else {
          result = await discountAPI.applyDiscount(voucherCode, subtotal);
        }
        setClothesDiscountInfo(result);
      } catch (err) {
        setClothesDiscountInfo(null);
      }
    } else {
      setClothesDiscountInfo(null);
    }
  };

  // Handles shipping voucher selection and applies discount
  const handleShippingDiscount = async (code) => {
    if (!code) {
      setSelectedShippingVoucher(null);
      setShippingDiscountInfo(null);
      return;
    }
    // Try to find by discount_code (assigned) or code (public)
    const voucher =
      shippingVouchers.find((v) => v.discount_code === code) ||
      shippingVouchers.find((v) => v.code === code);
    setSelectedShippingVoucher(voucher || null);
    if (voucher) {
      try {
        // Use correct code property for API
        const voucherCode = voucher.discount_code || voucher.code;
        let result;
        // If assigned voucher, use applyDiscount
        if (voucher.discount_code) {
          result = await discountAPI.applyDiscount(voucherCode, shippingFee);
        } else {
          result = await discountAPI.applyDiscount(voucherCode, shippingFee);
        }
        setShippingDiscountInfo(result);
      } catch (err) {
        setShippingDiscountInfo(null);
      }
    } else {
      setShippingDiscountInfo(null);
    }
  };

  if (orderSuccess) {
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
                ORDER CONFIRMATION
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
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
              Continue Shopping
            </Button>
            <Button
              onClick={() => navigate("/payment-manager")}
              variant="contained"
              sx={{
                backgroundColor: "#8fa876",
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
              Payment History
            </Button>
          </Box>
        </Box>

        {/* Main Content with Dashboard.jsx background */}
        <Box
          sx={{
            pt: 12,
            mt: 10,
            minHeight: "100vh",
            backgroundColor: "#f0f8f0",
            background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)",
            px: { xs: 2, md: 4 },
            py: 4,
          }}
        >
          <Container maxWidth="md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 6,
                  textAlign: "center",
                  borderRadius: "20px",
                  background: "#ffffff",
                  boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                  border: "1px solid rgba(74, 93, 58, 0.1)",
                }}
              >
                <CheckCircle sx={{ fontSize: 80, color: "#4a5d3a", mb: 2 }} />
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ color: "#4a5d3a", fontWeight: 700 }}
                >
                  Payment Successful! 🎉
                </Typography>
                <Typography variant="h6" gutterBottom sx={{ color: "#6b8459" }}>
                  Order Number: {orderNumber}
                </Typography>
                <Typography variant="h6" gutterBottom sx={{ color: "#6b8459" }}>
                  Payment ID: {paymentId}
                </Typography>
                <Typography variant="body1" sx={{ color: "#6b8459", mb: 3 }}>
                  Thank you for your purchase! Your payment has been processed
                  successfully.
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: "#4a5d3a" }}>
                    Total Paid: ₱{total.toFixed(2)}
                  </Typography>
                  {appliedDiscount && (
                    <Typography sx={{ color: "#4a5d3a" }}>
                      You saved ₱{discount.toFixed(2)} with discount code:
                      {appliedDiscount.code}
                    </Typography>
                  )}
                </Box>

                <Grid container spacing={2} justifyContent="center">
                  <Grid item>
                    <Button
                      variant="contained"
                      onClick={() => navigate("/products")}
                      sx={{
                        backgroundColor: "#8fa876",
                        color: "#ffffff",
                        borderRadius: "12px",
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        "&:hover": {
                          backgroundColor: "#7a956a",
                        },
                      }}
                    >
                      Continue Shopping
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/payment-manager")}
                      sx={{
                        borderColor: "#4a5d3a",
                        color: "#4a5d3a",
                        borderRadius: "12px",
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        "&:hover": {
                          backgroundColor: "rgba(74, 93, 58, 0.1)",
                          borderColor: "#4a5d3a",
                        },
                      }}
                    >
                      View Payment History
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Container>
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
              SECURE CHECKOUT
            </Typography>
          </Box>
        </Box>

        {/* Header Actions */}
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            color="inherit"
            onClick={() => navigate("/cart")}
            sx={{
              backgroundColor: "rgba(255,255,255,0.1)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Button
            onClick={() => navigate("/cart")}
            startIcon={<ShoppingCart />}
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
            Back to Cart
          </Button>
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ color: "#ffffff" }}
          >
            <Security />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              SSL Secured
            </Typography>
          </Box>
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
              </Alert>
            )}

            {discountError && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(244, 67, 54, 0.2)",
                }}
              >
                {discountError}
              </Alert>
            )}

            <Grid container spacing={4}>
              {/* Checkout Form */}
              <Grid item xs={12} md={8}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    borderRadius: "20px",
                    background: "#ffffff",
                    boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                    border: "1px solid rgba(74, 93, 58, 0.1)",
                  }}
                >
                  <Stepper
                    activeStep={activeStep}
                    sx={{
                      mb: 4,
                      "& .MuiStepIcon-root": {
                        color: "rgba(74, 93, 58, 0.3)",
                        "&.Mui-active": {
                          color: "#4a5d3a",
                        },
                        "&.Mui-completed": {
                          color: "#8fa876",
                        },
                      },
                    }}
                  >
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel
                          sx={{
                            "& .MuiStepLabel-label": {
                              color: "#4a5d3a",
                              fontWeight: 600,
                            },
                          }}
                        >
                          {label}
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {activeStep === 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                          fontWeight: 700,
                          color: "#4a5d3a",
                          mb: 3,
                        }}
                      >
                        Billing Information
                      </Typography>
                      
                      {/* User Info Section */}
                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Full Name"
                            fullWidth
                            value={billingInfo.fullName || ""}
                            onChange={(e) =>
                              handleBillingChange("fullName", e.target.value)
                            }
                            required
                            InputLabelProps={{
                              shrink: true,
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                backgroundColor: "#ffffff",
                                "& fieldset": {
                                  borderColor: "rgba(74, 93, 58, 0.3)",
                                },
                                "&:hover fieldset": {
                                  borderColor: "#4a5d3a",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#4a5d3a",
                                  borderWidth: "2px",
                                },
                              },
                              "& .MuiInputLabel-root": {
                                color: "#6b8459",
                                fontWeight: 500,
                                backgroundColor: "#ffffff",
                                padding: "0 8px",
                                "&.Mui-focused": {
                                  color: "#4a5d3a",
                                  fontWeight: 600,
                                },
                                "&.MuiInputLabel-shrink": {
                                  transform: "translate(14px, -9px) scale(0.75)",
                                  backgroundColor: "#ffffff",
                                  padding: "0 8px",
                                },
                              },
                              "& .MuiOutlinedInput-input": {
                                color: "#2e2e2e",
                                fontWeight: 500,
                                fontSize: "1rem",
                                padding: "16px 14px",
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            value={billingInfo.email || ""}
                            onChange={(e) =>
                              handleBillingChange("email", e.target.value)
                            }
                            required
                            InputLabelProps={{
                              shrink: true,
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                backgroundColor: "#ffffff",
                                "& fieldset": {
                                  borderColor: "rgba(74, 93, 58, 0.3)",
                                },
                                "&:hover fieldset": {
                                  borderColor: "#4a5d3a",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#4a5d3a",
                                  borderWidth: "2px",
                                },
                              },
                              "& .MuiInputLabel-root": {
                                color: "#6b8459",
                                fontWeight: 500,
                                backgroundColor: "#ffffff",
                                padding: "0 8px",
                                "&.Mui-focused": {
                                  color: "#4a5d3a",
                                  fontWeight: 600,
                                },
                                "&.MuiInputLabel-shrink": {
                                  transform: "translate(14px, -9px) scale(0.75)",
                                  backgroundColor: "#ffffff",
                                  padding: "0 8px",
                                },
                              },
                              "& .MuiOutlinedInput-input": {
                                color: "#2e2e2e",
                                fontWeight: 500,
                                fontSize: "1rem",
                                padding: "16px 14px",
                              },
                            }}
                          />
                        </Grid>
                      </Grid>

                      {/* Delivery Address Section */}
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: "#4a5d3a",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <LocationOn sx={{ fontSize: 20 }} />
                            Delivery Address
                          </Typography>
                          {savedAddresses.length > 2 && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => setShowAddressModal(true)}
                              sx={{
                                color: "#4a5d3a",
                                borderColor: "#4a5d3a",
                                borderRadius: "20px",
                                px: 2,
                                py: 0.5,
                                fontWeight: 500,
                                textTransform: "none",
                                "&:hover": {
                                  backgroundColor: "rgba(74, 93, 58, 0.05)",
                                  borderColor: "#3a4d2a"
                                },
                              }}
                            >
                              View All ({savedAddresses.length})
                            </Button>
                          )}
                        </Box>

                        {loadingAddresses ? (
                          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                            <CircularProgress size={24} sx={{ color: "#4a5d3a" }} />
                          </Box>
                        ) : savedAddresses.length === 0 ? (
                          <Alert
                            severity="info"
                            sx={{
                              borderRadius: "12px",
                              backgroundColor: "rgba(74, 93, 58, 0.1)",
                              border: "1px solid rgba(74, 93, 58, 0.2)",
                            }}
                          >
                            No saved addresses found. Please add an address in your profile.
                          </Alert>
                        ) : (
                          <RadioGroup
                            value={selectedAddressId}
                            onChange={(e) => setSelectedAddressId(e.target.value)}
                            sx={{ gap: 1.5 }}
                          >
                            {/* Show first 2 addresses, ensuring selected is visible */}
                            {(() => {
                              const firstTwo = savedAddresses.slice(0, 2);
                              const selectedAddress = savedAddresses.find(addr => addr._id === selectedAddressId);
                              
                              let addressesToShow;
                              if (selectedAddress && !firstTwo.some(addr => addr._id === selectedAddressId)) {
                                addressesToShow = [firstTwo[0], selectedAddress].filter(Boolean);
                              } else {
                                addressesToShow = firstTwo;
                              }
                              
                              return addressesToShow.map((addr) => (
                                <FormControlLabel
                                  key={addr._id}
                                  value={addr._id}
                                  control={
                                    <Radio
                                      sx={{
                                        color: "rgba(74, 93, 58, 0.6)",
                                        "&.Mui-checked": {
                                          color: "#4a5d3a",
                                        },
                                        mr: 1
                                      }}
                                    />
                                  }
                                  label={
                                    <Card
                                      variant="outlined"
                                      sx={{
                                        border: selectedAddressId === addr._id
                                          ? "2px solid #4a5d3a"
                                          : "1px solid rgba(74, 93, 58, 0.2)",
                                        borderRadius: "12px",
                                        background: selectedAddressId === addr._id
                                          ? "rgba(74, 93, 58, 0.05)"
                                          : "#ffffff",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                          boxShadow: "0 4px 12px rgba(74, 93, 58, 0.15)",
                                          borderColor: "#4a5d3a"
                                        },
                                        width: "100%",
                                        cursor: "pointer"
                                      }}
                                    >
                                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                          <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                              <Typography
                                                variant="subtitle2"
                                                sx={{ fontWeight: 600, color: "#4a5d3a" }}
                                              >
                                                {addr.recipient_name || addr.full_name}
                                              </Typography>
                                              {addr.is_default && (
                                                <Chip
                                                  label="Default"
                                                  size="small"
                                                  sx={{
                                                    height: 20,
                                                    backgroundColor: "#4a5d3a",
                                                    color: "#ffffff",
                                                    fontSize: "0.7rem"
                                                  }}
                                                />
                                              )}
                                              <Chip
                                                label={addr.address_type || "Home"}
                                                variant="outlined"
                                                size="small"
                                                sx={{
                                                  height: 20,
                                                  fontSize: "0.7rem",
                                                  borderColor: "#4a5d3a",
                                                  color: "#4a5d3a"
                                                }}
                                              />
                                            </Box>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: "#6b8459",
                                                mb: 0.5,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                lineHeight: 1.4
                                              }}
                                            >
                                              {formatAddress(addr)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#8fa876", fontSize: "0.8rem" }}>
                                              📞 {addr.contact_number} • 📮 {addr.postal_code}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  }
                                  sx={{ margin: 0, alignItems: "flex-start" }}
                                />
                              ));
                            })()}
                          </RadioGroup>
                        )}
                      </Box>

                      {/* Address Modal */}
                      <Dialog
                        open={showAddressModal}
                        onClose={() => setShowAddressModal(false)}
                        maxWidth="md"
                        fullWidth
                        PaperProps={{
                          sx: {
                            borderRadius: "16px",
                            boxShadow: "0 8px 25px rgba(74, 93, 58, 0.2)",
                          }
                        }}
                      >
                        <DialogTitle
                          sx={{
                            backgroundColor: "#4a5d3a",
                            color: "#ffffff",
                            fontWeight: 600,
                            py: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}
                        >
                          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LocationOn />
                            Select Delivery Address ({savedAddresses.length})
                          </Typography>
                          <IconButton
                            onClick={() => setShowAddressModal(false)}
                            sx={{ color: "#ffffff", p: 1 }}
                          >
                            ✕
                          </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ px: 3, py: 2, maxHeight: "60vh", overflowY: "auto" }}>
                          <RadioGroup
                            value={selectedAddressId}
                            onChange={(e) => {
                              setSelectedAddressId(e.target.value);
                              setShowAddressModal(false);
                            }}
                            sx={{ gap: 2, mt: 1 }}
                          >
                            {savedAddresses.map((addr) => (
                              <Card
                                key={addr._id}
                                variant="outlined"
                                sx={{
                                  border: selectedAddressId === addr._id
                                    ? "2px solid #4a5d3a"
                                    : "1px solid #e0e0e0",
                                  borderRadius: "12px",
                                  background: selectedAddressId === addr._id
                                    ? "rgba(74, 93, 58, 0.05)"
                                    : "#ffffff",
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    boxShadow: "0 4px 12px rgba(74, 93, 58, 0.15)",
                                    borderColor: "#4a5d3a"
                                  },
                                  cursor: "pointer"
                                }}
                                onClick={() => {
                                  setSelectedAddressId(addr._id);
                                  setShowAddressModal(false);
                                }}
                              >
                                <CardContent sx={{ p: 2 }}>
                                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                    <Radio
                                      value={addr._id}
                                      sx={{ 
                                        mt: -0.5,
                                        color: "#4a5d3a",
                                        "&.Mui-checked": { color: "#4a5d3a" }
                                      }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <Typography variant="h6" fontWeight="600" sx={{ color: "#4a5d3a" }}>
                                          {addr.recipient_name || addr.full_name}
                                        </Typography>
                                        {addr.is_default && (
                                          <Chip
                                            label="Default"
                                            size="small"
                                            sx={{ 
                                              backgroundColor: "#4a5d3a",
                                              color: "#ffffff",
                                              fontWeight: 600
                                            }}
                                          />
                                        )}
                                        <Chip
                                          label={addr.address_type || "Home"}
                                          variant="outlined"
                                          size="small"
                                          sx={{
                                            borderColor: "#4a5d3a",
                                            color: "#4a5d3a"
                                          }}
                                        />
                                      </Box>
                                      <Typography
                                        variant="body1"
                                        color="textPrimary"
                                        sx={{ mb: 1, lineHeight: 1.4 }}
                                      >
                                        {formatAddress(addr)}
                                      </Typography>
                                      <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                                        <Typography variant="body2" color="textSecondary">
                                          📞 {addr.contact_number}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                          📮 {addr.postal_code}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </RadioGroup>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                          <Button
                            onClick={() => setShowAddressModal(false)}
                            variant="contained"
                            sx={{
                              backgroundColor: "#4a5d3a",
                              color: "#ffffff",
                              borderRadius: "20px",
                              px: 3,
                              py: 1,
                              fontWeight: 500,
                              textTransform: "none",
                              "&:hover": {
                                backgroundColor: "#3a4d2a"
                              }
                            }}
                          >
                            Done
                          </Button>
                        </DialogActions>
                      </Dialog>
                    </motion.div>
                  )}

                  {activeStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                          fontWeight: 700,
                          color: "#4a5d3a",
                          mb: 3,
                        }}
                      >
                        Payment Method
                      </Typography>

                      <FormControl component="fieldset" sx={{ mb: 3 }}>
                        <RadioGroup
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <FormControlLabel
                            value="gcash"
                            control={
                              <Radio
                                sx={{
                                  color: "rgba(74, 93, 58, 0.6)",
                                  "&.Mui-checked": {
                                    color: "#4a5d3a",
                                  },
                                }}
                              />
                            }
                            label={
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                sx={{
                                  p: 2,
                                  border: "1px solid rgba(74, 93, 58, 0.2)",
                                  borderRadius: "12px",
                                  backgroundColor: "rgba(74, 93, 58, 0.02)",
                                  width: "200px",
                                }}
                              >
                                <Payment sx={{ color: "#4a5d3a" }} />
                                <Typography sx={{ color: "#4a5d3a", fontWeight: 600 }}>
                                  GCash
                                </Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            value="paymaya"
                            control={
                              <Radio
                                sx={{
                                  color: "rgba(74, 93, 58, 0.6)",
                                  "&.Mui-checked": {
                                    color: "#4a5d3a",
                                  },
                                }}
                              />
                            }
                            label={
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                sx={{
                                  p: 2,
                                  border: "1px solid rgba(74, 93, 58, 0.2)",
                                  borderRadius: "12px",
                                  backgroundColor: "rgba(74, 93, 58, 0.02)",
                                  width: "200px",
                                }}
                              >
                                <Payment sx={{ color: "#4a5d3a" }} />
                                <Typography sx={{ color: "#4a5d3a", fontWeight: 600 }}>
                                  PayMaya
                                </Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            value="cash_on_delivery"
                            control={
                              <Radio
                                sx={{
                                  color: "rgba(74, 93, 58, 0.6)",
                                  "&.Mui-checked": {
                                    color: "#4a5d3a",
                                  },
                                }}
                              />
                            }
                            label={
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                sx={{
                                  p: 2,
                                  border: "1px solid rgba(74, 93, 58, 0.2)",
                                  borderRadius: "12px",
                                  backgroundColor: "rgba(74, 93, 58, 0.02)",
                                  width: "200px",
                                }}
                              >
                                <AccountBalance sx={{ color: "#4a5d3a" }} />
                                <Typography sx={{ color: "#4a5d3a", fontWeight: 600 }}>
                                  Cash on Delivery
                                </Typography>
                              </Box>
                            }
                          />
                        </RadioGroup>
                      </FormControl>

                      {paymentMethod === "cash_on_delivery" && (
                        <Alert
                          severity="info"
                          sx={{
                            mt: 2,
                            borderRadius: "12px",
                            backgroundColor: "rgba(74, 93, 58, 0.1)",
                          }}
                        >
                          Please prepare exact payment amount for our delivery
                          personnel.
                        </Alert>
                      )}
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                          fontWeight: 700,
                          color: "#4a5d3a",
                          mb: 3,
                        }}
                      >
                        Review Your Order
                      </Typography>

                      <Card
                        sx={{
                          mb: 3,
                          borderRadius: "12px",
                          border: "1px solid rgba(74, 93, 58, 0.1)",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ color: "#4a5d3a", fontWeight: 600 }}
                          >
                            Billing Address
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#6b8459" }}>
                            {billingInfo.fullName}
                            <br />
                            {billingInfo.address}
                            <br />
                            {billingInfo.city}, {billingInfo.state}{" "}
                            {billingInfo.zipCode}
                          </Typography>
                        </CardContent>
                      </Card>

                      <Card
                        sx={{
                          mb: 3,
                          borderRadius: "12px",
                          border: "1px solid rgba(74, 93, 58, 0.1)",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ color: "#4a5d3a", fontWeight: 600 }}
                          >
                            Payment Method
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {(paymentMethod === "paymaya" ||
                              paymentMethod === "gcash") && <Payment sx={{ color: "#4a5d3a" }} />}
                            {paymentMethod === "cash_on_delivery" && (
                              <AccountBalance sx={{ color: "#4a5d3a" }} />
                            )}
                            <Typography sx={{ color: "#6b8459" }}>
                              {paymentMethod === "paymaya" && "PayMaya"}
                              {paymentMethod === "gcash" && "GCash"}
                              {paymentMethod === "cash_on_delivery" &&
                                "Cash on Delivery"}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Notes for Seller */}
                      <Card
                        sx={{
                          mb: 3,
                          borderRadius: "12px",
                          border: "1px solid rgba(74, 93, 58, 0.1)",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ color: "#4a5d3a", fontWeight: 600 }}
                          >
                            Notes for Seller
                          </Typography>
                          <TextField
                            label="Add notes for the seller (optional)"
                            multiline
                            minRows={2}
                            fullWidth
                            value={buyerNotes}
                            onChange={(e) => setBuyerNotes(e.target.value)}
                            placeholder="E.g. Please deliver after 5pm, call before arrival, etc."
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                "& fieldset": {
                                  borderColor: "rgba(74, 93, 58, 0.3)",
                                },
                                "&:hover fieldset": {
                                  borderColor: "#4a5d3a",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#4a5d3a",
                                },
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: "#4a5d3a",
                              },
                            }}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <Box display="flex" justifyContent="space-between" sx={{ mt: 4 }}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                    sx={{
                      borderRadius: "12px",
                      px: 3,
                      py: 1,
                      color: "#4a5d3a",
                      "&:hover": {
                        backgroundColor: "rgba(74, 93, 58, 0.1)",
                      },
                    }}
                    >
                      Back
                    </Button>

                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={createPayment}
                        disabled={!validateStep() || processing}
                        sx={{
                          backgroundColor: "#8fa876",
                          color: "#ffffff",
                          borderRadius: "12px",
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          "&:hover": {
                            backgroundColor: "#7a956a",
                          },
                          "&:disabled": {
                            backgroundColor: "rgba(74, 93, 58, 0.3)",
                          },
                        }}
                      >
                        {processing ? (
                          <>
                            <CircularProgress
                              size={20}
                              sx={{ mr: 1, color: "#ffffff" }}
                            />
                            Processing Payment...
                          </>
                        ) : (
                          "Complete Payment"
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!validateStep()}
                        sx={{
                          backgroundColor: "#8fa876",
                          color: "#ffffff",
                          borderRadius: "12px",
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          "&:hover": {
                            backgroundColor: "#7a956a",
                          },
                          "&:disabled": {
                            backgroundColor: "rgba(74, 93, 58, 0.3)",
                          },
                        }}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Order Summary */}
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: "20px",
                    position: "sticky",
                    top: 20,
                    background: "#ffffff",
                    boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                    border: "1px solid rgba(74, 93, 58, 0.1)",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      color: "#4a5d3a",
                      mb: 3,
                    }}
                  >
                    Order Summary
                  </Typography>

                  {cartItems.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "1px solid rgba(74, 93, 58, 0.1)",
                        pb: 1,
                      }}
                    >
                      <CardMedia
                        component="img"
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          mr: 2,
                          borderRadius: "8px",
                          border: "1px solid rgba(74, 93, 58, 0.1)",
                        }}
                        image={
                          item.image ||
                          "https://via.placeholder.com/300x400?text=Fashion+Item"
                        }
                        alt={item.name}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "#4a5d3a", fontWeight: 600 }}
                        >
                          {item.name} × {item.quantity}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: "#6b8459", fontWeight: 600 }}
                      >
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}

                  <Divider sx={{ my: 2, borderColor: "rgba(74, 93, 58, 0.2)" }} />

                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Subtotal"
                        primaryTypographyProps={{
                          color: "#4a5d3a",
                          fontWeight: 600,
                        }}
                      />
                      <Typography sx={{ color: "#6b8459", fontWeight: 600 }}>
                        ₱{subtotal.toFixed(2)}
                      </Typography>
                    </ListItem>

                    {/* Clothes Voucher Select */}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Clothes Voucher"
                        primaryTypographyProps={{
                          color: "#4a5d3a",
                          fontWeight: 600,
                        }}
                      />
                      <Box sx={{ minWidth: 120 }}>
                        <select
                          value={
                            selectedClothesVoucher?.discount_code ||
                            selectedClothesVoucher?.code ||
                            ""
                          }
                          onChange={(e) => handleClothesDiscount(e.target.value)}
                          style={{
                            padding: "8px",
                            borderRadius: "8px",
                            border: "1px solid rgba(74, 93, 58, 0.3)",
                            backgroundColor: "#ffffff",
                            color: "#4a5d3a",
                          }}
                        >
                          <option value="">Select voucher</option>
                          {clothesVouchers.map((voucher) => (
                            <option
                              key={voucher.discount_code || voucher.code}
                              value={voucher.discount_code || voucher.code}
                            >
                              {voucher.discount_code || voucher.code} (
                              {voucher.percentage}% OFF) - {voucher.description}
                            </option>
                          ))}
                        </select>
                      </Box>
                    </ListItem>
                    {clothesDiscountInfo && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={`Clothes Discount (${clothesDiscountInfo.discount_code})`}
                          primaryTypographyProps={{
                            color: "#4a5d3a",
                            fontSize: "0.9rem",
                          }}
                        />
                        <Typography sx={{ color: "#4a5d3a", fontWeight: 600 }}>
                          -₱{clothesDiscountInfo.discount_amount.toFixed(2)}
                        </Typography>
                      </ListItem>
                    )}

                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Shipping Fee"
                        primaryTypographyProps={{
                          color: "#4a5d3a",
                          fontWeight: 600,
                        }}
                      />
                      <Typography sx={{ color: "#6b8459", fontWeight: 600 }}>
                        ₱{shippingFee.toFixed(2)}
                      </Typography>
                    </ListItem>

                    {/* Shipping Voucher Select */}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Shipping Voucher"
                        primaryTypographyProps={{
                          color: "#4a5d3a",
                          fontWeight: 600,
                        }}
                      />
                      <Box sx={{ minWidth: 120 }}>
                        <select
                          value={
                            selectedShippingVoucher?.discount_code ||
                            selectedShippingVoucher?.code ||
                            ""
                          }
                          onChange={(e) => handleShippingDiscount(e.target.value)}
                          style={{
                            padding: "8px",
                            borderRadius: "8px",
                            border: "1px solid rgba(74, 93, 58, 0.3)",
                            backgroundColor: "#ffffff",
                            color: "#4a5d3a",
                          }}
                        >
                          <option value="">Select voucher</option>
                          {shippingVouchers.map((voucher) => (
                            <option
                              key={voucher.discount_code || voucher.code}
                              value={voucher.discount_code || voucher.code}
                            >
                              {voucher.discount_code || voucher.code} (
                              {voucher.percentage}% OFF) - {voucher.description}
                            </option>
                          ))}
                        </select>
                      </Box>
                    </ListItem>
                    {shippingDiscountInfo && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={`Shipping Discount (${shippingDiscountInfo.discount_code})`}
                          primaryTypographyProps={{
                            color: "#4a5d3a",
                            fontSize: "0.9rem",
                          }}
                        />
                        <Typography sx={{ color: "#4a5d3a", fontWeight: 600 }}>
                          -₱{shippingDiscountInfo.discount_amount.toFixed(2)}
                        </Typography>
                      </ListItem>
                    )}
                  </List>

                  <Divider sx={{ my: 2, borderColor: "rgba(74, 93, 58, 0.2)" }} />

                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#4a5d3a" }}
                        >
                          Total
                        </Typography>
                      }
                    />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "#4a5d3a" }}
                    >
                      ₱{calculatedTotal.toFixed(2)}
                    </Typography>
                  </ListItem>

                  {appliedDiscountInfo && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={`${appliedDiscountInfo.code} - ${appliedDiscountInfo.percentage}% OFF`}
                        sx={{
                          backgroundColor: "#8fa876",
                          color: "#ffffff",
                        }}
                        size="small"
                      />
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1, color: "#6b8459" }}
                      >
                        {appliedDiscountInfo.description}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: "#4a5d3a", fontWeight: 600 }}
                      >
                        You saved ₱{appliedDiscountInfo.discountAmount.toFixed(2)}!
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>
    </>
  );
};

export default PaymentPage;
