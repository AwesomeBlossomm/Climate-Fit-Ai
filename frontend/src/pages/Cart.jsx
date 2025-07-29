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
  Badge,
} from "@mui/material";
import { Delete, ShoppingCart, ArrowBack, Dashboard, Store } from "@mui/icons-material";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sizeUpdates, setSizeUpdates] = useState({});
  const { token } = useAuth();
  const navigate = useNavigate();

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

  // Handler for proceeding with selected items
  const handleProceedWithSelected = () => {
    const selectedCartItems = cartItems.filter((item) =>
      selectedItems.includes(item.product_id)
    );

    const subtotal = selectedCartItems.reduce(
      (total, item) => total + item.unit_price * item.quantity,
      0
    );

    // Pass product_id, size, color for deletion after payment
    navigate("/payment", {
      state: {
        cartItems: selectedCartItems.map((item) => ({
          id: item.product_id,
          name: item.product_name,
          price: item.unit_price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.image_url || "default-image-url",
          // Add these for deletion
          product_id: item.product_id,
        })),
        subtotal,
        discount: 0,
        total: subtotal,
        appliedDiscount: null,
        selectedItemIds: selectedItems,
      },
    });
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f0f8f0",
          background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={60} sx={{ color: "#4a5d3a" }} />
      </Box>
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
              SHOPPING CART
            </Typography>
          </Box>
        </Box>

        {/* Header Actions */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            onClick={() => navigate(-1)}
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
            onClick={() => navigate("/dashboard")}
            startIcon={<Dashboard />}
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
            Dashboard
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
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Cart Header with Dashboard.jsx styling */}
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
                  <ShoppingCart sx={{ fontSize: 40, color: "#ffffff" }} />
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
                    Your Cart 🛒
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: "1rem",
                      lineHeight: 1.5,
                    }}
                  >
                    Review and manage your selected items
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
                  {cartItems.length}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.75rem",
                  }}
                >
                  Items
                </Typography>
              </Box>
            </Box>

            {cartItems.length === 0 ? (
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 8, 
                  textAlign: "center",
                  borderRadius: "20px",
                  background: "#ffffff",
                  boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                  border: "1px solid rgba(74, 93, 58, 0.1)",
                }}
              >
                <ShoppingCart sx={{ fontSize: 64, color: "#8fa876", mb: 2 }} />
                <Typography 
                  variant="h6" 
                  sx={{ color: "#4a5d3a", fontWeight: 600, mb: 1 }}
                >
                  Your cart is empty
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b8459", mb: 3 }}>
                  Start shopping to add items to your cart
                </Typography>
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
                  Start Shopping
                </Button>
              </Paper>
            ) : (
              <>
                {/* Cart Items with Dashboard.jsx styling */}
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3, 
                      mb: 3,
                      borderRadius: "20px",
                      background: "#ffffff",
                      boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                      border: "1px solid rgba(74, 93, 58, 0.1)",
                    }}
                  >
                    {cartItems.map((item, index) => (
                      <motion.div
                        key={`${item.product_id}-${item.size}-${item.color}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Box
                          sx={{
                            mb: 2,
                            pb: 2,
                            display: "flex",
                            alignItems: "center",
                            borderBottom: index < cartItems.length - 1 ? "1px solid rgba(74, 93, 58, 0.1)" : "none",
                            "&:hover": {
                              backgroundColor: "rgba(74, 93, 58, 0.02)",
                              borderRadius: "12px",
                              p: 1,
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedItems.includes(item.product_id)}
                                onChange={() => handleSelectItem(item.product_id)}
                                sx={{
                                  color: "#8fa876",
                                  "&.Mui-checked": {
                                    color: "#4a5d3a",
                                  },
                                }}
                              />
                            }
                          />

                          {/* Product Image */}
                          <CardMedia
                            component="img"
                            sx={{ 
                              width: 120, 
                              height: 120, 
                              objectFit: "cover", 
                              mr: 2,
                              borderRadius: "12px",
                              border: "1px solid rgba(74, 93, 58, 0.1)",
                            }}
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
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                color: "#4a5d3a", 
                                fontWeight: 600,
                                mb: 1,
                              }}
                            >
                              {item.product_name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: "#6b8459",
                                mb: 1,
                              }}
                            >
                              {formatCurrency(item.unit_price)} × {item.quantity}
                              {item.color && ` • Color: ${item.color}`}
                            </Typography>

                            {/* Size Selector */}
                            <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  mr: 1, 
                                  color: "#4a5d3a",
                                  fontWeight: 600,
                                }}
                              >
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
                                sx={{ 
                                  minWidth: 80,
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
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
                              sx={{ 
                                width: 70, 
                                mr: 1,
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px',
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
                            />

                            <IconButton
                              color="error"
                              onClick={() =>
                                removeFromCart(item.product_id, item.size, item.color)
                              }
                              sx={{ 
                                ml: 1,
                                backgroundColor: "rgba(244, 67, 54, 0.1)",
                                "&:hover": {
                                  backgroundColor: "rgba(244, 67, 54, 0.2)",
                                },
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}

                    <Box display="flex" justifyContent="flex-end" mt={2}>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={clearCart}
                        sx={{
                          borderRadius: "12px",
                          px: 3,
                          py: 1,
                          fontWeight: 600,
                          "&:hover": {
                            backgroundColor: "rgba(244, 67, 54, 0.1)",
                          },
                        }}
                      >
                        Clear Entire Cart
                      </Button>
                    </Box>
                  </Paper>
                </Box>

                {/* Order Summary with Dashboard.jsx styling */}
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3,
                      borderRadius: "20px",
                      background: "#ffffff",
                      boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                      border: "1px solid rgba(74, 93, 58, 0.1)",
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{
                        color: "#4a5d3a",
                        fontWeight: 700,
                        fontSize: "1.3rem",
                        mb: 3,
                      }}
                    >
                      Order Summary
                    </Typography>

                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      mb={2}
                      sx={{
                        p: 2,
                        backgroundColor: "rgba(74, 93, 58, 0.05)",
                        borderRadius: "12px",
                      }}
                    >
                      <Typography sx={{ color: "#4a5d3a", fontWeight: 600 }}>
                        Selected Items Total:
                      </Typography>
                      <Typography 
                        sx={{ 
                          fontWeight: 700,
                          color: "#4a5d3a",
                          fontSize: "1.1rem",
                        }}
                      >
                        {formatCurrency(calculateSelectedTotal())}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: "rgba(74, 93, 58, 0.2)" }} />

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={selectedItems.length === 0}
                      onClick={handleProceedWithSelected}
                      sx={{
                        backgroundColor: "#8fa876",
                        color: "#ffffff",
                        borderRadius: "12px",
                        py: 1.5,
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        "&:hover": {
                          backgroundColor: "#7a956a",
                          transform: "translateY(-2px)",
                        },
                        "&:disabled": {
                          backgroundColor: "rgba(74, 93, 58, 0.3)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      Proceed with Selected Items ({selectedItems.length})
                    </Button>
                  </Paper>
                </Box>
              </>
            )}
          </motion.div>
        </Container>
      </Box>
    </>
  );
};

export default Cart;
