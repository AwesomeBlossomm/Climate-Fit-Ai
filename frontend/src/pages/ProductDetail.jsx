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
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              ClimateFit Fashion Store
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => navigate("/products")}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Product Not Found
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h5" align="center">
            Product not found
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/products")}
            sx={{ mt: 2, display: "block", mx: "auto" }}
          >
            Back to Products
          </Button>
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
            ClimateFit Fashion Store
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => navigate("/cart")}>
            <Badge badgeContent={getCartItemsCount()} color="error">
              <ShoppingCart />
            </Badge>
          </Button>
          {user && (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Grid container spacing={4}>
            {/* Product Image */}
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardMedia
                  component="img"
                  height="500"
                  image={
                    product.image_path ||
                    "https://via.placeholder.com/400x500?text=Fashion+Item"
                  }
                  alt={product.name}
                  sx={{ objectFit: "cover" }}
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

            {/* Product Details */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={2}
                sx={{ p: 3, borderRadius: 3, height: "fit-content" }}
              >
                <Box mb={2}>
                  <Chip
                    label={product.category || "Fashion"}
                    size="small"
                    sx={{ bgcolor: "#e8f5e8", mb: 1 }}
                  />
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {product.description}
                  </Typography>
                </Box>

                {/* Rating */}
                {product.average_rating > 0 && (
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Rating
                      value={product.average_rating}
                      readOnly
                      precision={0.1}
                    />
                    <Typography variant="body2">
                      ({product.average_rating.toFixed(1)} -{" "}
                      {product.total_comments} reviews)
                    </Typography>
                  </Box>
                )}

                {/* Price */}
                <Typography
                  variant="h3"
                  color="primary"
                  fontWeight="bold"
                  mb={2}
                >
                  ₱{product.price_php?.toFixed(2) || "0.00"}
                </Typography>

                {/* Product Details */}
                <Grid container spacing={2} mb={3}>
                  {product.color && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Color: <strong>{product.color}</strong>
                      </Typography>
                    </Grid>
                  )}
                  {product.material && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Material: <strong>{product.material}</strong>
                      </Typography>
                    </Grid>
                  )}
                  {product.season && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Season: <strong>{product.season}</strong>
                      </Typography>
                    </Grid>
                  )}
                  {product.gender && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Gender: <strong>{product.gender}</strong>
                      </Typography>
                    </Grid>
                  )}
                  {product.style && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Style: <strong>{product.style}</strong>
                      </Typography>
                    </Grid>
                  )}
                  {product.brand_style && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Brand: <strong>{product.brand_style}</strong>
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Sizes */}
                {product.sizes_available &&
                  product.sizes_available.length > 0 && (
                    <Box mb={3}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Available Sizes:
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {product.sizes_available.map((size, index) => (
                          <Chip
                            key={index}
                            label={size}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                {/* Quantity */}
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Stock: <strong>{product.quantity || 0} available</strong>
                </Typography>

                {/* Add to Cart Button */}
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<Add />}
                  onClick={handleAddToCart}
                  disabled={!product.quantity || product.quantity === 0}
                  sx={{
                    bgcolor: "#2e7d32",
                    "&:hover": { bgcolor: "#1b5e20" },
                    py: 1.5,
                    mb: 2,
                  }}
                >
                  Add to Cart
                </Button>
              </Paper>
            </Grid>
          </Grid>

          {/* Seller Information */}
          {product.seller && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mt: 4 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h5" fontWeight="bold">
                  <Store sx={{ mr: 1, verticalAlign: "middle" }} />
                  Seller Information
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/seller/${product.seller._id}`)}
                  sx={{ color: "#2e7d32", borderColor: "#2e7d32" }}
                >
                  View Store Profile
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    mb={2}
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
                        bgcolor: "#2e7d32",
                        width: 56,
                        height: 56,
                        fontSize: "1.5rem",
                      }}
                    >
                      {product.seller.store_name?.charAt(0) || "S"}
                    </Avatar>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {product.seller.store_name}
                        </Typography>
                        {product.seller.is_verified && (
                          <Verified sx={{ color: "#4caf50", fontSize: 20 }} />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Owner: {product.seller.owner_full_name}
                      </Typography>
                      {product.seller.established_date && (
                        <Typography variant="caption" color="text.secondary">
                          Est.{" "}
                          {new Date(
                            product.seller.established_date
                          ).getFullYear()}
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
                      <Typography variant="body2">
                        {product.seller.rating.toFixed(1)}/5.0
                      </Typography>
                    </Box>
                  )}

                  {product.seller.specializes_in &&
                    product.seller.specializes_in.length > 0 && (
                      <Box mt={2}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Specializes in:
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {product.seller.specializes_in.map(
                            (specialty, index) => (
                              <Chip
                                key={index}
                                label={specialty}
                                size="small"
                                variant="outlined"
                              />
                            )
                          )}
                        </Box>
                      </Box>
                    )}
                </Grid>

                <Grid item xs={12} md={6}>
                  {product.seller.contact_number && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Phone fontSize="small" />
                      <Typography variant="body2">
                        {product.seller.contact_number}
                      </Typography>
                    </Box>
                  )}

                  {product.seller.email && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Email fontSize="small" />
                      <Typography variant="body2">
                        {product.seller.email}
                      </Typography>
                    </Box>
                  )}

                  {product.seller.address && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationOn fontSize="small" />
                      <Typography variant="body2">
                        {product.seller.address}
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/seller/${product.seller._id}`)}
                    sx={{
                      mt: 2,
                      bgcolor: "#2e7d32",
                      "&:hover": { bgcolor: "#1b5e20" },
                    }}
                  >
                    Visit Store
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Comments Section */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mt: 4 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h5" fontWeight="bold">
                <Comment sx={{ mr: 1, verticalAlign: "middle" }} />
                Customer Reviews ({comments.length})
              </Typography>
              {user && (
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setOpenCommentDialog(true)}
                  sx={{ color: "#2e7d32", borderColor: "#2e7d32" }}
                >
                  Write Review
                </Button>
              )}
            </Box>

            {commentsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : comments.length > 0 ? (
              <List>
                {comments.map((comment, index) => (
                  <React.Fragment key={comment._id || index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "#2e7d32" }}>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" fontWeight="bold">
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
                              paragraph
                              sx={{ mt: 1 }}
                            >
                              {comment.comment}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(
                                comment.created_at
                              ).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < comments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                py={4}
              >
                No reviews yet. Be the first to review this product!
              </Typography>
            )}
          </Paper>
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
          <Button onClick={confirmAddToCart} variant="contained">
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
