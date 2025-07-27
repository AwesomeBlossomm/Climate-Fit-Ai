import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Divider,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  TextField,
  CardMedia,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sizeUpdates, setSizeUpdates] = useState({});
  const { token } = useAuth();

  const fetchCart = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch detailed product information for each cart item
      const itemsWithDetails = await Promise.all(
        response.data.items?.map(async (item) => {
          try {
            const productResponse = await axios.get(
              `http://localhost:8000/api/v1/products/${item.product_id}`
            );
            return {
              ...item,
              productDetails: productResponse.data,
            };
          } catch (error) {
            console.error(
              `Failed to fetch details for product ${item.product_id}:`,
              error
            );
            return item; // Return the original item if details fetch fails
          }
        }) || []
      );

      setCartItems(itemsWithDetails);
      // Initialize all items as selected by default
      setSelectedItems(itemsWithDetails.map((item) => item.product_id) || []);
      // Initialize size updates with current sizes
      const initialSizes = {};
      itemsWithDetails.forEach((item) => {
        initialSizes[item.product_id] = item.size || "";
      });
      setSizeUpdates(initialSizes);
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity, size, color) => {
    try {
      await axios.put(
        `http://localhost:8000/api/cart/item/${productId}`,
        { quantity: newQuantity, size, color },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const updateSize = async (
    productId,
    newSize,
    currentColor,
    currentQuantity
  ) => {
    try {
      setSizeUpdates((prev) => ({ ...prev, [productId]: newSize }));

      const currentItem = cartItems.find(
        (item) => item.product_id === productId
      );
      if (!currentItem) {
        throw new Error("Item not found in local cart");
      }

      // Send old_size and old_color as query params for backend matching
      await axios.put(
        `http://localhost:8000/api/cart/item/${productId}?old_size=${encodeURIComponent(
          currentItem.size || ""
        )}&old_color=${encodeURIComponent(currentItem.color || "")}`,
        {
          quantity: currentQuantity,
          size: newSize,
          color: currentColor,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchCart();
    } catch (err) {
      console.error("Size update failed", err);
      setSizeUpdates((prev) => ({ ...prev, [productId]: currentItem.size }));

      alert("Failed to update size. Please try again.");
    }
  };

  const removeFromCart = async (productId, size, color) => {
    try {
      await axios.delete(`http://localhost:8000/api/cart/item/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { size, color },
      });
      fetchCart();
      // Remove from selected items if it was selected
      setSelectedItems((prev) => prev.filter((id) => id !== productId));
    } catch (err) {
      console.error("Remove failed", err);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete("http://localhost:8000/api/cart/clear", {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCart();
      setSelectedItems([]);
    } catch (err) {
      console.error("Clear cart error:", err);
    }
  };

  const handleSelectItem = (productId) => {
    setSelectedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateSelectedTotal = () => {
    return cartItems
      .filter((item) => selectedItems.includes(item.product_id))
      .reduce((total, item) => total + item.unit_price * item.quantity, 0);
  };

  const addToCart = async (productId, size, color) => {
    try {
      // Find if the product with the same size and color is already in the cart
      const existingItem = cartItems.find(
        (item) =>
          item.product_id === productId &&
          item.size === size &&
          item.color === color
      );

      if (existingItem) {
        // If exists, increase quantity by 1
        await axios.put(
          `http://localhost:8000/api/cart/item/${productId}`,
          {
            quantity: existingItem.quantity + 1,
            size,
            color,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // If not, add as new item
        await axios.post(
          `http://localhost:8000/api/cart/item`,
          {
            product_id: productId,
            quantity: 1,
            size,
            color,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchCart();
    } catch (err) {
      console.error("Add to cart failed", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Your Cart
      </Typography>

      {cartItems.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6">Your cart is empty</Typography>
        </Paper>
      ) : (
        <>
          {/* Cart Items */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            {cartItems.map((item) => (
              <Box
                key={`${item.product_id}-${item.size}-${item.color}`}
                sx={{
                  mb: 2,
                  pb: 2,
                  display: "flex",
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedItems.includes(item.product_id)}
                      onChange={() => handleSelectItem(item.product_id)}
                    />
                  }
                />

                {/* Product Image */}
                <CardMedia
                  component="img"
                  sx={{ width: 120, height: 120, objectFit: "cover", mr: 2 }}
                  image={
                    item.image_url ||
                    item.productDetails?.image_url ||
                    item.productDetails?.images?.[0] ||
                    "https://via.placeholder.com/300x400?text=Fashion+Item"
                  }
                  alt={item.product_name}
                  onError={(e) => {
                    // Fallback logic for broken images
                    if (
                      item.productDetails?.images &&
                      item.productDetails.images.length > 1 &&
                      !e.target.src.includes("placeholder")
                    ) {
                      e.target.src = item.productDetails.images[1];
                    } else if (!e.target.src.includes("placeholder")) {
                      e.target.src =
                        "https://via.placeholder.com/300x400?text=Fashion+Item";
                    }
                  }}
                />

                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{item.product_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(item.unit_price)} × {item.quantity}
                    {item.color && ` • Color: ${item.color}`}
                  </Typography>

                  {/* Size Selector */}
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      Size:
                    </Typography>
                    <Select
                      value={sizeUpdates[item.product_id] || item.size || ""}
                      onChange={(e) => {
                        const newSize = e.target.value;
                        updateSize(
                          item.product_id,
                          newSize,
                          item.color, // Current color
                          item.quantity // Current quantity
                        );
                      }}
                      size="small"
                      sx={{ minWidth: 80 }}
                    >
                      {(
                        item.productDetails?.size_available || [
                          "S",
                          "M",
                          "L",
                          "XL",
                        ]
                      ).map((size) => (
                        <MenuItem key={size} value={size}>
                          {size}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {/* Quantity Selector */}
                  <TextField
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = Math.max(
                        1,
                        parseInt(e.target.value) || 1
                      );
                      // Use the current size/color for matching
                      updateQuantity(
                        item.product_id,
                        newQuantity,
                        item.size,
                        item.color
                      );
                    }}
                    inputProps={{ min: 1 }}
                    size="small"
                    sx={{ width: 70, mr: 1 }}
                  />

                  <IconButton
                    color="error"
                    onClick={() =>
                      removeFromCart(item.product_id, item.size, item.color)
                    }
                    sx={{ ml: 1 }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            ))}

            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button variant="outlined" color="error" onClick={clearCart}>
                Clear Entire Cart
              </Button>
            </Box>
          </Paper>

          {/* Order Summary */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>

            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography>Selected Items Total:</Typography>
              <Typography fontWeight="bold">
                {formatCurrency(calculateSelectedTotal())}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={selectedItems.length === 0}
            >
              Proceed with Selected Items
            </Button>
          </Paper>
        </>
      )}
    </Container>
  );
};
export default Cart;
