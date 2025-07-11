import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Grid,
  Paper,
  Divider,
  TextField,
  Chip,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  LocalOffer,
  ArrowBack,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Cart = () => {
  const { user, logout } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    appliedDiscount,
    applyDiscount,
    removeDiscount,
    getCartTotal,
    getDiscountAmount,
    getFinalTotal,
    getCartItemsCount,
  } = useCart();
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Mock cart data (in real app, this would come from context/state management)
  const mockCartItems = [];

  const discountCodes = {
    SUMMER50: { discount: 0.5, description: "50% off Summer Sale" },
    ECO33: { discount: 0.33, description: "33% off Eco Special" },
    SAVE20: { discount: 0.2, description: "20% off Everything" },
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setConfirmRemove(id);
      return;
    }
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
    setConfirmRemove(null);
    setSnackbar({
      open: true,
      message: "Item removed from cart",
      severity: "info",
    });
  };

  const handleApplyDiscount = () => {
    const discount = discountCodes[discountCode.toUpperCase()];
    if (discount) {
      applyDiscount(discount);
      setSnackbar({
        open: true,
        message: `Discount applied: ${discount.description}`,
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: "Invalid discount code",
        severity: "error",
      });
    }
  };

  const handleRemoveDiscount = () => {
    removeDiscount();
    setDiscountCode("");
    setSnackbar({
      open: true,
      message: "Discount removed",
      severity: "info",
    });
  };

  const getSubtotal = () => {
    return getCartTotal();
  };

  const getDiscountAmountDisplay = () => {
    return getDiscountAmount();
  };

  const getTotal = () => {
    return getFinalTotal();
  };

  const getTotalItems = () => {
    return getCartItemsCount();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const proceedToPayment = () => {
    navigate("/payment", {
      state: {
        cartItems,
        subtotal: getSubtotal(),
        discount: getDiscountAmountDisplay(),
        total: getTotal(),
        appliedDiscount,
      },
    });
  };

  if (cartItems.length === 0) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => navigate("/products")}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Shopping Cart
            </Typography>
            <Button color="inherit" onClick={() => navigate("/products")}>
              Products
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={3}
              sx={{ p: 6, textAlign: "center", borderRadius: 3 }}
            >
              <ShoppingCart sx={{ fontSize: 80, color: "#bdbdbd", mb: 2 }} />
              <Typography variant="h4" gutterBottom color="text.secondary">
                Your cart is empty
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start shopping to add items to your cart
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/products")}
                sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" } }}
              >
                Continue Shopping
              </Button>
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
          <IconButton color="inherit" onClick={() => navigate("/products")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Shopping Cart ({getTotalItems()} items)
          </Typography>
          <Button color="inherit" onClick={() => navigate("/products")}>
            Products
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Cart Items */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
                Cart Items
              </Typography>

              {cartItems.map((item) => (
                <Card key={item.id} sx={{ mb: 2, borderRadius: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={3} md={2}>
                        <CardMedia
                          component="img"
                          height="80"
                          image={item.image}
                          alt={item.name}
                          sx={{ borderRadius: 1, objectFit: "cover" }}
                        />
                      </Grid>
                      <Grid item xs={5} md={6}>
                        <Typography variant="h6" gutterBottom>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${item.price} each
                        </Typography>
                      </Grid>
                      <Grid item xs={2} md={2}>
                        <Box
                          display="flex"
                          alignItems="center"
                          flexDirection="column"
                        >
                          <Box display="flex" alignItems="center">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <Remove />
                            </IconButton>
                            <Typography
                              sx={{ mx: 1, minWidth: 20, textAlign: "center" }}
                            >
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <Add />
                            </IconButton>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={2} md={2}>
                        <Box textAlign="right">
                          <Typography
                            variant="h6"
                            color="primary"
                            fontWeight="bold"
                          >
                            ${(item.price * item.quantity).toFixed(2)}
                          </Typography>
                          <IconButton
                            color="error"
                            onClick={() => setConfirmRemove(item.id)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper
                elevation={3}
                sx={{ p: 3, borderRadius: 3, position: "sticky", top: 20 }}
              >
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  Order Summary
                </Typography>

                {/* Discount Code Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <LocalOffer sx={{ verticalAlign: "middle", mr: 1 }} />
                    Discount Code
                  </Typography>
                  {appliedDiscount ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={appliedDiscount.description}
                        color="success"
                        onDelete={handleRemoveDiscount}
                      />
                    </Box>
                  ) : (
                    <Box display="flex" gap={1}>
                      <TextField
                        size="small"
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        sx={{ flexGrow: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleApplyDiscount}
                        disabled={!discountCode}
                      >
                        Apply
                      </Button>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Price Breakdown */}
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="Subtotal" />
                    <Typography>${getSubtotal().toFixed(2)}</Typography>
                  </ListItem>

                  {appliedDiscount && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={`Discount (${(
                          appliedDiscount.discount * 100
                        ).toFixed(0)}%)`}
                        sx={{ color: "success.main" }}
                      />
                      <Typography color="success.main">
                        -${getDiscountAmountDisplay().toFixed(2)}
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
                    ${getTotal().toFixed(2)}
                  </Typography>
                </ListItem>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={proceedToPayment}
                  sx={{
                    mt: 2,
                    bgcolor: "#2e7d32",
                    "&:hover": { bgcolor: "#1b5e20" },
                    py: 1.5,
                  }}
                >
                  Proceed to Payment
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate("/products")}
                  sx={{ mt: 1 }}
                >
                  Continue Shopping
                </Button>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Confirm Remove Dialog */}
      <Dialog open={!!confirmRemove} onClose={() => setConfirmRemove(null)}>
        <DialogTitle>Remove Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this item from your cart?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemove(null)}>Cancel</Button>
          <Button onClick={() => handleRemoveItem(confirmRemove)} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Cart;
