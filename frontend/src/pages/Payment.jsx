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
  AppBar,
  Toolbar,
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
  ArrowBack,
  CreditCard,
  AccountBalance,
  Payment,
  Security,
  CheckCircle,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { discountAPI } from "../services/discountApi";
import { useSnackbar } from "notistack"; // If you use notistack for notifications

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

  // Notes state
  const [buyerNotes, setBuyerNotes] = useState(""); // Add state for notes

  const steps = ["Billing Information", "Payment Method", "Review Order"];

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
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Order Confirmation
            </Typography>
            <Button color="inherit" onClick={() => navigate("/products")}>
              Continue Shopping
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate("/payment-history")}
            >
              Payment History
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 8 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={3}
              sx={{ p: 6, textAlign: "center", borderRadius: 3 }}
            >
              <CheckCircle sx={{ fontSize: 80, color: "#4caf50", mb: 2 }} />
              <Typography
                variant="h4"
                gutterBottom
                color="success.main"
                fontWeight="bold"
              >
                Payment Successful!
              </Typography>
              <Typography variant="h6" gutterBottom>
                Order Number: {orderNumber}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Payment ID: {paymentId}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Thank you for your purchase! Your payment has been processed
                successfully.
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Total Paid: ${total.toFixed(2)}
                </Typography>
                {appliedDiscount && (
                  <Typography color="success.main">
                    You saved ${discount.toFixed(2)} with discount code:
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
                      bgcolor: "#2e7d32",
                      "&:hover": { bgcolor: "#1b5e20" },
                    }}
                  >
                    Continue Shopping
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/payment-history")}
                  >
                    View Payment History
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate("/cart")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Secure Checkout
          </Typography>
          <Security sx={{ mr: 1 }} />
          <Typography variant="body2">SSL Secured</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {discountError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {discountError}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Checkout Form */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {activeStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    Billing Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Full Name"
                        fullWidth
                        value={billingInfo.fullName}
                        onChange={(e) =>
                          handleBillingChange("fullName", e.target.value)
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={billingInfo.email}
                        onChange={(e) =>
                          handleBillingChange("email", e.target.value)
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl component="fieldset" fullWidth>
                        <FormLabel component="legend">
                          Select Delivery Address
                        </FormLabel>
                        {loadingAddresses ? (
                          <CircularProgress size={24} />
                        ) : savedAddresses.length === 0 ? (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            No saved addresses found. Please add an address in
                            your profile.
                          </Alert>
                        ) : (
                          <RadioGroup
                            value={selectedAddressId}
                            onChange={(e) =>
                              setSelectedAddressId(e.target.value)
                            }
                          >
                            {savedAddresses.map((addr) => (
                              <FormControlLabel
                                key={addr._id}
                                value={addr._id}
                                control={<Radio />}
                                label={
                                  <Box
                                    sx={{
                                      border: "1px solid #e0e0e0",
                                      borderRadius: 2,
                                      p: 2,
                                      mb: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight="bold"
                                    >
                                      {addr.recipient_name || addr.full_name}
                                    </Typography>
                                    <Typography variant="body2">
                                      <b>Street:</b>{" "}
                                      {addr.street || addr.address_line1}
                                    </Typography>
                                    <Typography variant="body2">
                                      <b>Barangay:</b> {addr.barangay}
                                    </Typography>
                                    <Typography variant="body2">
                                      <b>City:</b> {addr.city}
                                    </Typography>
                                    <Typography variant="body2">
                                      <b>Province:</b> {addr.province}
                                    </Typography>
                                    <Typography variant="body2">
                                      <b>Region:</b> {addr.region}
                                    </Typography>
                                    <Typography variant="body2">
                                      <b>Postal Code:</b> {addr.postal_code}
                                    </Typography>
                                    <Typography variant="body2">
                                      <b>Country:</b> {addr.country}
                                    </Typography>
                                    <Typography variant="body2">
                                      <b>Contact Number:</b>{" "}
                                      {addr.contact_number}
                                    </Typography>
                                    <Typography variant="body2">
                                      <b>Address Type:</b> {addr.address_type}
                                    </Typography>
                                    {addr.is_default && (
                                      <Chip
                                        label="Default"
                                        color="primary"
                                        size="small"
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Box>
                                }
                              />
                            ))}
                          </RadioGroup>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                </motion.div>
              )}

              {activeStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    Payment Method
                  </Typography>

                  <FormControl component="fieldset" sx={{ mb: 3 }}>
                    <RadioGroup
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <FormControlLabel
                        value="gcash"
                        control={<Radio />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Payment />
                            <Typography>GCash</Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="paymaya"
                        control={<Radio />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Payment />
                            <Typography>PayMaya</Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="cash_on_delivery"
                        control={<Radio />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <AccountBalance />
                            <Typography>Cash on Delivery</Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>

                  {paymentMethod === "cash_on_delivery" && (
                    <Alert severity="info" sx={{ mt: 2 }}>
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
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    Review Your Order
                  </Typography>

                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Billing Address
                      </Typography>
                      <Typography variant="body2">
                        {billingInfo.fullName}
                        <br />
                        {billingInfo.address}
                        <br />
                        {billingInfo.city}, {billingInfo.state}{" "}
                        {billingInfo.zipCode}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Payment Method
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {(paymentMethod === "paymaya" ||
                          paymentMethod === "gcash") && <Payment />}
                        {paymentMethod === "cash_on_delivery" && (
                          <AccountBalance />
                        )}
                        <Typography>
                          {paymentMethod === "paymaya" && "PayMaya"}
                          {paymentMethod === "gcash" && "GCash"}
                          {paymentMethod === "cash_on_delivery" &&
                            "Cash on Delivery"}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* --- Add buyer notes input --- */}
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
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
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <Box display="flex" justifyContent="space-between" sx={{ mt: 4 }}>
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={createPayment} // <-- call createPayment directly
                    disabled={!validateStep() || processing}
                    sx={{
                      bgcolor: "#2e7d32",
                      "&:hover": { bgcolor: "#1b5e20" },
                    }}
                  >
                    {processing ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
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
                      bgcolor: "#2e7d32",
                      "&:hover": { bgcolor: "#1b5e20" },
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
              sx={{ p: 3, borderRadius: 3, position: "sticky", top: 20 }}
            >
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Order Summary
              </Typography>

              {cartItems.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid #e0e0e0",
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
                      borderRadius: 2,
                    }}
                    image={
                      item.image ||
                      "https://via.placeholder.com/300x400?text=Fashion+Item"
                    }
                    alt={item.name}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">
                      {item.name} × {item.quantity}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Subtotal" />
                  <Typography>₱{subtotal.toFixed(2)}</Typography>
                </ListItem>

                {/* Clothes Voucher Select */}
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Clothes Voucher" />
                  <Box sx={{ minWidth: 120 }}>
                    <select
                      value={
                        selectedClothesVoucher?.discount_code ||
                        selectedClothesVoucher?.code ||
                        ""
                      }
                      onChange={(e) => handleClothesDiscount(e.target.value)}
                      style={{ padding: "6px", borderRadius: "4px" }}
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
                      sx={{ color: "success.main" }}
                    />
                    <Typography color="success.main">
                      -₱{clothesDiscountInfo.discount_amount.toFixed(2)}
                    </Typography>
                  </ListItem>
                )}

                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Shipping Fee" />
                  <Typography>₱{shippingFee.toFixed(2)}</Typography>
                </ListItem>

                {/* Shipping Voucher Select */}
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Shipping Voucher" />
                  <Box sx={{ minWidth: 120 }}>
                    <select
                      value={
                        selectedShippingVoucher?.discount_code ||
                        selectedShippingVoucher?.code ||
                        ""
                      }
                      onChange={(e) => handleShippingDiscount(e.target.value)}
                      style={{ padding: "6px", borderRadius: "4px" }}
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
                      sx={{ color: "success.main" }}
                    />
                    <Typography color="success.main">
                      -₱{shippingDiscountInfo.discount_amount.toFixed(2)}
                    </Typography>
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Typography variant="h6" fontWeight="bold">
                      Total
                    </Typography>
                  }
                />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ₱{calculatedTotal.toFixed(2)}
                </Typography>
              </ListItem>

              {appliedDiscountInfo && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`${appliedDiscountInfo.code} - ${appliedDiscountInfo.percentage}% OFF`}
                    color="success"
                    size="small"
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {appliedDiscountInfo.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="success.main"
                    display="block"
                  >
                    You saved ${appliedDiscountInfo.discountAmount.toFixed(2)}!
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PaymentPage;
