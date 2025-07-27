import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, AppBar, Toolbar, Button } from "@mui/material";
import { Link } from "react-router-dom";

const UserTable = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/admin/users");
        setUsers(response.data.users || []); // Extract the users array from the response
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const toggleIsActive = async (userId, currentStatus) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/v1/admin/users/${userId}/is_active`, {
        is_active: !currentStatus,
      });
      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, is_active: !currentStatus } : user
          )
        );
      }
    } catch (error) {
      console.error("Error updating is_active status:", error);
    }
  };

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin User Table
          </Typography>
          <Button color="inherit" component={Link} to="/admin/dashboard">Dashboard</Button>
          <Button color="inherit" component={Link} to="/admin/sellers">Sellers</Button>
          <Button color="inherit" component={Link} to="/admin/products">Products</Button>
          <Button color="inherit" component={Link} to="/admin/orders">Orders</Button>
          <Button color="inherit" component={Link} to="/admin/graphs">Graphs</Button>
        </Toolbar>
      </AppBar>
      <Typography variant="h4" sx={{ mb: 3, color: "#2e7d32" }}>Users</Typography>
      <TableContainer component={Paper} sx={{ mb: 5 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Is Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user._id || "N/A"}</TableCell>
                <TableCell>{user.username || "N/A"}</TableCell>
                <TableCell>{user.email || "N/A"}</TableCell>
                <TableCell>{user.role || "N/A"}</TableCell>
                <TableCell>{user.is_active ? "Active" : "Inactive"}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color={user.is_active ? "error" : "success"}
                    onClick={() => toggleIsActive(user._id, user.is_active)}
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
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

export default UserTable;
