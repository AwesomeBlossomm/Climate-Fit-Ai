import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, AppBar, Toolbar, Button } from "@mui/material";
import { Link } from "react-router-dom";

const ProductTable = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/products");
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Product Table
          </Typography>
          <Button color="inherit" component={Link} to="/admin/dashboard">Dashboard</Button>
          <Button color="inherit" component={Link} to="/admin/users">Users</Button>
          <Button color="inherit" component={Link} to="/admin/sellers">Sellers</Button>
          <Button color="inherit" component={Link} to="/admin/orders">Orders</Button>
          <Button color="inherit" component={Link} to="/admin/graphs">Graphs</Button>
        </Toolbar>
      </AppBar>
      <Typography variant="h4" sx={{ mb: 3, color: "#2e7d32" }}>Products</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id}>
                <TableCell>{product._id}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>₱{product.price_php}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default ProductTable;
