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
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack,
  Payment,
  Receipt,
  Download,
  Visibility,
  CheckCircle,
  Cancel,
  Pending,
  Error as ErrorIcon,
  Refresh,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const PaymentHistoryPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:8000/api/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();

      // Sort payments by creation date (newest first)
      const sortedPayments = (data.payments || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setPayments(sortedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:8000/payments/payment-stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics || []);
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    }
  };

  const fetchPaymentDetails = async (paymentId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8000/payments/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment details");
      }

      const data = await response.json();
      setSelectedPayment(data);
      setDetailsOpen(true);
    } catch (error) {
      console.error("Error fetching payment details:", error);
      setError(error.message);
    }
  };

  const cancelPayment = async (paymentId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8000/payments/cancel-payment/${paymentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel payment");
      }

      // Refresh payments list
      fetchPayments();
    } catch (error) {
      console.error("Error cancelling payment:", error);
      setError(error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "success",
      pending: "warning",
      processing: "info",
      failed: "error",
      cancelled: "default",
      refunded: "secondary",
    };
    return colors[status] || "default";
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle />,
      pending: <Pending />,
      processing: <CircularProgress size={20} />,
      failed: <ErrorIcon />,
      cancelled: <Cancel />,
      refunded: <Refresh />,
    };
    return icons[status] || <Payment />;
  };

  const filteredPayments = payments.filter((payment) => {
    if (filterStatus === "all") return true;
    return payment.payment_status === filterStatus;
  });

  const groupedPayments = {
    all: payments,
    completed: payments.filter((p) => p.payment_status === "completed"),
    pending: payments.filter((p) => p.payment_status === "pending"),
    failed: payments.filter((p) => p.payment_status === "failed"),
    cancelled: payments.filter((p) => p.payment_status === "cancelled"),
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={60} />
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
            Payment History
          </Typography>
          <Button color="inherit" onClick={() => navigate("/products")}>
            Products
          </Button>
          <Button color="inherit" onClick={() => navigate("/cart")}>
            Cart
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
            💳 Payment History
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            View and manage your payment transactions (sorted by newest first)
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Payment Statistics */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat) => (
                <Grid item xs={12} sm={6} md={3} key={stat._id}>
                  <Card elevation={2}>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography
                        variant="h4"
                        color="primary"
                        fontWeight="bold"
                      >
                        {stat.count}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textTransform="capitalize"
                      >
                        {stat._id} Payments
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        ${stat.total_amount.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6" fontWeight="bold">
                  Transaction History
                </Typography>
                <TextField
                  select
                  label="Filter by Status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  size="small"
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">All Payments</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
              </Box>
            </Box>

            {filteredPayments.length === 0 ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Payment sx={{ fontSize: 60, color: "#bdbdbd", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No payments found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filterStatus === "all"
                    ? "You haven't made any payments yet."
                    : `No ${filterStatus} payments found.`}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/products")}
                  sx={{
                    mt: 2,
                    bgcolor: "#2e7d32",
                    "&:hover": { bgcolor: "#1b5e20" },
                  }}
                >
                  Start Shopping
                </Button>
              </Box>
            ) : (
              <List>
                {filteredPayments.map((payment, index) => (
                  <React.Fragment key={payment.payment_id}>
                    <ListItem
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        mb: 1,
                        mx: 2,
                        bgcolor: "background.paper",
                        flexDirection: "column",
                        alignItems: "stretch",
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        width="100%"
                      >
                        <ListItemText
                          primary={
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={2}
                              mb={1}
                            >
                              <Typography variant="h6" fontWeight="bold">
                                Payment #{payment.payment_id}
                              </Typography>
                              <Chip
                                icon={getStatusIcon(payment.payment_status)}
                                label={payment.payment_status.toUpperCase()}
                                color={getStatusColor(payment.payment_status)}
                                size="small"
                              />
                              {payment.discount_code && (
                                <Chip
                                  label={`${
                                    payment.discount_code
                                  } - $${payment.discount_amount.toFixed(
                                    2
                                  )} saved`}
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" gutterBottom>
                                {new Date(
                                  payment.created_at
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  payment.created_at
                                ).toLocaleTimeString()}
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                Payment Method:{" "}
                                {payment.payment_method
                                  .replace("_", " ")
                                  .toUpperCase()}
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                Items: {payment.items.length} item(s)
                              </Typography>
                              {payment.discount_code && (
                                <Typography
                                  variant="body2"
                                  color="success.main"
                                  gutterBottom
                                >
                                  ✅ Discount Applied: {payment.discount_code}{" "}
                                  (-$
                                  {payment.discount_amount.toFixed(2)})
                                </Typography>
                              )}
                              {payment.transaction_id && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Transaction ID: {payment.transaction_id}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Box textAlign="right">
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            color="primary"
                          >
                            ${payment.total_amount.toFixed(2)}
                          </Typography>
                          {payment.discount_amount > 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Original: $
                              {(
                                payment.total_amount + payment.discount_amount
                              ).toFixed(2)}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box
                        display="flex"
                        justifyContent="flex-end"
                        gap={1}
                        mt={2}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() =>
                            fetchPaymentDetails(payment.payment_id)
                          }
                        >
                          Details
                        </Button>
                        {payment.payment_status === "pending" && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Cancel />}
                            onClick={() => cancelPayment(payment.payment_id)}
                          >
                            Cancel
                          </Button>
                        )}
                        {payment.payment_status === "completed" && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Download />}
                            onClick={() => {
                              /* Implement receipt download */
                            }}
                          >
                            Receipt
                          </Button>
                        )}
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </motion.div>
      </Container>

      {/* Payment Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Payment Details - {selectedPayment?.payment_id}
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={selectedPayment.payment_status.toUpperCase()}
                          color={getStatusColor(selectedPayment.payment_status)}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Total Amount"
                      secondary={`$${selectedPayment.total_amount.toFixed(2)}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Payment Method"
                      secondary={selectedPayment.payment_method
                        .replace("_", " ")
                        .toUpperCase()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Created At"
                      secondary={new Date(
                        selectedPayment.created_at
                      ).toLocaleString()}
                    />
                  </ListItem>
                  {selectedPayment.transaction_id && (
                    <ListItem>
                      <ListItemText
                        primary="Transaction ID"
                        secondary={selectedPayment.transaction_id}
                      />
                    </ListItem>
                  )}
                  {selectedPayment.discount_code && (
                    <ListItem>
                      <ListItemText
                        primary="Discount Used"
                        secondary={
                          <Box>
                            <Typography variant="body2" color="success.main">
                              Code: {selectedPayment.discount_code}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              Saved: $
                              {selectedPayment.discount_amount.toFixed(2)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Billing Address
                </Typography>
                <Typography variant="body2">
                  {selectedPayment.billing_address.full_name}
                  <br />
                  {selectedPayment.billing_address.address_line1}
                  <br />
                  {selectedPayment.billing_address.city},{" "}
                  {selectedPayment.billing_address.state}{" "}
                  {selectedPayment.billing_address.postal_code}
                  <br />
                  {selectedPayment.billing_address.country}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Items Purchased
                </Typography>
                <List>
                  {selectedPayment.items.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={item.product_name}
                        secondary={`Quantity: ${
                          item.quantity
                        } × $${item.unit_price.toFixed(2)}`}
                      />
                      <Typography variant="body2">
                        ${item.total_price.toFixed(2)}
                      </Typography>
                    </ListItem>
                  ))}
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Subtotal" />
                    <Typography>
                      ${selectedPayment.subtotal.toFixed(2)}
                    </Typography>
                  </ListItem>
                  {selectedPayment.discount_amount > 0 && (
                    <ListItem>
                      <ListItemText
                        primary={`Discount (${selectedPayment.discount_code})`}
                        sx={{ color: "success.main" }}
                      />
                      <Typography color="success.main">
                        -${selectedPayment.discount_amount.toFixed(2)}
                      </Typography>
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemText primary="Tax" />
                    <Typography>
                      ${selectedPayment.tax_amount.toFixed(2)}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Shipping" />
                    <Typography>
                      ${selectedPayment.shipping_amount.toFixed(2)}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="h6">Total</Typography>}
                    />
                    <Typography variant="h6" color="primary">
                      ${selectedPayment.total_amount.toFixed(2)}
                    </Typography>
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedPayment?.payment_status === "completed" && (
            <Button variant="contained" startIcon={<Download />}>
              Download Receipt
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentHistoryPage;
