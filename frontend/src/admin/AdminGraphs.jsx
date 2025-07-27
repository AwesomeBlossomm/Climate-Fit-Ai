import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, AppBar, Toolbar, Button } from "@mui/material";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const AdminGraphs = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [userSellerData, setUserSellerData] = useState({ users: [], sellers: [] });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchUserSellerGrowth = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/analytics/user-seller-growth");
        const { user_growth, seller_growth } = response.data;

        setUserSellerData({
          users: user_growth.map((item) => item.count),
          sellers: seller_growth.map((item) => item.count),
          labels: user_growth.map((item) => item.date),
        });
      } catch (error) {
        console.error("Error fetching user and seller growth data:", error);
      }
    };

    fetchUserSellerGrowth();
  }, []);

  const chartData = {
    labels: userSellerData.labels,
    datasets: [
      {
        label: "Users Registered",
        data: userSellerData.users,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
      {
        label: "Sellers Registered",
        data: userSellerData.sellers,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const salesData = {
    labels: ["January", "February", "March", "April", "May", "June"],
    datasets: [
      {
        label: "Sales (in ₱)",
        data: [500, 700, 400, 800, 600, 900],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Admin Analytics",
      },
    },
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
          <Button color="inherit" component={Link} to="/admin/orders">
            Orders</Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
        <Typography variant="h4" sx={{ mb: 3, color: "#2e7d32" }}>
          User and Seller Growth
        </Typography>
        <Line data={chartData} options={options} />

        <Typography variant="h4" sx={{ mt: 5, mb: 3, color: "#2e7d32" }}>
          Monthly Sales
        </Typography>
        <Bar data={salesData} options={options} />
      </Box>
    </>
  );
};

export default AdminGraphs;
