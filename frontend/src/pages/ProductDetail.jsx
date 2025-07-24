import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  Container,
  Chip,
  Badge,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Rating,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Skeleton,
} from "@mui/material";
import {
  ShoppingCart,
  ArrowBack,
  Add,
  Store,
  Comment,
  Star,
  Send,
  Person,
  Email,
  Phone,
  LocationOn,
  Verified,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { clothingAPI } from "../services/api";

const ProductDetail = () => {
  const { user, logout } = useAuth();
  const { addToCart, getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const { productId } = useParams();

  // State
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [openAddToCart, setOpenAddToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Comment form state
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState({
    user_name: "",
    user_email: "",
    comment: "",
    rating: 5,
  });

  // Fetch product details
  useEffect(() => {
    if (productId) {
      fetchProductDetails();
      fetchComments();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await clothingAPI.getProductDetails(productId);
      const productData = response.data;

      // Ensure proper data structure for MongoDB products
      const formattedProduct = {
        ...productData,
        _id: productData._id || productData.id,
        price_php: productData.price_php || productData.price || 0,
        image_path:
          productData.image_path ||
          productData.image ||
          "https://via.placeholder.com/400x500?text=Fashion+Item",
        sizes_available: productData.sizes_available || productData.sizes || [],
        average_rating: productData.average_rating || 0,
        total_comments: productData.total_comments || 0,
        seller: productData.seller || null,
      };

      setProduct(formattedProduct);
    } catch (error) {
      console.error("Error fetching product details:", error);
      setSnackbar({
        open: true,
        message: "Failed to load product details",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await clothingAPI.getProductComments(productId);
      setComments(response.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const cartProduct = {
      id: product._id,
      name: product.name,
      price: product.price_php || 0,
      image:
        product.image_path ||
        "https://via.placeholder.com/300x400?text=Fashion+Item",
      brand: product.brand_style || "Fashion",
      category: product.category || "Clothing",
      description: product.description || "",
      rating: product.average_rating || 0,
    };

    setOpenAddToCart(true);
  };

  const confirmAddToCart = () => {
    if (!product) return;

    const cartProduct = {
      id: product._id,
      name: product.name,
      price: product.price_php || 0,
      image:
        product.image_path ||
        "https://via.placeholder.com/300x400?text=Fashion+Item",
      brand: product.brand_style || "Fashion",
      category: product.category || "Clothing",
      description: product.description || "",
      rating: product.average_rating || 0,
    };

    addToCart(cartProduct, quantity);

    setSnackbar({
      open: true,
      message: `${product.name} added to cart!`,
      severity: "success",
    });

    setOpenAddToCart(false);
    setQuantity(1);
  };

  const handleSubmitComment = async () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: "Please login to leave a comment",
        severity: "warning",
      });
      return;
    }

    try {
      await clothingAPI.createProductComment(productId, newComment);
      setSnackbar({
        open: true,
        message: "Comment added successfully!",
        severity: "success",
      });
      setOpenCommentDialog(false);
      setNewComment({
        user_name: "",
        user_email: "",
        comment: "",
        rating: 5,
      });
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error("Error submitting comment:", error);
      setSnackbar({
        open: true,
        message: "Failed to submit comment",
        severity: "error",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f0f8f0", background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)" }}>
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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              letterSpacing: 1.5,
              color: "#ffffff",
              fontSize: "1.2rem",
            }}
          >
            CLIMATEFIT FASHION STORE
          </Typography>
        </Box>
        <Container maxWidth="xl" sx={{ py: 4, pt: 12, mt: 8 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="text" height={40} width="80%" />
              <Skeleton variant="text" height={30} width="60%" />
              <Skeleton variant="text" height={60} width="100%" />
              <Skeleton variant="text" height={40} width="50%" />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f0f8f0", background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)" }}>
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
          <Box display="flex" alignItems="center">
            <Box
              onClick={() => navigate("/products")}
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
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: "#ffffff",
                  fontSize: "1.2rem",
                }}
              >
                Product Not Found
              </Typography>
            </Box>
          </Box>
        </Box>
        <Container maxWidth="xl" sx={{ py: 4, pt: 12, mt: 8 }}>
          <Typography variant="h5" align="center" sx={{ color: "#4a5d3a", fontWeight: 700 }}>
            Product not found
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/products")}
            sx={{
              mt: 2,
              display: "block",
              mx: "auto",
              bgcolor: "#4a5d3a",
              borderRadius: "25px",
              px: 3,
              py: 1,
              fontWeight: 600,
              "&:hover": { 
                bgcolor: "#3a4d2a",
              },
            }}
          >
            Back to Products
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f0f8f0", background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)" }}>
      {/* Header with Home.jsx styling */}
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
            onClick={() => navigate("/products")}
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
              CLIMATEFIT FASHION STORE
            </Typography>
          </Box>
        </Box>

        {/* Header Actions */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            onClick={() => navigate("/products")}
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
            onClick={() => navigate("/dashboard")}
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
            Dashboard
          </Button>
          <Button
            onClick={() => navigate("/cart")}
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
            <Badge badgeContent={getCartItemsCount()} color="error">
              <ShoppingCart />
            </Badge>
          </Button>
          {user && (
            <Button
              onClick={handleLogout}
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
              Logout
            </Button>
          )}
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4, pt: 12, mt: 8, display: "flex", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%" }}
        >
          {/* Main Product Section - Compact Separate Boxes with Equal Heights */}
          <Grid container spacing={3} mb={3} justifyContent="center">
            {/* Product Image - Same Height */}
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ borderRadius: 3, boxShadow: "0 8px 25px rgba(74, 93, 58, 0.15)", maxWidth: "400px", mx: "auto", height: "450px" }}>
                <CardMedia
                  component="img"
                  height="460"
                  image={
                    product.image_path ||
                    "https://via.placeholder.com/400x500?text=Fashion+Item"
                  }
                  alt={product.name}
                  sx={{ objectFit: "cover", height: "100%" }}
                  onError={(e) => {
                    console.log(
                      `Product detail image failed to load: ${e.target.src}`
                    );
                    // Try alternative sources with better fallback
                    if (
                      product.images &&
                      product.images.length > 0 &&
                      !e.target.src.includes("placeholder")
                    ) {
                      e.target.src = product.images[0];
                    } else if (
                      product.image_path &&
                      !e.target.src.includes("placeholder") &&
                      !e.target.src.includes("api/v1/image")
                    ) {
                      // Try the comprehensive image endpoint
                      const filename = product.image_path.split(/[\\/]/).pop();
                      e.target.src = `http://localhost:8000/api/v1/image/${filename}`;
                    } else if (!e.target.src.includes("placeholder")) {
                      e.target.src =
                        "https://via.placeholder.com/400x500?text=Fashion+Item";
                    }
                  }}
                  onLoad={() => {
                    console.log(
                      `Product detail image loaded successfully: ${product.image_path}`
                    );
                  }}
                />
              </Card>
            </Grid>

            {/* Product Details - Same Height with Adjusted Width */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  background: "#ffffff", 
                  boxShadow: "0 8px 25px rgba(74, 93, 58, 0.15)", 
                  maxWidth: "600px", 
                  mx: "auto",
                  height: "460px",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Header */}
                <Box mb={2}>
                  <Chip
                    label={product.category || "Fashion"}
                    size="small"
                    sx={{ 
                      bgcolor: "#4a5d3a", 
                      color: "#ffffff",
                      fontWeight: 600,
                      mb: 1,
                      fontSize: "0.75rem"
                    }}
                  />
                  <Typography 
                    variant="h5" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ color: "#4a5d3a", fontSize: "1.5rem", lineHeight: 1.2, mb: 1 }}
                  >
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.9rem", lineHeight: 1.4 }}>
                    {product.description}
                  </Typography>
                </Box>

                {/* Rating and Reviews */}
                {product.average_rating > 0 && (
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <Rating
                      value={product.average_rating}
                      readOnly
                      precision={0.1}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      ({product.average_rating.toFixed(1)} - {product.total_comments} reviews)
                    </Typography>
                  </Box>
                )}

                {/* Price */}
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{ color: "#4a5d3a", mb: 2, fontSize: "1.8rem" }}
                >
                  ₱{product.price_php?.toFixed(2) || "0.00"}
                </Typography>

                {/* Product Details - Compact Grid */}
                <Grid container spacing={1} mb={1.5}>
                  {product.color && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Color:</strong> {product.color}
                      </Typography>
                    </Grid>
                  )}
                  {product.material && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Material:</strong> {product.material}
                      </Typography>
                    </Grid>
                  )}
                  {product.season && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Season:</strong> {product.season}
                      </Typography>
                    </Grid>
                  )}
                  {product.gender && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Gender:</strong> {product.gender}
                      </Typography>
                    </Grid>
                  )}
                  {product.style && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Style:</strong> {product.style}
                      </Typography>
                    </Grid>
                  )}
                  {product.brand_style && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Brand:</strong> {product.brand_style}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Sizes */}
                {product.sizes_available &&
                  product.sizes_available.length > 0 && (
                    <Box mb={1.5}>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        <strong>Available Sizes:</strong>
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {product.sizes_available.map((size, index) => (
                          <Chip
                            key={index}
                            label={size}
                            variant="outlined"
                            size="small"
                            sx={{ fontSize: "0.7rem", height: "20px" }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                {/* Stock */}
                <Typography variant="caption" color="text.secondary" mb={1.5} display="block">
                  <strong>Stock:</strong> {product.quantity || 0} available
                </Typography>

                {/* Add to Cart Button - Ensure it stays in box */}
                <Box mt="auto" pt={1}>
                  <Button
                    variant="contained"
                    size="medium"
                    fullWidth
                    startIcon={<Add />}
                    onClick={handleAddToCart}
                    disabled={!product.quantity || product.quantity === 0}
                    sx={{
                      bgcolor: "#4a5d3a",
                      borderRadius: "25px",
                      px: 3,
                      py: .8,
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      boxShadow: "0 4px 15px rgba(74, 93, 58, 0.3)",
                      "&:hover": { 
                        bgcolor: "#3a4d2a",
                        boxShadow: "0 6px 20px rgba(74, 93, 58, 0.4)",
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                      Add to Cart
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Seller Information - Compact and Centered */}
          {product.seller && (
            <Box display="flex" justifyContent="center" mb={3}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, background: "#ffffff", boxShadow: "0 8px 25px rgba(74, 93, 58, 0.15)", maxWidth: "800px", width: "100%" }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6" fontWeight="bold" sx={{ color: "#4a5d3a", fontSize: "1.2rem" }}>
                    <Store sx={{ mr: 1, verticalAlign: "middle", fontSize: "1.3rem" }} />
                    Seller Information
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/seller/${product.seller._id}`)}
                    sx={{ 
                      color: "#4a5d3a", 
                      borderColor: "#4a5d3a",
                      borderRadius: "20px",
                      px: 2,
                      py: 0.5,
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      "&:hover": {
                        backgroundColor: "rgba(74, 93, 58, 0.1)",
                        borderColor: "#4a5d3a",
                      },
                    }}
                  >
                    View Store Profile
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      mb={1}
                      onClick={() => navigate(`/seller/${product.seller._id}`)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                        borderRadius: 2,
                        p: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: "#4a5d3a",
                          width: 40,
                          height: 40,
                          fontSize: "1.2rem",
                        }}
                      >
                        {product.seller.store_name?.charAt(0) || "S"}
                      </Avatar>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: "0.95rem" }}>
                            {product.seller.store_name}
                          </Typography>
                          {product.seller.is_verified && (
                            <Verified sx={{ color: "#4caf50", fontSize: 16 }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Owner: {product.seller.owner_full_name}
                        </Typography>
                        {product.seller.established_date && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Est. {new Date(product.seller.established_date).getFullYear()}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {product.seller.rating && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Rating
                          value={product.seller.rating}
                          readOnly
                          size="small"
                        />
                        <Typography variant="caption">
                          {product.seller.rating.toFixed(1)}/5.0
                        </Typography>
                      </Box>
                    )}

                    {product.seller.specializes_in &&
                      product.seller.specializes_in.length > 0 && (
                        <Box mt={1}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            gutterBottom
                            display="block"
                          >
                            Specializes in:
                          </Typography>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {product.seller.specializes_in.map(
                              (specialty, index) => (
                                <Chip
                                  key={index}
                                  label={specialty}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "0.7rem", height: "20px" }}
                                />
                              )
                            )}
                          </Box>
                        </Box>
                      )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    {product.seller.contact_number && (
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Phone fontSize="small" />
                        <Typography variant="caption">
                          {product.seller.contact_number}
                        </Typography>
                      </Box>
                    )}

                    {product.seller.email && (
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Email fontSize="small" />
                        <Typography variant="caption">
                          {product.seller.email}
                        </Typography>
                      </Box>
                    )}

                    {product.seller.address && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <LocationOn fontSize="small" />
                        <Typography variant="caption">
                          {product.seller.address}
                        </Typography>
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={() => navigate(`/seller/${product.seller._id}`)}
                      sx={{
                        mt: 1,
                        bgcolor: "#4a5d3a",
                        borderRadius: "20px",
                        px: 2,
                        py: 0.8,
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        boxShadow: "0 3px 12px rgba(74, 93, 58, 0.3)",
                        "&:hover": { 
                          bgcolor: "#3a4d2a",
                          boxShadow: "0 4px 15px rgba(74, 93, 58, 0.4)",
                        },
                      }}
                    >
                      Visit Store
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {/* Comments Section - Compact and Centered */}
          <Box display="flex" justifyContent="center">
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, background: "#ffffff", boxShadow: "0 8px 25px rgba(74, 93, 58, 0.15)", maxWidth: "800px", width: "100%" }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#4a5d3a", fontSize: "1.2rem" }}>
                  <Comment sx={{ mr: 1, verticalAlign: "middle", fontSize: "1.3rem" }} />
                  Customer Reviews ({comments.length})
                </Typography>
                {user && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setOpenCommentDialog(true)}
                    sx={{ 
                      color: "#4a5d3a", 
                      borderColor: "#4a5d3a",
                      borderRadius: "20px",
                      px: 2,
                      py: 0.5,
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      "&:hover": {
                        backgroundColor: "rgba(74, 93, 58, 0.1)",
                        borderColor: "#4a5d3a",
                      },
                    }}
                  >
                    Write Review
                  </Button>
                )}
              </Box>

              {commentsLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={30} />
                </Box>
              ) : comments.length > 0 ? (
                <List sx={{ py: 0 }}>
                  {comments.slice(0, 5).map((comment, index) => (
                    <React.Fragment key={comment._id || index}>
                      <ListItem alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: "#4a5d3a", width: 32, height: 32 }}>
                            <Person sx={{ fontSize: "1rem" }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: "0.9rem" }}>
                                {comment.user_name || "Anonymous"}
                              </Typography>
                              <Rating
                                value={comment.rating}
                                readOnly
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ mt: 0.5, fontSize: "0.85rem", lineHeight: 1.4 }}
                              >
                                {comment.comment}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: "0.75rem" }}
                              >
                                {new Date(
                                  comment.created_at
                                ).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(comments.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {comments.length > 5 && (
                    <Box textAlign="center" mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Showing 5 of {comments.length} reviews
                      </Typography>
                    </Box>
                  )}
                </List>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  py={2}
                  sx={{ fontSize: "0.9rem" }}
                >
                  No reviews yet. Be the first to review this product!
                </Typography>
              )}
            </Paper>
          </Box>
        </motion.div>
      </Container>

      {/* Add to Cart Dialog */}
      <Dialog open={openAddToCart} onClose={() => setOpenAddToCart(false)}>
        <DialogTitle>Add to Cart</DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="h6" gutterBottom>
              {product?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ₱{product?.price_php?.toFixed(2)} each
            </Typography>
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              inputProps={{ min: 1, max: product?.quantity || 1 }}
              fullWidth
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddToCart(false)}>Cancel</Button>
          <Button 
            onClick={confirmAddToCart} 
            variant="contained"
            sx={{
              bgcolor: "#4a5d3a",
              borderRadius: "25px",
              px: 3,
              py: 1,
              fontWeight: 600,
              "&:hover": { 
                bgcolor: "#3a4d2a",
              },
            }}
          >
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={openCommentDialog}
        onClose={() => setOpenCommentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Your Name"
              value={newComment.user_name}
              onChange={(e) =>
                setNewComment({ ...newComment, user_name: e.target.value })
              }
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email (optional)"
              value={newComment.user_email}
              onChange={(e) =>
                setNewComment({ ...newComment, user_email: e.target.value })
              }
              fullWidth
              sx={{ mb: 2 }}
            />
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Rating:
              </Typography>
              <Rating
                value={newComment.rating}
                onChange={(e, newValue) =>
                  setNewComment({ ...newComment, rating: newValue })
                }
              />
            </Box>
            <TextField
              label="Your Review"
              value={newComment.comment}
              onChange={(e) =>
                setNewComment({ ...newComment, comment: e.target.value })
              }
              multiline
              rows={4}
              fullWidth
              placeholder="Share your thoughts about this product..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCommentDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitComment}
            variant="contained"
            disabled={
              !newComment.comment.trim() || !newComment.user_name.trim()
            }
            startIcon={<Send />}
            sx={{
              bgcolor: "#4a5d3a",
              borderRadius: "25px",
              px: 3,
              py: 1,
              fontWeight: 600,
              "&:hover": { 
                bgcolor: "#3a4d2a",
              },
            }}
          >
            Submit Review
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

export default ProductDetail;
