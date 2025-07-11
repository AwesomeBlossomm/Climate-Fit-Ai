import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Fab,
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
  InputAdornment,
  IconButton,
  Skeleton,
  Rating,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ShoppingCart,
  Add,
  LocalOffer,
  Star,
  Favorite,
  FavoriteBorder,
  Search,
  Clear,
  FilterList,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { clothingAPI } from "../services/api";

const Products = () => {
  const { user, logout } = useAuth();
  const { addToCart, getCartItemsCount } = useCart();
  const navigate = useNavigate();

  // State for clothing products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Other state
  const [favorites, setFavorites] = useState([]);
  const [openAddToCart, setOpenAddToCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Infinite scroll ref
  const observer = useRef();
  const searchTimeoutRef = useRef();

  const limit = 10;

  // Available categories
  const categories = [
    "shirts",
    "pants",
    "dresses",
    "jackets",
    "shoes",
    "accessories",
    "tops",
    "bottoms",
    "outerwear",
    "activewear",
  ];

  // Mock discount data
  const mockDiscounts = [
    {
      id: 1,
      title: "Fashion Sale 2025",
      description: "Up to 50% off on all clothing items",
      discount: 50,
      code: "FASHION50",
      validUntil: "2025-08-31",
    },
    {
      id: 2,
      title: "Style Warriors Special",
      description: "Buy 2 Get 1 Free on selected fashion items",
      discount: 33,
      code: "STYLE33",
      validUntil: "2025-07-31",
    },
  ];

  // Fetch clothing products
  const fetchClothingProducts = async (
    query,
    category,
    currentOffset = 0,
    isNewSearch = false
  ) => {
    if (loading) return;

    setLoading(true);

    try {
      let response;

      // If category is selected, use category search
      if (category) {
        if (user) {
          response = await clothingAPI.searchClothesByCategory(
            category,
            limit,
            currentOffset
          );
        } else {
          // For public users, we'll use the regular search and filter by category on frontend
          response = await clothingAPI.searchClothesPublic(
            "",
            limit * 3, // Get more items to filter
            0
          );
        }
      } else {
        // If search query exists, search by query, otherwise get all products
        const searchTerm = query.trim();

        if (user) {
          response = await clothingAPI.searchClothes(
            searchTerm,
            limit,
            currentOffset
          );
        } else {
          response = await clothingAPI.searchClothesPublic(
            searchTerm,
            limit,
            currentOffset
          );
        }
      }

      let newProducts = response.data?.products || [];
      let total = response.data?.total_count || 0;

      // If using category filter for public users, filter the results
      if (category && !user) {
        newProducts = newProducts.filter(
          (product) =>
            product.category?.toLowerCase().includes(category.toLowerCase()) ||
            product.name?.toLowerCase().includes(category.toLowerCase())
        );
        total = newProducts.length;
      }

      if (isNewSearch) {
        setProducts(newProducts);
        setOffset(limit);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
        setOffset((prev) => prev + limit);
      }

      setTotalCount(total);
      setHasMore(newProducts.length === limit && currentOffset + limit < total);
    } catch (error) {
      console.error("Error fetching clothing products:", error);
      setSnackbar({
        open: true,
        message: `Failed to ${
          query || category ? "search for" : "load"
        } products. Please try again.`,
        severity: "error",
      });

      // Reset products on error during new search
      if (isNewSearch) {
        setProducts([]);
        setTotalCount(0);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load - get all products
  useEffect(() => {
    fetchClothingProducts("", "", 0, true);
  }, [user]);

  const handleSearch = () => {
    const trimmedQuery = tempSearchQuery.trim();

    // If search is empty, get all products
    if (!trimmedQuery && !selectedCategory) {
      setSearchQuery("");
      setSelectedCategory("");
      fetchClothingProducts("", "", 0, true);
    } else {
      // Search with query or category
      setSearchQuery(trimmedQuery);
      fetchClothingProducts(trimmedQuery, selectedCategory, 0, true);
    }
    setOffset(0);
  };

  const handleClearSearch = () => {
    setTempSearchQuery("");
    setSearchQuery("");
    setSelectedCategory("");
    setOffset(0);
    // Get all products
    fetchClothingProducts("", "", 0, true);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Infinite scroll callback
  const lastProductElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchClothingProducts(searchQuery, selectedCategory, offset, false);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, searchQuery, selectedCategory, offset]
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleAddToCart = (product) => {
    // Convert product format to match cart expectations
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price?.original || product.price?.discounted || 0,
      originalPrice: product.price?.original || 0,
      image:
        product.images?.[0] ||
        "https://via.placeholder.com/300x400?text=Fashion+Item",
      brand: product.brand,
      category: "Clothing",
      description: product.details?.description || "",
      rating: product.details?.rating || 0,
    };

    setSelectedProduct(cartProduct);
    setOpenAddToCart(true);
  };

  const confirmAddToCart = () => {
    addToCart(selectedProduct, quantity);

    setSnackbar({
      open: true,
      message: `${selectedProduct.name} added to cart!`,
      severity: "success",
    });

    setOpenAddToCart(false);
    setQuantity(1);
  };

  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter((id) => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  const getTotalCartItems = () => {
    return getCartItemsCount();
  };

  // Loading skeleton component
  const ProductSkeleton = () => (
    <Card sx={{ height: "100%", borderRadius: 3 }}>
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Skeleton variant="text" height={24} width="60%" />
        <Skeleton variant="text" height={20} width="80%" />
        <Skeleton variant="text" height={20} width="40%" />
        <Skeleton variant="text" height={32} width="50%" />
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ClimateFit Fashion Store
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => navigate("/cart")}>
            <Badge badgeContent={getTotalCartItems()} color="error">
              <ShoppingCart />
            </Badge>
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Search Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#2e7d32" }}
          >
            🔍 Search Fashion Items
          </Typography>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <TextField
              fullWidth
              value={tempSearchQuery}
              onChange={(e) => setTempSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by product name, brand, or description..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: tempSearchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} size="small">
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ borderRadius: 2 }}
              disabled={loading}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                label="Category"
                disabled={loading}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{
                bgcolor: "#2e7d32",
                "&:hover": { bgcolor: "#1b5e20" },
                px: 3,
                py: 1.5,
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Search"
              )}
            </Button>
          </Box>

          {/* Search Results Info */}
          {totalCount > 0 && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Found {totalCount} result{totalCount !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedCategory && ` in category "${selectedCategory}"`}
              {!searchQuery && !selectedCategory && " (showing all products)"}
            </Typography>
          )}
          {(searchQuery || selectedCategory) &&
            totalCount === 0 &&
            !loading && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No products found
                {searchQuery && ` matching "${searchQuery}"`}
                {selectedCategory && ` in category "${selectedCategory}"`}. Try
                different keywords or categories.
              </Typography>
            )}
        </Paper>

        {/* Discount Banners */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#2e7d32" }}
        >
          🔥 Special Discounts
        </Typography>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {mockDiscounts.map((discount) => (
            <Grid item xs={12} md={6} key={discount.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Paper
                  elevation={4}
                  sx={{
                    p: 3,
                    background:
                      "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
                    color: "white",
                    borderRadius: 3,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <LocalOffer sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {discount.title}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {discount.description}
                      </Typography>
                      <Chip
                        label={`Code: ${discount.code}`}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                        }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Products Grid */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#2e7d32" }}
        >
          👗 Fashion Collection
        </Typography>

        <Box display="flex" justifyContent="center" width="100%">
          <Grid
            container
            spacing={3}
            sx={{
              maxWidth: "1400px",
              justifyContent: "center",
              mx: "auto",
            }}
          >
            {products.map((product, index) => {
              const isLast = products.length === index + 1;
              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={2.4}
                  xl={2.4}
                  key={`${product.id}-${index}`}
                  ref={isLast ? lastProductElementRef : null}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    minWidth: "280px",
                    maxWidth: "280px",
                  }}
                >
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Card
                      elevation={3}
                      sx={{
                        width: 260,
                        height: 500,
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 3,
                        overflow: "hidden",
                        mx: "auto",
                      }}
                    >
                      <Box position="relative">
                        <CardMedia
                          component="img"
                          height="180"
                          image={
                            product.images?.[0] ||
                            "https://via.placeholder.com/300x400?text=Fashion+Item"
                          }
                          alt={product.name}
                          sx={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/300x400?text=Fashion+Item";
                          }}
                        />
                        {product.price?.original &&
                          product.price?.discounted &&
                          product.price.original > product.price.discounted && (
                            <Chip
                              label={`-${Math.round(
                                ((product.price.original -
                                  product.price.discounted) /
                                  product.price.original) *
                                  100
                              )}%`}
                              color="error"
                              size="small"
                              sx={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                fontWeight: "bold",
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
                        <Button
                          onClick={() => toggleFavorite(product.id)}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: "rgba(255,255,255,0.8)",
                            minWidth: "auto",
                            p: 0.5,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {favorites.includes(product.id) ? (
                            <Favorite color="error" fontSize="small" />
                          ) : (
                            <FavoriteBorder fontSize="small" />
                          )}
                        </Button>
                      </Box>

                      <CardContent
                        sx={{
                          flexGrow: 1,
                          p: 2,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Chip
                          label={product.brand || "Fashion"}
                          size="small"
                          sx={{
                            mb: 1,
                            bgcolor: "#e8f5e8",
                            fontSize: "0.7rem",
                            height: 20,
                            alignSelf: "flex-start",
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          component="h2"
                          gutterBottom
                          sx={{
                            fontWeight: "bold",
                            minHeight: 40,
                            display: "-webkit-box",
                            overflow: "hidden",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            lineHeight: 1.2,
                            fontSize: "0.9rem",
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            minHeight: 40,
                            display: "-webkit-box",
                            overflow: "hidden",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            fontSize: "0.8rem",
                          }}
                        >
                          {product.details?.description?.substring(0, 80)}
                          {product.details?.description?.length > 80
                            ? "..."
                            : ""}
                        </Typography>

                        {product.details?.rating > 0 && (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={1}
                          >
                            <Rating
                              value={product.details.rating}
                              readOnly
                              size="small"
                              sx={{ fontSize: "1rem" }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              ({product.details.rating})
                            </Typography>
                          </Box>
                        )}

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography
                            variant="h6"
                            color="primary"
                            fontWeight="bold"
                            sx={{ fontSize: "1.1rem" }}
                          >
                            $
                            {(
                              product.price?.discounted ||
                              product.price?.original ||
                              0
                            ).toFixed(2)}
                          </Typography>
                          {product.price?.original &&
                            product.price?.discounted &&
                            product.price.original >
                              product.price.discounted && (
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: "line-through",
                                  color: "text.secondary",
                                  fontSize: "0.8rem",
                                }}
                              >
                                ${product.price.original.toFixed(2)}
                              </Typography>
                            )}
                        </Box>

                        {product.sizes && product.sizes.length > 0 && (
                          <Box mt="auto">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              Sizes: {product.sizes.slice(0, 2).join(", ")}
                              {product.sizes.length > 2 ? "..." : ""}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>

                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<Add fontSize="small" />}
                          onClick={() => handleAddToCart(product)}
                          size="small"
                          sx={{
                            bgcolor: "#2e7d32",
                            "&:hover": { bgcolor: "#1b5e20" },
                            fontSize: "0.8rem",
                            py: 1,
                          }}
                        >
                          Add to Cart
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}

            {/* Loading skeletons */}
            {loading &&
              Array.from({ length: 10 }).map((_, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={2.4}
                  xl={2.4}
                  key={`skeleton-${index}`}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    minWidth: "280px",
                    maxWidth: "280px",
                  }}
                >
                  <Card sx={{ width: 260, height: 450, borderRadius: 3 }}>
                    <Skeleton variant="rectangular" height={180} />
                    <CardContent sx={{ p: 2 }}>
                      <Skeleton
                        variant="text"
                        height={20}
                        width="40%"
                        sx={{ mb: 1 }}
                      />
                      <Skeleton variant="text" height={24} width="90%" />
                      <Skeleton variant="text" height={20} width="80%" />
                      <Skeleton variant="text" height={20} width="60%" />
                      <Skeleton
                        variant="text"
                        height={32}
                        width="50%"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>

        {/* Load more indicator */}
        {loading && products.length > 0 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        )}

        {/* No more products message */}
        {!hasMore && products.length > 0 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Typography variant="body1" color="text.secondary">
              No more products to load
            </Typography>
          </Box>
        )}

        {/* No products found */}
        {!loading && products.length === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchQuery || selectedCategory
                ? "No products found"
                : "No products available"}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {searchQuery || selectedCategory
                ? "Try searching with different keywords or select a different category"
                : "Check back later for new arrivals"}
            </Typography>
            {(searchQuery || selectedCategory) && (
              <Button
                variant="outlined"
                onClick={handleClearSearch}
                sx={{ mt: 2 }}
              >
                Show All Products
              </Button>
            )}
          </Box>
        )}
      </Container>

      {/* Floating Cart Button */}
      <Fab
        color="primary"
        aria-label="cart"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          bgcolor: "#2e7d32",
          "&:hover": { bgcolor: "#1b5e20" },
        }}
        onClick={() => navigate("/cart")}
      >
        <Badge badgeContent={getTotalCartItems()} color="error">
          <ShoppingCart />
        </Badge>
      </Fab>

      {/* Add to Cart Dialog */}
      <Dialog open={openAddToCart} onClose={() => setOpenAddToCart(false)}>
        <DialogTitle>Add to Cart</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedProduct.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ${selectedProduct.price} each
              </Typography>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                inputProps={{ min: 1 }}
                fullWidth
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddToCart(false)}>Cancel</Button>
          <Button onClick={confirmAddToCart} variant="contained">
            Add to Cart
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

export default Products;
