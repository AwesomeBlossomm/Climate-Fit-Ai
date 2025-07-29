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
      // Try to get seller info from the public endpoint
      const response = await fetch(
        `http://localhost:8000/api/v1/clothes/seller/${sellerId}`
      );

      if (response.ok) {
        const data = await response.json();
        setSeller(data.data);
      } else {
        // If seller endpoint fails, we'll try to get seller info from the first product
        console.warn(
          "Seller endpoint failed, will try to get info from products"
        );
      }
    } catch (error) {
      console.error("Error fetching seller profile:", error);
      // Don't set error state yet, we'll try to get seller info from products
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerProducts = async () => {
    try {
      setProductsLoading(true);
      // Use the correct endpoint for getting seller products
      const response = await fetch(
        `http://localhost:8000/api/v1/sellers/${sellerId}/products/?limit=100&offset=0`
      );

      if (response.ok) {
        const data = await response.json();
        setSellerProducts(data.data || []);

        // If we don't have seller info yet, try to extract it from the first product
        if (!seller && data.data && data.data.length > 0) {
          const firstProduct = data.data[0];
          if (firstProduct.seller) {
            setSeller(firstProduct.seller);
          } else if (firstProduct.seller_id) {
            // Try to fetch seller info using the seller_id from product
            fetchSellerInfoFromProduct(firstProduct.seller_id);
          }
        }
      } else {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching seller products:", error);
      setSellerProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchSellerInfoFromProduct = async (sellerIdFromProduct) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/clothes/seller/public/${sellerIdFromProduct}`
      );

      if (response.ok) {
        const data = await response.json();
        setSeller(data.data);
      }
    } catch (error) {
      console.error("Error fetching seller info from product:", error);
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
              {seller?.store_name
                ? `${seller.store_name.toUpperCase()} STORE`
                : "SELLER PROFILE"}
            </Typography>
          </Box>
        </Box>

        {/* Header Actions */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            onClick={() => navigate(-1)}
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
            All Products
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
            <Badge
              badgeContent={getCartItemsCount()}
              color="error"
              sx={{ mr: 1 }}
            >
              <ShoppingCart />
            </Badge>
            Cart
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
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Seller Profile Header with Dashboard.jsx styling */}
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
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={2} textAlign="center">
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      fontSize: "2.5rem",
                      mx: "auto",
                      mb: 2,
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {seller.store_name?.charAt(0) || "S"}
                  </Avatar>
                  {seller.is_verified && (
                    <Chip
                      icon={<Verified />}
                      label="Verified"
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        fontWeight: 600,
                        backdropFilter: "blur(10px)",
                      }}
                    />
                  )}
                </Grid>

                <Grid item xs={12} md={7}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        fontSize: "2rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {seller.store_name}
                    </Typography>
                    {seller.is_verified && (
                      <Verified sx={{ color: "#ffffff", fontSize: 32 }} />
                    )}
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255, 255, 255, 0.9)",
                      mb: 2,
                      fontSize: "1rem",
                    }}
                  >
                    Owner: {seller.owner_full_name}
                  </Typography>

                  {seller.rating && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Rating value={seller.rating} readOnly size="small" />
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                      >
                        {seller.rating.toFixed(1)} / 5.0
                      </Typography>
                    </Box>
                  )}

                  {seller.established_date && (
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.8)", mb: 2 }}
                    >
                      Established: {new Date(seller.established_date).getFullYear()}
                    </Typography>
                  )}

                  {seller.specializes_in && seller.specializes_in.length > 0 && (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {seller.specializes_in.map((specialty, index) => (
                        <Chip
                          key={index}
                          label={specialty}
                          size="small"
                          sx={{
                            bgcolor: "rgba(255, 255, 255, 0.2)",
                            color: "#ffffff",
                            backdropFilter: "blur(10px)",
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      p: 3,
                      textAlign: "center",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <Store sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {sellerProducts.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Products Available
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Contact Information */}
              <Box mt={3}>
                <Grid container spacing={2}>
                  {seller.contact_number && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone fontSize="small" />
                        <Typography variant="body2">
                          {seller.contact_number}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {seller.email && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Email fontSize="small" />
                        <Typography variant="body2">{seller.email}</Typography>
                      </Box>
                    </Grid>
                  )}

                  {seller.address && (
                    <Grid item xs={12} md={4}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn fontSize="small" />
                        <Typography variant="body2">
                          {seller.address}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>

            {/* Seller Products with Dashboard.jsx styling */}
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
                  borderRadius: "20px",
                  background: "#ffffff",
                  boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                  border: "1px solid rgba(74, 93, 58, 0.1)",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  gutterBottom
                  sx={{
                    color: "#4a5d3a",
                    fontSize: "1.8rem",
                    mb: 3,
                  }}
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
                              borderRadius: "16px",
                              overflow: "hidden",
                              cursor: "pointer",
                              border: "1px solid rgba(74, 93, 58, 0.1)",
                              "&:hover": {
                                boxShadow: "0 15px 40px rgba(74, 93, 58, 0.2)",
                              },
                              transition: "all 0.3s ease",
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
                                  bgcolor: "rgba(255,255,255,0.9)",
                                  "&:hover": {
                                    bgcolor: "rgba(255,255,255,1)",
                                  },
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
                                  color: "#4a5d3a",
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
                                sx={{
                                  color: "#4a5d3a",
                                  fontWeight: 700,
                                  fontSize: "1.2rem",
                                }}
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
                                  bgcolor: "#8fa876",
                                  borderRadius: "12px",
                                  py: 1,
                                  fontWeight: 600,
                                  "&:hover": {
                                    bgcolor: "#7a956a",
                                    transform: "scale(1.02)",
                                  },
                                  transition: "all 0.2s ease",
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
                  <Box
                    textAlign="center"
                    py={8}
                    sx={{
                      background: "rgba(74, 93, 58, 0.05)",
                      borderRadius: "16px",
                      border: "1px solid rgba(74, 93, 58, 0.1)",
                    }}
                  >
                    <Store sx={{ fontSize: 64, color: "#8fa876", mb: 2 }} />
                    <Typography
                      variant="h6"
                      sx={{ color: "#4a5d3a", fontWeight: 600, mb: 1 }}
                    >
                      No products found
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6b8459" }}>
                      This seller hasn't listed any products yet.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </>
  );
};

export default SellerProfile;
