import React, { useState } from "react";
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

const PaymentPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [billingInfo, setBillingInfo] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "USA",
  });
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

  const steps = ["Billing Information", "Payment Method", "Review Order"];

  const handleBillingChange = (field, value) => {
    setBillingInfo({ ...billingInfo, [field]: value });
  };

  const handleCardChange = (field, value) => {
    setCardInfo({ ...cardInfo, [field]: value });
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        return (
          billingInfo.fullName &&
          billingInfo.email &&
          billingInfo.address &&
          billingInfo.city &&
          billingInfo.state &&
          billingInfo.zipCode
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

  const createPayment = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const paymentItems = cartItems.map((item) => ({
        product_id: item.id.toString(),
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

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
        discount_code: appliedDiscount?.code || null,
        currency: "USD",
        notes: `Payment for ${cartItems.length} items`,
      };

      const response = await fetch(
        "http://localhost:8000/payments/create-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create payment");
      }

      const result = await response.json();
      return result.payment_id;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  };

  const processPaymentTransaction = async (paymentId) => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `http://localhost:8000/payments/process-payment/${paymentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Payment processing failed");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error processing payment:", error);
      throw error;
    }
  };

  const processPayment = async () => {
    setProcessing(true);
    setError("");

    try {
      // Step 1: Create payment
      const createdPaymentId = await createPayment();
      setPaymentId(createdPaymentId);

      // Step 2: Process payment
      const paymentResult = await processPaymentTransaction(createdPaymentId);

      if (paymentResult.status === "completed") {
        setOrderNumber(paymentResult.transaction_id || createdPaymentId);
        setProcessing(false);
        setOrderSuccess(true);

        // Refresh user discounts if discount was used
        if (appliedDiscount?.code) {
          // The discount usage is automatically handled by the backend
          console.log("Discount used successfully:", appliedDiscount.code);
        }
      } else {
        throw new Error(paymentResult.message || "Payment failed");
      }
    } catch (error) {
      setError(error.message);
      setProcessing(false);
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
        const assignedDiscountResult = await discountAPI.applyAssignedDiscount(
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

  // Calculate totals based on applied discount
  const calculatedDiscount =
    appliedDiscountInfo?.discountAmount || discount || 0;
  const calculatedTotal =
    appliedDiscountInfo?.finalAmount || total || subtotal - calculatedDiscount;

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
                      <TextField
                        label="Address"
                        fullWidth
                        value={billingInfo.address}
                        onChange={(e) =>
                          handleBillingChange("address", e.target.value)
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="City"
                        fullWidth
                        value={billingInfo.city}
                        onChange={(e) =>
                          handleBillingChange("city", e.target.value)
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="State"
                        fullWidth
                        value={billingInfo.state}
                        onChange={(e) =>
                          handleBillingChange("state", e.target.value)
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="ZIP Code"
                        fullWidth
                        value={billingInfo.zipCode}
                        onChange={(e) =>
                          handleBillingChange("zipCode", e.target.value)
                        }
                        required
                      />
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
                        value="credit_card"
                        control={<Radio />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <CreditCard />
                            <Typography>Credit Card</Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="debit_card"
                        control={<Radio />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <CreditCard />
                            <Typography>Debit Card</Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="paypal"
                        control={<Radio />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Payment />
                            <Typography>PayPal</Typography>
                          </Box>
                        }
                      />
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
                        value="bank_transfer"
                        control={<Radio />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <AccountBalance />
                            <Typography>Bank Transfer</Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>

                  {(paymentMethod === "credit_card" ||
                    paymentMethod === "debit_card") && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          label="Card Number"
                          fullWidth
                          placeholder="1234 5678 9012 3456"
                          value={cardInfo.cardNumber}
                          onChange={(e) =>
                            handleCardChange("cardNumber", e.target.value)
                          }
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Expiry Date"
                          placeholder="MM/YY"
                          fullWidth
                          value={cardInfo.expiryDate}
                          onChange={(e) =>
                            handleCardChange("expiryDate", e.target.value)
                          }
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="CVV"
                          placeholder="123"
                          fullWidth
                          value={cardInfo.cvv}
                          onChange={(e) =>
                            handleCardChange("cvv", e.target.value)
                          }
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Cardholder Name"
                          fullWidth
                          value={cardInfo.cardholderName}
                          onChange={(e) =>
                            handleCardChange("cardholderName", e.target.value)
                          }
                          required
                        />
                      </Grid>
                    </Grid>
                  )}

                  {paymentMethod === "paypal" && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      You will be redirected to PayPal to complete your payment.
                    </Alert>
                  )}

                  {paymentMethod === "gcash" && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      You will be redirected to GCash to complete your payment.
                    </Alert>
                  )}

                  {paymentMethod === "bank_transfer" && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Bank transfer details will be provided after order
                      confirmation.
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
                        {paymentMethod === "credit_card" && <CreditCard />}
                        {paymentMethod === "debit_card" && <CreditCard />}
                        {paymentMethod === "paypal" && <Payment />}
                        {paymentMethod === "gcash" && <Payment />}
                        {paymentMethod === "bank_transfer" && (
                          <AccountBalance />
                        )}
                        <Typography>
                          {paymentMethod === "credit_card" &&
                            `Card ending in ${cardInfo.cardNumber.slice(-4)}`}
                          {paymentMethod === "debit_card" &&
                            `Card ending in ${cardInfo.cardNumber.slice(-4)}`}
                          {paymentMethod === "paypal" && "PayPal"}
                          {paymentMethod === "gcash" && "GCash"}
                          {paymentMethod === "bank_transfer" && "Bank Transfer"}
                        </Typography>
                      </Box>
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
                    onClick={processPayment}
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
                <Box key={item.id} sx={{ mb: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2">
                      {item.name} × {item.quantity}
                    </Typography>
                    <Typography variant="body2">
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Subtotal" />
                  <Typography>${subtotal.toFixed(2)}</Typography>
                </ListItem>

                {appliedDiscountInfo && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={`Discount (${appliedDiscountInfo.code})`}
                      sx={{ color: "success.main" }}
                    />
                    <Typography color="success.main">
                      -${appliedDiscountInfo.discountAmount.toFixed(2)}
                    </Typography>
                  </ListItem>
                )}

                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Shipping" />
                  <Typography color="success.main">FREE</Typography>
                </ListItem>
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
                  ${calculatedTotal.toFixed(2)}
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
