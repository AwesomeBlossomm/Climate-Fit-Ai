import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, AppBar, Toolbar, Typography, Button, MenuItem, Select } from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";
import { styled } from "@mui/material/styles";

const handleLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: "bold",
  backgroundColor: theme.palette.grey[200],
  textAlign: "center",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: "white",
  "&:hover": {
    backgroundColor: theme.palette.success.dark,
  },
  margin: theme.spacing(0.5),
}));

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/orders");
        setOrders(response.data.orders);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch orders.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = (event, paymentId) => {
    const newStatus = event.target.value;
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.payment_id === paymentId ? { ...order, payment_status: newStatus } : order
      )
    );
  };

  const saveStatus = async (paymentId) => {
    const updatedOrder = orders.find((order) => order.payment_id === paymentId);
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/update-payment-status/${paymentId}`, {
        status: updatedOrder.payment_status,
      });
      alert("Status updated successfully.");
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleShippingStatusChange = (event, paymentId) => {
    const newShippingStatus = event.target.value;
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.payment_id === paymentId ? { ...order, shipping_status: newShippingStatus } : order
      )
    );
  };

  const saveShippingStatus = async (paymentId) => {
    const updatedOrder = orders.find((order) => order.payment_id === paymentId);
    try {
      await axios.put(`http://localhost:8000/api/v1/admin/update-shipping-status/${paymentId}`, {
        shipping_status: updatedOrder.shipping_status,
      });
      alert("Shipping status updated successfully.");
    } catch (err) {
      alert("Failed to update shipping status.");
    }
  };

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>{error}</p>;

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" component={Link} to="/admin/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/admin/users">
            User
          </Button>
          <Button color="inherit" component={Link} to="/admin/sellers">
            Seller
          </Button>
          <Button color="inherit" component={Link} to="/admin/products">
            Product
          </Button>
          <Button color="inherit" component={Link} to="/admin/graphs">
            Graphs
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Payment ID</StyledTableCell>
              <StyledTableCell>Username</StyledTableCell>
              <StyledTableCell>User ID</StyledTableCell>
              <StyledTableCell>Total Amount</StyledTableCell>
              <StyledTableCell>Subtotal</StyledTableCell>
              <StyledTableCell>Discount Amount</StyledTableCell>
              <StyledTableCell>Tax Amount</StyledTableCell>
              <StyledTableCell>Shipping Amount</StyledTableCell>
              <StyledTableCell>Currency</StyledTableCell>
              <StyledTableCell>Payment Status</StyledTableCell>
              <StyledTableCell>Shipping Status</StyledTableCell>
              <StyledTableCell>Discount Codes</StyledTableCell>
              <StyledTableCell>Notes</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.payment_id} hover>
                <TableCell>{order.payment_id}</TableCell>
                <TableCell>{order.username}</TableCell>
                <TableCell>{order.user_id}</TableCell>
                <TableCell>{order.total_amount.toFixed(2)}</TableCell>
                <TableCell>{order.subtotal.toFixed(2)}</TableCell>
                <TableCell>{order.discount_amount.toFixed(2)}</TableCell>
                <TableCell>{order.tax_amount.toFixed(2)}</TableCell>
                <TableCell>{order.shipping_amount.toFixed(2)}</TableCell>
                <TableCell>{order.currency}</TableCell>
                <TableCell>
                  <Select
                    value={order.payment_status}
                    onChange={(event) => handleStatusChange(event, order.payment_id)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={order.shipping_status || "not_shipped"}
                    onChange={(event) => handleShippingStatusChange(event, order.payment_id)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="not_shipped">Not Shipped</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="in_transit">In Transit</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>{order.discount_code?.join(", ") || "N/A"}</TableCell>
                <TableCell>{order.notes || "N/A"}</TableCell>
                <TableCell>
                  <StyledButton
                    variant="contained"
                    onClick={() => saveStatus(order.payment_id)}
                  >
                    Save Payment
                  </StyledButton>
                  <StyledButton
                    variant="contained"
                    onClick={() => saveShippingStatus(order.payment_id)}
                  >
                    Save Shipping
                  </StyledButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

OrdersTable.propTypes = {};

export default OrdersTable;
