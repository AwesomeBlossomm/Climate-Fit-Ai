import React, { useState } from "react";
import PropTypes from "prop-types";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, AppBar, Toolbar, Typography, Button, MenuItem, Select } from "@mui/material";
import { Link } from "react-router-dom";

const handleLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

const mockOrders = [
  {
    transaction_id: "PAY12345",
    payment_id: "PAY12345",
    username: "john_doe",
    total_amount: 150.75,
    currency: "USD",
    payment_status: "completed",
  },
  {
    transaction_id: "PAY12345",
    payment_id: "PAY67890",
    username: "jane_smith",
    total_amount: 89.99,
    currency: "USD",
    payment_status: "pending",
  },
];

const OrdersTable = () => {
  const [orders, setOrders] = useState(mockOrders);

  const handleStatusChange = (event, paymentId) => {
    const newStatus = event.target.value;
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.payment_id === paymentId ? { ...order, payment_status: newStatus } : order
      )
    );
  };

  const saveStatus = (paymentId) => {
    const updatedOrder = orders.find((order) => order.payment_id === paymentId);
    console.log("Saving status for order:", updatedOrder);
    // Add API call here to save the updated status to the backend
  };

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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Payment ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.payment_id}>
                <TableCell>{order.transaction_id}</TableCell>
                <TableCell>{order.payment_id}</TableCell>
                <TableCell>{order.username}</TableCell>
                <TableCell>{order.total_amount.toFixed(2)}</TableCell>
                <TableCell>{order.currency}</TableCell>
                <TableCell>
                  <Select
                    value={order.payment_status}
                    onChange={(event) => handleStatusChange(event, order.payment_id)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: "#2e7d32", color: "white" }}
                    onClick={() => saveStatus(order.payment_id)}
                  >
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

OrdersTable.propTypes = {
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      transaction_id: PropTypes.string.isRequired,
      payment_id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      total_amount: PropTypes.number.isRequired,
      currency: PropTypes.string.isRequired,
      payment_status: PropTypes.string.isRequired,
      created_at: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default OrdersTable;
