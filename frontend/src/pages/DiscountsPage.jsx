import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
  Tab,
  Tabs,
} from "@mui/material";
import {
  ArrowBack,
  LocalOffer,
  ContentCopy,
  Add,
  Edit,
  Delete,
  Percent,
  ShoppingCart,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const DiscountsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [userDiscounts, setUserDiscounts] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    code: "",
    description: "",
    discount: "",
    minPurchase: "",
    validUntil: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const mockAvailableDiscounts = [
    {
      id: 1,
      code: "SUMMER50",
      title: "Summer Sale 2025",
      description: "Get 50% off on all eco-friendly products",
      discount: 50,
      minPurchase: 50,
      validUntil: "2025-08-31",
      category: "Seasonal",
      terms: "Valid on orders above $50. Cannot be combined with other offers.",
      image: "/src/assets/landing-illustration.png",
    },
    {
      id: 2,
      code: "ECO33",
      title: "Eco Warriors Special",
      description: "33% off for environmental champions",
      discount: 33,
      minPurchase: 30,
      validUntil: "2025-07-31",
      category: "Special",
      terms: "Valid for first-time eco product purchases.",
    },
    {
      id: 3,
      code: "SAVE20",
      title: "Welcome Discount",
      description: "20% off for new customers",
      discount: 20,
      minPurchase: 25,
      validUntil: "2025-12-31",
      category: "Welcome",
      terms: "Valid for new customers only.",
    },
    {
      id: 4,
      code: "BULK15",
      title: "Bulk Purchase",
      description: "15% off on orders over $100",
      discount: 15,
      minPurchase: 100,
      validUntil: "2025-09-30",
      category: "Bulk",
      terms: "Valid on orders above $100. Stackable with seasonal offers.",
    },
    {
      id: 5,
      code: "STUDENT25",
      title: "Student Discount",
      description: "25% off for students",
      discount: 25,
      minPurchase: 20,
      validUntil: "2025-12-31",
      category: "Student",
      terms: "Valid student ID required. Verify at checkout.",
    },
  ];

  const mockUserDiscounts = [
    {
      id: 1,
      code: "LOYALTY10",
      description: "Loyalty reward - 10% off",
      discount: 10,
      usedDate: null,
      validUntil: "2025-08-15",
      status: "active",
    },
    {
      id: 2,
      code: "BIRTHDAY30",
      description: "Birthday special - 30% off",
      discount: 30,
      usedDate: "2025-06-15",
      validUntil: "2025-07-15",
      status: "used",
    },
  ];

  useEffect(() => {
    setAvailableDiscounts(mockAvailableDiscounts);
    setUserDiscounts(mockUserDiscounts);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const copyDiscountCode = (code) => {
    navigator.clipboard.writeText(code);
    setSnackbar({
      open: true,
      message: `Discount code "${code}" copied to clipboard!`,
      severity: "success",
    });
  };

  const claimDiscount = (discount) => {
    // Simulate claiming a discount
    const newUserDiscount = {
      id: Date.now(),
      code: discount.code,
      description: discount.description,
      discount: discount.discount,
      usedDate: null,
      validUntil: discount.validUntil,
      status: "active",
    };

    setUserDiscounts([newUserDiscount, ...userDiscounts]);
    setSnackbar({
      open: true,
      message: `Discount "${discount.code}" claimed successfully!`,
      severity: "success",
    });
  };

  const createCustomDiscount = () => {
    if (
      !newDiscount.code ||
      !newDiscount.description ||
      !newDiscount.discount
    ) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        severity: "error",
      });
      return;
    }

    const customDiscount = {
      id: Date.now(),
      ...newDiscount,
      usedDate: null,
      status: "active",
    };

    setUserDiscounts([customDiscount, ...userDiscounts]);
    setNewDiscount({
      code: "",
      description: "",
      discount: "",
      minPurchase: "",
      validUntil: "",
    });
    setCreateDialogOpen(false);
    setSnackbar({
      open: true,
      message: "Custom discount created successfully!",
      severity: "success",
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      Seasonal: "error",
      Special: "warning",
      Welcome: "success",
      Bulk: "info",
      Student: "secondary",
    };
    return colors[category] || "primary";
  };

  const getStatusColor = (status) => {
    return status === "active" ? "success" : "default";
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate("/products")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Discounts & Offers
          </Typography>
          <Button color="inherit" onClick={() => navigate("/products")}>
            Products
          </Button>
          <Button color="inherit" onClick={() => navigate("/cart")}>
            <ShoppingCart />
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#2e7d32" }}
          >
            💰 Discounts & Special Offers
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Save money on your eco-friendly purchases with our exclusive
            discounts and offers!
          </Typography>

          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="Available Discounts" />
              <Tab label="My Discounts" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {availableDiscounts.map((discount) => (
                  <Grid item xs={12} md={6} key={discount.id}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        elevation={3}
                        sx={{ height: "100%", borderRadius: 2 }}
                      >
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            mb={2}
                          >
                            <Box>
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                gutterBottom
                              >
                                {discount.title}
                              </Typography>
                              <Chip
                                label={discount.category}
                                color={getCategoryColor(discount.category)}
                                size="small"
                                sx={{ mb: 1 }}
                              />
                            </Box>
                            <Chip
                              label={`${discount.discount}% OFF`}
                              color="error"
                              sx={{ fontWeight: "bold" }}
                            />
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {discount.description}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" gutterBottom>
                              <strong>Code:</strong> {discount.code}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Min. Purchase:</strong> $
                              {discount.minPurchase}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Valid Until:</strong>{" "}
                              {new Date(
                                discount.validUntil
                              ).toLocaleDateString()}
                            </Typography>
                          </Box>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 2, display: "block" }}
                          >
                            {discount.terms}
                          </Typography>

                          <Box display="flex" gap={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<ContentCopy />}
                              onClick={() => copyDiscountCode(discount.code)}
                              sx={{ flexGrow: 1 }}
                            >
                              Copy Code
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<LocalOffer />}
                              onClick={() => claimDiscount(discount)}
                              disabled={isExpired(discount.validUntil)}
                              sx={{
                                flexGrow: 1,
                                bgcolor: "#2e7d32",
                                "&:hover": { bgcolor: "#1b5e20" },
                              }}
                            >
                              {isExpired(discount.validUntil)
                                ? "Expired"
                                : "Claim"}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6" fontWeight="bold">
                  Your Personal Discounts
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" } }}
                >
                  Create Custom
                </Button>
              </Box>

              {userDiscounts.length === 0 ? (
                <Paper
                  elevation={1}
                  sx={{ p: 4, textAlign: "center", borderRadius: 2 }}
                >
                  <LocalOffer sx={{ fontSize: 60, color: "#bdbdbd", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No personal discounts yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Claim discounts from the available offers or create custom
                    ones!
                  </Typography>
                </Paper>
              ) : (
                <List>
                  {userDiscounts.map((discount, index) => (
                    <React.Fragment key={discount.id}>
                      <ListItem
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 2,
                          mb: 1,
                          bgcolor:
                            discount.status === "used"
                              ? "grey.50"
                              : "background.paper",
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={2}>
                              <Typography variant="h6" fontWeight="bold">
                                {discount.code}
                              </Typography>
                              <Chip
                                label={`${discount.discount}% OFF`}
                                color="primary"
                                size="small"
                              />
                              <Chip
                                label={discount.status.toUpperCase()}
                                color={getStatusColor(discount.status)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" gutterBottom>
                                {discount.description}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Valid until:{" "}
                                {new Date(
                                  discount.validUntil
                                ).toLocaleDateString()}
                                {discount.usedDate && (
                                  <>
                                    {" "}
                                    • Used on:{" "}
                                    {new Date(
                                      discount.usedDate
                                    ).toLocaleDateString()}
                                  </>
                                )}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box display="flex" gap={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ContentCopy />}
                            onClick={() => copyDiscountCode(discount.code)}
                            disabled={
                              discount.status === "used" ||
                              isExpired(discount.validUntil)
                            }
                          >
                            Copy
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate("/cart")}
                            disabled={
                              discount.status === "used" ||
                              isExpired(discount.validUntil)
                            }
                            sx={{
                              bgcolor: "#2e7d32",
                              "&:hover": { bgcolor: "#1b5e20" },
                            }}
                          >
                            Use Now
                          </Button>
                        </Box>
                      </ListItem>
                      {index < userDiscounts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>
          </Paper>
        </motion.div>
      </Container>

      {/* Create Custom Discount Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Custom Discount</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Discount Code"
                fullWidth
                value={newDiscount.code}
                onChange={(e) =>
                  setNewDiscount({ ...newDiscount, code: e.target.value })
                }
                placeholder="e.g., MYCODE20"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={newDiscount.description}
                onChange={(e) =>
                  setNewDiscount({
                    ...newDiscount,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your discount..."
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Discount Percentage"
                type="number"
                fullWidth
                value={newDiscount.discount}
                onChange={(e) =>
                  setNewDiscount({ ...newDiscount, discount: e.target.value })
                }
                inputProps={{ min: 1, max: 100 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Minimum Purchase ($)"
                type="number"
                fullWidth
                value={newDiscount.minPurchase}
                onChange={(e) =>
                  setNewDiscount({
                    ...newDiscount,
                    minPurchase: e.target.value,
                  })
                }
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Valid Until"
                type="date"
                fullWidth
                value={newDiscount.validUntil}
                onChange={(e) =>
                  setNewDiscount({ ...newDiscount, validUntil: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={createCustomDiscount} variant="contained">
            Create Discount
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
