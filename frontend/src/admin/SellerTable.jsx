import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, AppBar, Toolbar, Button } from "@mui/material";
import { Link } from "react-router-dom";

const SellerTable = () => {
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/sellers");
        setSellers(response.data.sellers || []);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };

    fetchSellers();
  }, []);

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Seller Table
          </Typography>
          <Button color="inherit" component={Link} to="/admin/dashboard">Dashboard</Button>
          <Button color="inherit" component={Link} to="/admin/users">Users</Button>
          <Button color="inherit" component={Link} to="/admin/products">Products</Button>
          <Button color="inherit" component={Link} to="/admin/orders">Orders</Button>
          <Button color="inherit" component={Link} to="/admin/graphs">Graphs</Button>
        </Toolbar>
      </AppBar>
      <Typography variant="h4" sx={{ mb: 3, color: "#2e7d32" }}>Sellers</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Store Name</TableCell>
              <TableCell>Owner Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Contact Number</TableCell>
              <TableCell>Specialization</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sellers.map((seller) => (
              <TableRow key={seller._id}>
                <TableCell>{seller._id}</TableCell>
                <TableCell>{seller.store_name}</TableCell>
                <TableCell>{seller.owner_full_name}</TableCell>
                <TableCell>{seller.email}</TableCell>
                <TableCell>{seller.contact_number}</TableCell>
                <TableCell>{seller.specializes_in.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default SellerTable;
