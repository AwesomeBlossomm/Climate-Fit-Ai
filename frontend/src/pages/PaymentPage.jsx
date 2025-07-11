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
  const [paymentMethod, setPaymentMethod] = useState("card");
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
        if (paymentMethod === "card") {
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

  const processPayment = async () => {
    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const orderNum = `CF${Date.now().toString().slice(-6)}`;
    setOrderNumber(orderNum);
    setProcessing(false);
    setOrderSuccess(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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
                Order Successful!
              </Typography>
              <Typography variant="h6" gutterBottom>
                Order Number: {orderNumber}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Thank you for your purchase! Your order has been confirmed and
                will be shipped soon.
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Order Total: ${total.toFixed(2)}
                </Typography>
                {appliedDiscount && (
                  <Typography color="success.main">
                    You saved ${discount.toFixed(2)} with discount!
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
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard
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
                        value="card"
                        control={<Radio />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <CreditCard />
                            <Typography>Credit/Debit Card</Typography>
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
                        value="bank"
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

                  {paymentMethod === "card" && (
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

                  {paymentMethod === "bank" && (
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
                        {paymentMethod === "card" && <CreditCard />}
                        {paymentMethod === "paypal" && <Payment />}
                        {paymentMethod === "bank" && <AccountBalance />}
                        <Typography>
                          {paymentMethod === "card" &&
                            `Card ending in ${cardInfo.cardNumber.slice(-4)}`}
                          {paymentMethod === "paypal" && "PayPal"}
                          {paymentMethod === "bank" && "Bank Transfer"}
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
                        Processing...
                      </>
                    ) : (
                      "Complete Order"
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

                {appliedDiscount && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={`Discount`}
                      sx={{ color: "success.main" }}
                    />
                    <Typography color="success.main">
                      -${discount.toFixed(2)}
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
                  ${total.toFixed(2)}
                </Typography>
              </ListItem>

              {appliedDiscount && (
                <Chip
                  label={appliedDiscount.description}
                  color="success"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PaymentPage;
