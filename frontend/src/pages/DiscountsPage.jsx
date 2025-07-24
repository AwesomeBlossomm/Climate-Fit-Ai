import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
  Badge,
  Divider,
} from "@mui/material";
import {
  LocalOffer,
  ContentCopy,
  ShoppingCart,
  LocalShipping,
  CheckCircle,
  Schedule,
  CollectionsBookmark,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { discountAPI } from "../services/discountApi";

const DiscountsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [voucherTypeTab, setVoucherTypeTab] = useState(0); // 0: clothes, 1: shipping
  const [availableVouchers, setAvailableVouchers] = useState({
    clothes_vouchers: [],
    shipping_vouchers: [],
  });
  const [myVouchers, setMyVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collectingAll, setCollectingAll] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchAvailableVouchers();
    fetchMyVouchers();
  }, []);

  const fetchAvailableVouchers = async () => {
    try {
      setLoading(true);
      const response = await discountAPI.getAvailableVouchers();
      setAvailableVouchers({
        clothes_vouchers: response.clothes_vouchers || [],
        shipping_vouchers: response.shipping_vouchers || [],
      });
    } catch (error) {
      console.error("Error fetching available vouchers:", error);
      setSnackbar({
        open: true,
        message: "Failed to load available vouchers.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyVouchers = async () => {
    try {
      const response = await discountAPI.getMyDiscounts();
      const transformedVouchers = response.discounts.map((voucher) => ({
        id: voucher.discount_code,
        code: voucher.discount_code,
        description: voucher.description,
        percentage: voucher.percentage,
        collected_at: voucher.assigned_at,
        is_used: voucher.is_used,
        used_at: voucher.used_at,
        expires_at: voucher.expires_at,
        is_expired: voucher.is_expired,
        voucher_type: voucher.voucher_type || "clothes",
        notes: voucher.notes,
      }));

      setMyVouchers(transformedVouchers);
    } catch (error) {
      console.error("Error fetching my vouchers:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const collectVoucher = async (voucherId) => {
    try {
      await discountAPI.collectVoucher({ voucher_id: voucherId });
      setSnackbar({
        open: true,
        message: "Voucher collected successfully!",
        severity: "success",
      });

      // Refresh both lists
      await fetchAvailableVouchers();
      await fetchMyVouchers();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Failed to collect voucher.",
        severity: "error",
      });
    }
  };

  const collectAllVouchers = async () => {
    try {
      setCollectingAll(true);
      const response = await discountAPI.collectAllVouchers();

      setSnackbar({
        open: true,
        message: `Successfully collected ${response.collected_count} vouchers!`,
        severity: "success",
      });

      // Refresh both lists
      await fetchAvailableVouchers();
      await fetchMyVouchers();
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.detail || "Failed to collect all vouchers.",
        severity: "error",
      });
    } finally {
      setCollectingAll(false);
    }
  };

  const copyVoucherCode = (code) => {
    navigator.clipboard.writeText(code);
    setSnackbar({
      open: true,
      message: `Voucher code "${code}" copied to clipboard!`,
      severity: "success",
    });
  };

  const getVoucherIcon = (type) => {
    return type === "shipping" ? <LocalShipping /> : <LocalOffer />;
  };

  const getVoucherColor = (type) => {
    return type === "shipping" ? "info" : "primary";
  };

  const VoucherCard = ({
    voucher,
    showCollectButton = true,
    isMyVoucher = false,
  }) => (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        elevation={3}
        sx={{
          height: "100%",
          borderRadius: 3,
          opacity:
            isMyVoucher && (voucher.is_used || voucher.is_expired) ? 0.7 : 1,
          borderLeft: `4px solid ${
            voucher.voucher_type === "shipping" ? "#4a5d3a" : "#4a5d3a"
          }`,
          boxShadow: "0 4px 15px rgba(74, 93, 58, 0.1)",
          "&:hover": {
            boxShadow: "0 8px 25px rgba(74, 93, 58, 0.2)",
          },
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              {getVoucherIcon(voucher.voucher_type)}
              <Typography 
                variant="h6" 
                fontWeight="bold"
                sx={{ 
                  color: "#4a5d3a",
                  fontSize: "1.1rem",
                }}
              >
                {voucher.percentage}% OFF
              </Typography>
            </Box>
            <Chip
              label={
                voucher.voucher_type === "shipping" ? "SHIPPING" : "CLOTHES"
              }
              size="small"
              sx={{
                backgroundColor: voucher.voucher_type === "shipping" ? "#4a5d3a" : "#8fa876",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.7rem",
              }}
            />
          </Box>

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {voucher.description}
          </Typography>

          {voucher.detailed_description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {voucher.detailed_description}
            </Typography>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Code:</strong> {voucher.code}
            </Typography>
            {voucher.expires_at && (
              <Typography variant="body2" gutterBottom>
                <strong>Expires:</strong>{" "}
                {new Date(voucher.expires_at).toLocaleDateString()}
              </Typography>
            )}
            {isMyVoucher && voucher.collected_at && (
              <Typography variant="body2" gutterBottom>
                <strong>Collected:</strong>{" "}
                {new Date(voucher.collected_at).toLocaleDateString()}
              </Typography>
            )}
            {isMyVoucher && voucher.is_used && voucher.used_at && (
              <Typography variant="body2" gutterBottom color="success.main">
                <strong>Used:</strong>{" "}
                {new Date(voucher.used_at).toLocaleDateString()}
              </Typography>
            )}
          </Box>

          {/* Status chips for my vouchers */}
          {isMyVoucher && (
            <Box display="flex" gap={1} mb={2}>
              {voucher.is_used && (
                <Chip 
                  label="USED" 
                  size="small" 
                  sx={{
                    backgroundColor: "#4a5d3a",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              )}
              {voucher.is_expired && !voucher.is_used && (
                <Chip 
                  label="EXPIRED" 
                  size="small" 
                  sx={{
                    backgroundColor: "#d32f2f",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              )}
              {!voucher.is_used && !voucher.is_expired && (
                <Chip 
                  label="ACTIVE" 
                  size="small" 
                  sx={{
                    backgroundColor: "#8fa876",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              )}
            </Box>
          )}

          <Box display="flex" gap={1}>
            {showCollectButton ? (
              <Button
                variant="contained"
                fullWidth
                startIcon={<CollectionsBookmark />}
                onClick={() => collectVoucher(voucher._id)}
                sx={{
                  bgcolor: "#4a5d3a",
                  borderRadius: "25px",
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  boxShadow: "0 4px 15px rgba(74, 93, 58, 0.3)",
                  "&:hover": { 
                    bgcolor: "#3a4d2a",
                    boxShadow: "0 6px 20px rgba(74, 93, 58, 0.4)",
                  },
                }}
              >
                Collect Voucher
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={() => copyVoucherCode(voucher.code)}
                  disabled={
                    isMyVoucher && (voucher.is_used || voucher.is_expired)
                  }
                  sx={{ 
                    flex: 1,
                    color: "#4a5d3a",
                    borderColor: "#4a5d3a",
                    borderRadius: "25px",
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: "rgba(74, 93, 58, 0.1)",
                      borderColor: "#4a5d3a",
                    },
                    "&:disabled": {
                      color: "#ccc",
                      borderColor: "#ccc",
                    },
                  }}
                >
                  Copy Code
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  const totalAvailable =
    (availableVouchers.clothes_vouchers?.length || 0) +
    (availableVouchers.shipping_vouchers?.length || 0);
  const activeMyVouchers = myVouchers.filter(
    (v) => !v.is_used && !v.is_expired
  ).length;

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
            <ShoppingCart sx={{ mr: 1 }} />
            Cart
          </Button>
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
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4, pt: 12, mt: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 800, color: "#4a5d3a", fontSize: "2rem", letterSpacing: 1, mb: 1 }}
          >
            🎟️ Voucher Collection
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Collect vouchers and save on your purchases! Get discounts on
            clothes and shipping.
          </Typography>

          <Paper elevation={3} sx={{ borderRadius: 4, background: "#ffffff", boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
              >
                <Tab
                  label={
                    <Badge badgeContent={totalAvailable} color="error">
                      <span>Available Vouchers</span>
                    </Badge>
                  }
                />
                <Tab
                  label={
                    <Badge badgeContent={activeMyVouchers} color="primary">
                      <span>My Vouchers</span>
                    </Badge>
                  }
                />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 3 }}>
                {/* Nested tabs for voucher types */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                  <Tabs
                    value={voucherTypeTab}
                    onChange={(e, v) => setVoucherTypeTab(v)}
                    aria-label="Voucher Type Tabs"
                  >
                    <Tab
                      icon={<LocalOffer color="primary" />}
                      iconPosition="start"
                      label={`Clothes (${
                        availableVouchers.clothes_vouchers?.length || 0
                      })`}
                      id="voucher-type-tab-0"
                      aria-controls="voucher-type-panel-0"
                    />
                    <Tab
                      icon={<LocalShipping color="info" />}
                      iconPosition="start"
                      label={`Shipping (${
                        availableVouchers.shipping_vouchers?.length || 0
                      })`}
                      id="voucher-type-tab-1"
                      aria-controls="voucher-type-panel-1"
                    />
                  </Tabs>
                </Box>

                <Box>
                  {/* Clothes Vouchers Tab */}
                  <div
                    role="tabpanel"
                    hidden={voucherTypeTab !== 0}
                    id="voucher-type-panel-0"
                    aria-labelledby="voucher-type-tab-0"
                  >
                    {voucherTypeTab === 0 && (
                      <>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={3}
                        >
                          <Typography variant="h6" fontWeight="bold">
                            Clothes Vouchers (
                            {availableVouchers.clothes_vouchers?.length || 0})
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<CollectionsBookmark />}
                            onClick={collectAllVouchers}
                            disabled={collectingAll || totalAvailable === 0}
                            sx={{
                              bgcolor: "#4a5d3a",
                              borderRadius: "25px",
                              px: 3,
                              py: 1,
                              fontWeight: 600,
                              boxShadow: "0 4px 15px rgba(74, 93, 58, 0.3)",
                              "&:hover": { 
                                bgcolor: "#3a4d2a",
                                boxShadow: "0 6px 20px rgba(74, 93, 58, 0.4)",
                              },
                            }}
                          >
                            {collectingAll ? (
                              <>
                                <CircularProgress
                                  size={16}
                                  color="inherit"
                                  sx={{ mr: 1 }}
                                />
                                Collecting...
                              </>
                            ) : (
                              "Collect All"
                            )}
                          </Button>
                        </Box>
                        {loading ? (
                          <Box display="flex" justifyContent="center" p={4}>
                            <CircularProgress />
                          </Box>
                        ) : availableVouchers.clothes_vouchers?.length === 0 ? (
                          <Paper
                            elevation={1}
                            sx={{ p: 4, textAlign: "center" }}
                          >
                            <LocalOffer
                              sx={{ fontSize: 60, color: "#bdbdbd", mb: 2 }}
                            />
                            <Typography
                              variant="h6"
                              color="text.secondary"
                              gutterBottom
                            >
                              No clothes vouchers available
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              mb={2}
                            >
                              All clothes vouchers have been collected or
                              expired.
                            </Typography>
                            <Button
                              variant="outlined"
                              onClick={() => navigate("/products")}
                              sx={{ 
                                mt: 1,
                                color: "#4a5d3a",
                                borderColor: "#4a5d3a",
                                borderRadius: "25px",
                                px: 3,
                                py: 1,
                                fontWeight: 600,
                                "&:hover": {
                                  backgroundColor: "rgba(74, 93, 58, 0.1)",
                                  borderColor: "#4a5d3a",
                                },
                              }}
                            >
                              Continue Shopping
                            </Button>
                          </Paper>
                        ) : (
                          <Grid container spacing={3} sx={{ mb: 4 }}>
                            {availableVouchers.clothes_vouchers.map(
                              (voucher) => (
                                <Grid
                                  item
                                  xs={12}
                                  md={6}
                                  lg={4}
                                  key={voucher._id}
                                >
                                  <VoucherCard
                                    voucher={voucher}
                                    showCollectButton={true}
                                  />
                                </Grid>
                              )
                            )}
                          </Grid>
                        )}
                      </>
                    )}
                  </div>
                  {/* Shipping Vouchers Tab */}
                  <div
                    role="tabpanel"
                    hidden={voucherTypeTab !== 1}
                    id="voucher-type-panel-1"
                    aria-labelledby="voucher-type-tab-1"
                  >
                    {voucherTypeTab === 1 && (
                      <>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={3}
                        >
                          <Typography variant="h6" fontWeight="bold">
                            Shipping Vouchers (
                            {availableVouchers.shipping_vouchers?.length || 0})
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<CollectionsBookmark />}
                            onClick={collectAllVouchers}
                            disabled={collectingAll || totalAvailable === 0}
                            sx={{
                              bgcolor: "#4a5d3a",
                              borderRadius: "25px",
                              px: 3,
                              py: 1,
                              fontWeight: 600,
                              boxShadow: "0 4px 15px rgba(74, 93, 58, 0.3)",
                              "&:hover": { 
                                bgcolor: "#3a4d2a",
                                boxShadow: "0 6px 20px rgba(74, 93, 58, 0.4)",
                              },
                            }}
                          >
                            {collectingAll ? (
                              <>
                                <CircularProgress
                                  size={16}
                                  color="inherit"
                                  sx={{ mr: 1 }}
                                />
                                Collecting...
                              </>
                            ) : (
                              "Collect All"
                            )}
                          </Button>
                        </Box>
                        {loading ? (
                          <Box display="flex" justifyContent="center" p={4}>
                            <CircularProgress />
                          </Box>
                        ) : availableVouchers.shipping_vouchers?.length ===
                          0 ? (
                          <Paper
                            elevation={1}
                            sx={{ p: 4, textAlign: "center" }}
                          >
                            <LocalShipping
                              sx={{ fontSize: 60, color: "#bdbdbd", mb: 2 }}
                            />
                            <Typography
                              variant="h6"
                              color="text.secondary"
                              gutterBottom
                            >
                              No shipping vouchers available
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              mb={2}
                            >
                              All shipping vouchers have been collected or
                              expired.
                            </Typography>
                            <Button
                              variant="outlined"
                              onClick={() => navigate("/products")}
                              sx={{ 
                                mt: 1,
                                color: "#4a5d3a",
                                borderColor: "#4a5d3a",
                                borderRadius: "25px",
                                px: 3,
                                py: 1,
                                fontWeight: 600,
                                "&:hover": {
                                  backgroundColor: "rgba(74, 93, 58, 0.1)",
                                  borderColor: "#4a5d3a",
                                },
                              }}
                            >
                              Continue Shopping
                            </Button>
                          </Paper>
                        ) : (
                          <Grid container spacing={3}>
                            {availableVouchers.shipping_vouchers.map(
                              (voucher) => (
                                <Grid
                                  item
                                  xs={12}
                                  md={6}
                                  lg={4}
                                  key={voucher._id}
                                >
                                  <VoucherCard
                                    voucher={voucher}
                                    showCollectButton={true}
                                  />
                                </Grid>
                              )
                            )}
                          </Grid>
                        )}
                      </>
                    )}
                  </div>
                </Box>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  My Collected Vouchers ({myVouchers.length})
                </Typography>

                {myVouchers.length === 0 ? (
                  <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
                    <CollectionsBookmark
                      sx={{ fontSize: 60, color: "#bdbdbd", mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No vouchers collected yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Go to Available Vouchers tab to start collecting!
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setTabValue(0)}
                      sx={{
                        bgcolor: "#4a5d3a",
                        borderRadius: "25px",
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        boxShadow: "0 4px 15px rgba(74, 93, 58, 0.3)",
                        "&:hover": { 
                          bgcolor: "#3a4d2a",
                          boxShadow: "0 6px 20px rgba(74, 93, 58, 0.4)",
                        },
                      }}
                    >
                      Browse Vouchers
                    </Button>
                  </Paper>
                ) : (
                  <>
                    {/* Clothes Vouchers Section */}
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocalOffer color="primary" />
                        Clothes Vouchers (
                        {
                          myVouchers.filter((v) => v.voucher_type === "clothes")
                            .length
                        }
                        )
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {myVouchers.filter((v) => v.voucher_type === "clothes")
                        .length === 0 ? (
                        <Paper
                          elevation={1}
                          sx={{ p: 3, textAlign: "center", bgcolor: "#f9f9f9" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            No clothes vouchers collected yet
                          </Typography>
                        </Paper>
                      ) : (
                        <Grid container spacing={3}>
                          {myVouchers
                            .filter(
                              (voucher) => voucher.voucher_type === "clothes"
                            )
                            .map((voucher) => (
                              <Grid item xs={12} md={6} lg={4} key={voucher.id}>
                                <VoucherCard
                                  voucher={voucher}
                                  showCollectButton={false}
                                  isMyVoucher={true}
                                />
                              </Grid>
                            ))}
                        </Grid>
                      )}
                    </Box>

                    {/* Shipping Vouchers Section */}
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocalShipping color="info" />
                        Shipping Vouchers (
                        {
                          myVouchers.filter(
                            (v) => v.voucher_type === "shipping"
                          ).length
                        }
                        )
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {myVouchers.filter((v) => v.voucher_type === "shipping")
                        .length === 0 ? (
                        <Paper
                          elevation={1}
                          sx={{ p: 3, textAlign: "center", bgcolor: "#f9f9f9" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            No shipping vouchers collected yet
                          </Typography>
                        </Paper>
                      ) : (
                        <Grid container spacing={3}>
                          {myVouchers
                            .filter(
                              (voucher) => voucher.voucher_type === "shipping"
                            )
                            .map((voucher) => (
                              <Grid item xs={12} md={6} lg={4} key={voucher.id}>
                                <VoucherCard
                                  voucher={voucher}
                                  showCollectButton={false}
                                  isMyVoucher={true}
                                />
                              </Grid>
                            ))}
                        </Grid>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </motion.div>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DiscountsPage;
