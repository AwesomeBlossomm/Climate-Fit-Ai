import React, { useEffect, useState } from "react";
import { Box, Typography, AppBar, Toolbar, Button } from "@mui/material";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import UserTable from "./UserTable";
import SellerTable from "./SellerTable";
import ProductTable from "./ProductTable";

const AdminDashboard = () => {
  const { user, logout, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]); 
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    // Fetch users
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/users");
        console.log(response.data); // Debug log (optional)
        setUsers(response.data.users || []); // Extract the users array from the response
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    // Fetch products
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/products");
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    // Fetch sellers
    const fetchSellers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/sellers");
        setSellers(response.data.sellers || []);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };

    fetchUsers();
    fetchProducts();
    fetchSellers();
  }, []);

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" component={Link} to="/admin/users">Users</Button>
          <Button color="inherit" component={Link} to="/admin/sellers">Sellers</Button>
          <Button color="inherit" component={Link} to="/admin/products">Products</Button>
          <Button color="inherit" component={Link} to="/admin/orders">Orders</Button>
          <Button color="inherit" component={Link} to="/admin/graphs">Graphs</Button>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
        <Typography variant="h4" sx={{ mb: 3, color: "#2e7d32" }}>
          Welcome to the Admin Dashboard
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Use the navigation bar to view user, seller, and product data.
        </Typography>

        <Box sx={{ display: "flex", gap: 3, mb: 5 }}>
          <Box sx={{ flex: 1, p: 2, bgcolor: "#e8f5e9", borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: "#2e7d32" }}>Total Users</Typography>
            <Typography variant="h4" sx={{ color: "#2e7d32" }}>{users.length}</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 2, bgcolor: "#e8f5e9", borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: "#2e7d32" }}>Total Sellers</Typography>
            <Typography variant="h4" sx={{ color: "#2e7d32" }}>{sellers.length}</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 2, bgcolor: "#e8f5e9", borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: "#2e7d32" }}>Total Products</Typography>
            <Typography variant="h4" sx={{ color: "#2e7d32" }}>{products.length}</Typography>
          </Box>
        </Box>

        {/* Uncomment the tables below to display data */}
        {/* <UserTable users={users} />
        <ProductTable products={products} />
        <SellerTable sellers={sellers} /> */}
      </Box>
    </>
  );
};

export default AdminDashboard;
