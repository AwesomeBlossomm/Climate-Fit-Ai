import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  AppBar,
  Toolbar,
  Container,
  Chip,
  Badge,
  Paper,
  Avatar,
  Rating,
  Divider,
  CircularProgress,
  IconButton,
  Skeleton,
} from "@mui/material";
import {
  ArrowBack,
  Store,
  Star,
  Email,
  Phone,
  LocationOn,
  Verified,
  ShoppingCart,
  Add,
  Favorite,
  FavoriteBorder,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { clothingAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

const SellerProfile = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, getCartItemsCount } = useCart();

  const [seller, setSeller] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (sellerId) {
      fetchSellerProfile();
      fetchSellerProducts();
    }
  }, [sellerId]);

  const fetchSellerProfile = async () => {
    try {
      setLoading(true);
      const response = await clothingAPI.getSellerProfile(sellerId);
      setSeller(response.data);
    } catch (error) {
      console.error("Error fetching seller profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await clothingAPI.getSellerProducts(sellerId);
      setSellerProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching seller products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleProductClick = (product) => {
    navigate(`/products/${product._id}`);
  };

  const handleAddToCart = (product) => {
    const cartProduct = {
      id: product._id || product.id,
      name: product.name,
      price: product.price_php || 0,
      originalPrice: product.price_php || 0,
      image: product.image_path,
      brand: product.brand_style,
      category: product.category || "Clothing",
      description: product.description || "",
      rating: product.average_rating || 0,
    };

    addToCart(cartProduct, 1);
  };

  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter((id) => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => navigate(-1)}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Seller Profile
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Skeleton variant="circular" width={120} height={120} />
              </Grid>
              <Grid item xs={12} md={9}>
                <Skeleton variant="text" height={40} width="60%" />
                <Skeleton variant="text" height={30} width="40%" />
                <Skeleton variant="text" height={20} width="80%" />
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (!seller) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => navigate(-1)}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Seller Not Found
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper
            elevation={2}
            sx={{ p: 4, borderRadius: 3, textAlign: "center" }}
          >
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Seller not found
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate(-1)}
              sx={{ mt: 2 }}
            >
              Go Back
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {seller.store_name}
          </Typography>
          <Button color="inherit" onClick={() => navigate("/cart")}>
            <Badge badgeContent={getCartItemsCount()} color="error">
              <ShoppingCart />
            </Badge>
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Seller Profile Header */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3} textAlign="center">
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: "#2e7d32",
                    fontSize: "3rem",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  {seller.store_name?.charAt(0) || "S"}
                </Avatar>
                {seller.is_verified && (
                  <Chip
                    icon={<Verified />}
                    label="Verified Seller"
                    color="success"
                    sx={{ fontWeight: "bold" }}
                  />
                )}
              </Grid>

              <Grid item xs={12} md={9}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Typography variant="h3" fontWeight="bold">
                    {seller.store_name}
                  </Typography>
                  {seller.is_verified && (
                    <Verified sx={{ color: "#4caf50", fontSize: 32 }} />
                  )}
                </Box>

                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Owner: {seller.owner_full_name}
                </Typography>

                {seller.rating && (
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Rating value={seller.rating} readOnly />
                    <Typography variant="body1">
                      {seller.rating.toFixed(1)} / 5.0
                    </Typography>
                  </Box>
                )}

                {seller.established_date && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    gutterBottom
                  >
                    Established:{" "}
                    {new Date(seller.established_date).getFullYear()}
                  </Typography>
                )}

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {seller.contact_number && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone fontSize="small" />
                        <Typography variant="body2">
                          {seller.contact_number}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {seller.email && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Email fontSize="small" />
                        <Typography variant="body2">{seller.email}</Typography>
                      </Box>
                    </Grid>
                  )}

                  {seller.address && (
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn fontSize="small" />
                        <Typography variant="body2">
                          {seller.address}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {seller.specializes_in && seller.specializes_in.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      Specializes in:
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {seller.specializes_in.map((specialty, index) => (
                        <Chip
                          key={index}
                          label={specialty}
                          variant="outlined"
                          sx={{ color: "#2e7d32", borderColor: "#2e7d32" }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Seller Products */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{ color: "#2e7d32" }}
            >
              <Store sx={{ mr: 1, verticalAlign: "middle" }} />
              Products ({sellerProducts.length})
            </Typography>

            {productsLoading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Card sx={{ height: "100%", borderRadius: 3 }}>
                      <Skeleton variant="rectangular" height={200} />
                      <CardContent>
                        <Skeleton variant="text" height={24} width="80%" />
                        <Skeleton variant="text" height={20} width="60%" />
                        <Skeleton variant="text" height={32} width="40%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : sellerProducts.length > 0 ? (
              <Grid container spacing={3}>
                {sellerProducts.map((product, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                    <motion.div
                      whileHover={{ y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        elevation={3}
                        sx={{
                          height: 420,
                          display: "flex",
                          flexDirection: "column",
                          borderRadius: 3,
                          overflow: "hidden",
                          cursor: "pointer",
                        }}
                        onClick={() => handleProductClick(product)}
                      >
                        <Box position="relative">
                          <CardMedia
                            component="img"
                            height="180"
                            image={
                              product.image_path ||
                              "https://via.placeholder.com/300x400?text=Fashion+Item"
                            }
                            alt={product.name}
                            sx={{ objectFit: "cover" }}
                          />
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(product._id);
                            }}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "rgba(255,255,255,0.8)",
                            }}
                          >
                            {favorites.includes(product._id) ? (
                              <Favorite color="error" />
                            ) : (
                              <FavoriteBorder />
                            )}
                          </IconButton>
                        </Box>

                        <CardContent sx={{ flexGrow: 1, p: 2 }}>
                          <Typography
                            variant="h6"
                            component="h2"
                            gutterBottom
                            sx={{
                              fontWeight: "bold",
                              display: "-webkit-box",
                              overflow: "hidden",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              minHeight: 48,
                            }}
                          >
                            {product.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              display: "-webkit-box",
                              overflow: "hidden",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              minHeight: 40,
                            }}
                          >
                            {product.description}
                          </Typography>

                          {product.average_rating > 0 && (
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={1}
                            >
                              <Rating
                                value={product.average_rating}
                                readOnly
                                size="small"
                              />
                              <Typography variant="caption">
                                ({product.average_rating.toFixed(1)})
                              </Typography>
                            </Box>
                          )}

                          <Typography
                            variant="h6"
                            color="primary"
                            fontWeight="bold"
                          >
                            ₱{(product.price_php || 0).toFixed(2)}
                          </Typography>
                        </CardContent>

                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<Add />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            sx={{
                              bgcolor: "#2e7d32",
                              "&:hover": { bgcolor: "#1b5e20" },
                            }}
                          >
                            Add to Cart
                          </Button>
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This seller hasn't listed any products yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SellerProfile;
