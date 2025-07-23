import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from "@mui/material";
import { LocalOffer, Close } from "@mui/icons-material";
import { useCart } from "../contexts/CartContext";
import { useDiscount } from "../contexts/DiscountContext";
import { motion } from "framer-motion";

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } =
    useCart();
  const {
    appliedDiscount,
    isApplying,
    applyDiscount,
    removeDiscount,
    calculateDiscountedTotal,
  } = useDiscount();
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountSuccess, setDiscountSuccess] = useState("");

  const originalTotal = getTotalPrice();
  const finalTotal = calculateDiscountedTotal(originalTotal);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }

    try {
      setDiscountError("");
      setDiscountSuccess("");

      await applyDiscount(discountCode.trim(), originalTotal);

      setDiscountSuccess(`Discount "${discountCode}" applied successfully!`);
      setDiscountCode("");
    } catch (error) {
      setDiscountError(error.message || "Invalid discount code");
    }
  };

  const handleRemoveDiscount = () => {
    removeDiscount();
    setDiscountSuccess("");
    setDiscountError("");
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#2e7d32" }}
      >
        🛒 Shopping Cart
      </Typography>

      {cartItems.length === 0 ? (
        <Paper
          elevation={2}
          sx={{ p: 4, textAlign: "center", borderRadius: 3 }}
        >
          <Typography variant="h6" color="text.secondary">
            Your cart is empty
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Cart Items */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            {cartItems.map((item) => (
              <Box
                key={item.id}
                sx={{ mb: 2, pb: 2, borderBottom: "1px solid #eee" }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${item.price} × {item.quantity}
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </Button>
                    <Typography component="span" sx={{ mx: 2 }}>
                      {item.quantity}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      color="error"
                      onClick={() => removeFromCart(item.id)}
                      sx={{ ml: 2 }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Paper>

          {/* Discount Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                fontWeight: "medium",
              }}
            >
              <LocalOffer sx={{ mr: 1, color: "#2e7d32" }} />
              Discount Code
            </Typography>

            {!appliedDiscount ? (
              <Box display="flex" gap={2} alignItems="flex-start">
                <TextField
                  label="Enter discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                  onKeyPress={(e) => e.key === "Enter" && handleApplyDiscount()}
                />
                <Button
                  variant="contained"
                  onClick={handleApplyDiscount}
                  disabled={isApplying}
                  sx={{
                    bgcolor: "#2e7d32",
                    "&:hover": { bgcolor: "#1b5e20" },
                  }}
                >
                  {isApplying ? <CircularProgress size={20} /> : "Apply"}
                </Button>
              </Box>
            ) : (
              <Box>
                <Chip
                  label={`${appliedDiscount.code} - ${appliedDiscount.percentage}% OFF`}
                  color="success"
                  deleteIcon={<Close />}
                  onDelete={handleRemoveDiscount}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {appliedDiscount.description}
                </Typography>
              </Box>
            )}

            {discountError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {discountError}
              </Alert>
            )}

            {discountSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {discountSuccess}
              </Alert>
            )}
          </Paper>

          {/* Order Summary */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Subtotal:</Typography>
              <Typography>${originalTotal.toFixed(2)}</Typography>
            </Box>

            {appliedDiscount && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="success.main">
                  Discount ({appliedDiscount.percentage}%):
                </Typography>
                <Typography color="success.main">
                  -${appliedDiscount.discountAmount.toFixed(2)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Total:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                ${finalTotal.toFixed(2)}
              </Typography>
            </Box>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  bgcolor: "#2e7d32",
                  "&:hover": { bgcolor: "#1b5e20" },
                  py: 1.5,
                }}
              >
                Proceed to Checkout
              </Button>
            </motion.div>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default Cart;
