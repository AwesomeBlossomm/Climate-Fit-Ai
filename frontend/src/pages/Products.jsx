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
  Avatar,
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
  TuneOutlined,
  WbSunny,
  AcUnit,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { clothingAPI } from "../services/api";
import { discountAPI } from "../services/discountApi";
import WeatherMapSection from "../components/WeatherMapSection";

const Products = () => {
  const { user, logout } = useAuth();
  const { addToCart, getCartItemsCount } = useCart();
  const navigate = useNavigate();

  // State for infinite scroll
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    priceMin: "",
    priceMax: "",
    category: "",
    weather: "", // 'true', 'false', or ''
    rating: "", // minimum rating
  });
  const [showFilters, setShowFilters] = useState(false);

  const [pagination, setPagination] = useState({
    page: 0,
    hasMore: true,
    totalCount: 0,
    loadedCount: 0,
  });

  // Refs for infinite scroll
  const observer = useRef();
  const lastProductElementRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !loading) {
          loadMoreProducts();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, pagination.hasMore, loading]
  );

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

  // Reset products and pagination when search or filters change
  const resetProducts = useCallback(() => {
    setProducts([]);
    setPagination({
      page: 0,
      hasMore: true,
      totalCount: 0,
      loadedCount: 0,
    });
  }, []);

  // Load initial products with filters - enhanced to get all products
  const loadProducts = useCallback(
    async (resetData = false) => {
      if (loading) return;

      setLoading(true);

      if (resetData) {
        resetProducts();
      }

      try {
        // Try to get all products at once first
        let response;
        try {
          response = await clothingAPI.getAllProductsAtOnce(
            searchQuery,
            filters
          );
          console.log(`Loaded ALL ${response.data.length} products at once`);
        } catch (error) {
          console.log("Falling back to paginated loading...");
          // Fallback to paginated loading if getting all fails
          const currentPage = resetData ? 0 : pagination.page;
          response = await clothingAPI.getProductsInfiniteScroll(
            currentPage,
            20, // Increased page size
            searchQuery,
            filters
          );
        }

        const newProducts = response.data || [];
        const paginationData = response.pagination || {};

        if (resetData) {
          setProducts(newProducts);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }

        setPagination({
          page: paginationData.page !== undefined ? paginationData.page + 1 : 1,
          hasMore:
            paginationData.has_more !== undefined
              ? paginationData.has_more
              : false,
          totalCount: paginationData.total_count || newProducts.length,
          loadedCount: paginationData.loaded_count || newProducts.length,
        });

        console.log(
          `Total products available: ${
            paginationData.total_count || newProducts.length
          }`
        );
      } catch (error) {
        console.error("Error loading products:", error);
        setSnackbar({
          open: true,
          message: "Failed to load products. Please try again.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, pagination.page, searchQuery, filters, resetProducts]
  );

  // Load more products for infinite scroll with filters - enhanced
  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !pagination.hasMore || loading) return;

    setLoadingMore(true);

    try {
      const response = await clothingAPI.getProductsInfiniteScroll(
        pagination.page,
        50, // Increased page size
        searchQuery,
        filters
      );

      const newProducts = response.data || [];
      const paginationData = response.pagination || {};

      setProducts((prev) => [...prev, ...newProducts]);
      setPagination({
        page: paginationData.page + 1,
        hasMore: paginationData.has_more || false,
        totalCount: paginationData.total_count || 0,
        loadedCount: paginationData.loaded_count || 0,
      });

      console.log(
        `Loaded ${newProducts.length} more products. Total loaded: ${paginationData.loaded_count}/${paginationData.total_count}`
      );
    } catch (error) {
      console.error("Error loading more products:", error);
      setSnackbar({
        open: true,
        message: "Failed to load more products.",
        severity: "error",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, pagination, searchQuery, filters, loading]);

  // Initial load
  useEffect(() => {
    loadProducts(true);
  }, []);

  // Handle search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== tempSearchQuery) {
        setSearchQuery(tempSearchQuery);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [tempSearchQuery, searchQuery]);

  // Reset and reload when search query or filters change
  useEffect(() => {
    if (searchQuery !== undefined) {
      loadProducts(true);
    }
  }, [searchQuery, filters]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await clothingAPI.getCategories();
        setCategories(response.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = () => {
    setSearchQuery(tempSearchQuery.trim());
  };

  const handleClearSearch = () => {
    setTempSearchQuery("");
    setSearchQuery("");
    setSelectedCategory("");
    // Clear filters as well
    setFilters({
      priceMin: "",
      priceMax: "",
      category: "",
      weather: "",
      rating: "",
    });
  };

  // Filter handling functions
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      priceMin: "",
      priceMax: "",
      category: "",
      weather: "",
      rating: "",
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter((value) => value !== "").length;
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleProductClick = (product) => {
    navigate(`/products/${product._id}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleAddToCart = (product) => {
    // Convert product format to match cart expectations
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

  // Generate promotional banners
  const generatePromotionalBanners = () => {
    return [
      {
        id: 1,
        title: "Summer Sale",
        description: "Up to 50% off on summer collection",
        code: "SUMMER50",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      {
        id: 2,
        title: "New Arrivals",
        description: "20% off on all new fashion items",
        code: "NEW20",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      },
      {
        id: 3,
        title: "Free Shipping",
        description: "Free delivery on orders above ₱1000",
        code: "FREESHIP",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      },
      {
        id: 4,
        title: "Weekend Special",
        description: "Extra 15% off this weekend only",
        code: "WEEKEND15",
        gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      },
    ];
  };

  // Loading skeleton component
  const ProductSkeleton = () => (
    <Card sx={{ height: "100%", borderRadius: 3 }}>
      <Skeleton variant="rectangular" height={paginationData.total_count} />
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
          <Button color="inherit" onClick={() => navigate("/discounts")}>
            Discounts
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
        {/* Weather and Map Section */}
        <WeatherMapSection />

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
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
            <Button
              variant="outlined"
              startIcon={<TuneOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                color: "#2e7d32",
                borderColor: "#2e7d32",
                position: "relative",
              }}
            >
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge
                  badgeContent={getActiveFiltersCount()}
                  color="error"
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                  }}
                />
              )}
            </Button>
          </Box>

          {/* Filters Section */}
          {showFilters && (
            <Paper
              elevation={1}
              sx={{ p: 3, mt: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography
                  variant="h6"
                  sx={{ color: "#2e7d32", fontWeight: "bold" }}
                >
                  <FilterList sx={{ mr: 1, verticalAlign: "middle" }} />
                  Filter Products
                </Typography>
                <Button
                  variant="text"
                  onClick={handleClearFilters}
                  sx={{ color: "#d32f2f" }}
                  disabled={getActiveFiltersCount() === 0}
                >
                  Clear All Filters
                </Button>
              </Box>

              <Grid container spacing={3}>
                {/* Price Range Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    💰 Price Range (₱)
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center">
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin}
                      onChange={(e) =>
                        handleFilterChange("priceMin", e.target.value)
                      }
                      inputProps={{ min: 0 }}
                      sx={{ width: "80px" }}
                    />
                    <Typography variant="body2">to</Typography>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax}
                      onChange={(e) =>
                        handleFilterChange("priceMax", e.target.value)
                      }
                      inputProps={{ min: 0 }}
                      sx={{ width: "80px" }}
                    />
                  </Box>
                </Grid>

                {/* Category Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    👗 Category
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={filters.category}
                      onChange={(e) =>
                        handleFilterChange("category", e.target.value)
                      }
                      displayEmpty
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      <MenuItem value="Tops">Tops</MenuItem>
                      <MenuItem value="Bottoms">Bottoms</MenuItem>
                      <MenuItem value="Dresses">Dresses</MenuItem>
                      <MenuItem value="Outerwear">Outerwear</MenuItem>
                      <MenuItem value="Shoes">Shoes</MenuItem>
                      <MenuItem value="Accessories">Accessories</MenuItem>
                      <MenuItem value="Activewear">Activewear</MenuItem>
                      <MenuItem value="Formal">Formal</MenuItem>
                      <MenuItem value="Casual">Casual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Weather Suitability Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    🌤️ Weather Suitable
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={filters.weather}
                      onChange={(e) =>
                        handleFilterChange("weather", e.target.value)
                      }
                      displayEmpty
                    >
                      <MenuItem value="">All Items</MenuItem>
                      <MenuItem value="true">
                        <Box display="flex" alignItems="center" gap={1}>
                          <WbSunny
                            sx={{ color: "#ff9800", fontSize: "small" }}
                          />
                          Weather Suitable
                        </Box>
                      </MenuItem>
                      <MenuItem value="false">
                        <Box display="flex" alignItems="center" gap={1}>
                          <AcUnit
                            sx={{ color: "#2196f3", fontSize: "small" }}
                          />
                          Not Weather Specific
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Rating Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    ⭐ Minimum Rating
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={filters.rating}
                      onChange={(e) =>
                        handleFilterChange("rating", e.target.value)
                      }
                      displayEmpty
                    >
                      <MenuItem value="">Any Rating</MenuItem>
                      <MenuItem value="4">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating value={4} size="small" readOnly />& up
                        </Box>
                      </MenuItem>
                      <MenuItem value="3">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating value={3} size="small" readOnly />& up
                        </Box>
                      </MenuItem>
                      <MenuItem value="2">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating value={2} size="small" readOnly />& up
                        </Box>
                      </MenuItem>
                      <MenuItem value="1">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating value={1} size="small" readOnly />& up
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Active Filters Display */}
              {getActiveFiltersCount() > 0 && (
                <Box mt={2}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Active Filters:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {filters.priceMin && (
                      <Chip
                        label={`Min: ₱${filters.priceMin}`}
                        size="small"
                        onDelete={() => handleFilterChange("priceMin", "")}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filters.priceMax && (
                      <Chip
                        label={`Max: ₱${filters.priceMax}`}
                        size="small"
                        onDelete={() => handleFilterChange("priceMax", "")}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filters.category && (
                      <Chip
                        label={`Category: ${filters.category}`}
                        size="small"
                        onDelete={() => handleFilterChange("category", "")}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filters.weather && (
                      <Chip
                        label={`Weather: ${
                          filters.weather === "true"
                            ? "Suitable"
                            : "Not Specific"
                        }`}
                        size="small"
                        onDelete={() => handleFilterChange("weather", "")}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filters.rating && (
                      <Chip
                        label={`Rating: ${filters.rating}+ stars`}
                        size="small"
                        onDelete={() => handleFilterChange("rating", "")}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {loading ? (
                "Loading products..."
              ) : (
                <>
                  Showing {pagination.loadedCount} of {pagination.totalCount}{" "}
                  products
                  {searchQuery && ` matching "${searchQuery}"`}
                  {getActiveFiltersCount() > 0 &&
                    ` with ${getActiveFiltersCount()} filter${
                      getActiveFiltersCount() > 1 ? "s" : ""
                    } applied`}
                  {pagination.hasMore &&
                    pagination.totalCount > pagination.loadedCount &&
                    " (scroll down for more)"}
                  {!pagination.hasMore &&
                    pagination.totalCount > 0 &&
                    " (all products loaded)"}
                </>
              )}
            </Typography>
          </Box>
        </Paper>

        {/* Discount Banners */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#2e7d32" }}
          >
            🔥 Special Offers
          </Typography>
          <Button
            variant="outlined"
            startIcon={<LocalOffer />}
            onClick={() => navigate("/discounts")}
            sx={{ color: "#2e7d32", borderColor: "#2e7d32" }}
          >
            View All Discounts
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {generatePromotionalBanners().map((banner) => (
            <Grid item xs={12} md={6} key={banner.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Paper
                  elevation={4}
                  sx={{
                    p: 3,
                    background: banner.gradient,
                    color: "white",
                    borderRadius: 3,
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/discounts")}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <LocalOffer sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {banner.title}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {banner.description}
                      </Typography>
                      <Chip
                        label={`Code: ${banner.code}`}
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

        {/* Products Grid with Infinite Scroll */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#2e7d32" }}
        >
          👗 Fashion Collection ({pagination.totalCount} items)
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
            {products.map((product, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={2.4}
                xl={2.4}
                key={`${product._id}-${index}`}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  minWidth: "280px",
                  maxWidth: "280px",
                }}
                ref={
                  index === products.length - 1 ? lastProductElementRef : null
                }
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
                          product.images?.[0] ||
                          "https://via.placeholder.com/300x400?text=Fashion+Item"
                        }
                        alt={product.name}
                        sx={{ objectFit: "cover" }}
                        onError={(e) => {
                          console.log(`Image failed to load: ${e.target.src}`);
                          // Try alternative image sources with better fallback
                          if (
                            product.images &&
                            product.images.length > 1 &&
                            !e.target.src.includes("placeholder")
                          ) {
                            e.target.src = product.images[1];
                          } else if (
                            product.image_path &&
                            !e.target.src.includes("placeholder") &&
                            !e.target.src.includes("api/v1/image")
                          ) {
                            // Try the comprehensive image endpoint
                            const filename = product.image_path
                              .split(/[\\/]/)
                              .pop();
                            e.target.src = `http://localhost:8000/api/v1/image/${filename}`;
                          } else if (!e.target.src.includes("placeholder")) {
                            e.target.src =
                              "https://via.placeholder.com/300x400?text=Fashion+Item";
                          }
                        }}
                        onLoad={() => {
                          console.log(
                            `Image loaded successfully: ${product.image_path}`
                          );
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
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product._id || product.id);
                        }}
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
                        {favorites.includes(product._id || product.id) ? (
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
                        label={
                          product.brand_style || product.brand || "Fashion"
                        }
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
                        {product.description?.substring(0, 80)}
                        {product.description?.length > 80 ? "..." : ""}
                      </Typography>

                      {/* Show seller info */}
                      {product.seller && (
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={1}
                          mb={1}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/seller/${product.seller._id}`);
                          }}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                            borderRadius: 1,
                            p: 0.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 20,
                              height: 20,
                              bgcolor: "#2e7d32",
                              fontSize: "0.6rem",
                            }}
                          >
                            {product.seller.store_name?.charAt(0) || "S"}
                          </Avatar>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.7rem" }}
                          >
                            {product.seller.store_name}
                          </Typography>
                          {product.seller.is_verified && (
                            <Chip
                              label="✓"
                              size="small"
                              sx={{
                                height: 14,
                                fontSize: "0.6rem",
                                bgcolor: "#4caf50",
                                color: "white",
                                "& .MuiChip-label": { px: 0.5 },
                              }}
                            />
                          )}
                        </Box>
                      )}

                      {(product.average_rating > 0 ||
                        product.details?.rating > 0) && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Rating
                            value={
                              product.average_rating || product.details?.rating
                            }
                            readOnly
                            size="small"
                            sx={{ fontSize: "1rem" }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontSize: "0.7rem" }}
                          >
                            (
                            {(
                              product.average_rating || product.details?.rating
                            )?.toFixed(1)}{" "}
                            - {product.total_comments || 0})
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
                          ₱
                          {(
                            product.price_php ||
                            product.price?.discounted ||
                            product.price?.original ||
                            0
                          ).toFixed(2)}
                        </Typography>
                        {product.price?.original &&
                          product.price?.discounted &&
                          product.price.original > product.price.discounted && (
                            <Typography
                              variant="caption"
                              sx={{
                                textDecoration: "line-through",
                                color: "text.secondary",
                                fontSize: "0.8rem",
                              }}
                            >
                              ₱{product.price.original.toFixed(2)}
                            </Typography>
                          )}
                      </Box>

                      {(product.sizes_available || product.sizes) &&
                        (product.sizes_available?.length > 0 ||
                          product.sizes?.length > 0) && (
                          <Box mt="auto">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              Sizes:{" "}
                              {(product.sizes_available || product.sizes)
                                .slice(0, 2)
                                .join(", ")}
                              {(product.sizes_available || product.sizes)
                                .length > 2
                                ? "..."
                                : ""}
                            </Typography>
                          </Box>
                        )}
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<Add fontSize="small" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
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
            ))}

            {/* Loading more indicator */}
            {loadingMore && (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                  <Typography
                    variant="body2"
                    sx={{ ml: 2, color: "text.secondary" }}
                  >
                    Loading more products...
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* End of results message */}
        {!pagination.hasMore && products.length > 0 && (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              🎉 You've seen all {pagination.totalCount} products!
              {searchQuery || getActiveFiltersCount() > 0
                ? " Try adjusting your search or filters to see different results."
                : " Check back later for new arrivals."}
            </Typography>
          </Box>
        )}

        {/* No products found */}
        {!loading && products.length === 0 && pagination.totalCount === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No products found
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {searchQuery
                ? "Try searching with different keywords"
                : "Check back later for new arrivals"}
            </Typography>
            {searchQuery && (
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
