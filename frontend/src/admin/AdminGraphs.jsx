import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Button, Paper, Grid, Card, CardContent } from "@mui/material";
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
import { 
  BarChart,
  TrendingUp,
  People,
  Store,
  AttachMoney,
  Analytics,
  Dashboard as DashboardIcon,
  ShoppingBag,
  ShoppingCart
} from "@mui/icons-material";
import { motion } from "framer-motion";

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
  const [salesData, setSalesData] = useState({ labels: [], datasets: [] });

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
        // Set fallback data if API fails
        setUserSellerData({
          users: [],
          sellers: [],
          labels: [],
        });
      }
    };

    fetchUserSellerGrowth();
  }, []);

  useEffect(() => {
    const fetchMonthlySales = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/analytics/monthly-sales");
        const monthlyData = response.data.sales_data;

        if (monthlyData && Array.isArray(monthlyData)) {
          setSalesData({
            labels: monthlyData.map((item) => item.month),
            datasets: [
              {
                label: "Sales (in ₱)",
                data: monthlyData.map((item) => item.profit),
                backgroundColor: "rgba(143, 168, 118, 0.8)", // Light green matching Dashboard.jsx
                borderColor: "#8fa876",
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
              },
            ],
          });
        } else {
          throw new Error("Invalid sales data format");
        }
      } catch (error) {
        console.error("Error fetching monthly sales data:", error);
        // Fallback to mock data if API fails
        setSalesData({
          labels: ["January", "February", "March", "April", "May", "June"],
          datasets: [
            {
              label: "Sales (in ₱)",
              data: [500, 700, 400, 800, 600, 900],
              backgroundColor: "rgba(143, 168, 118, 0.8)", // Light green matching Dashboard.jsx
              borderColor: "#8fa876",
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        });
      }
    };

    fetchMonthlySales();
  }, []);

  const chartData = {
    labels: userSellerData.labels,
    datasets: [
      {
        label: "Users Registered",
        data: userSellerData.users,
        borderColor: "#8fa876", // Light green matching Dashboard.jsx
        backgroundColor: "rgba(143, 168, 118, 0.2)",
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#8fa876",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
      {
        label: "Sellers Registered",
        data: userSellerData.sellers,
        borderColor: "#4a5d3a", // Dark green matching Dashboard.jsx
        backgroundColor: "rgba(74, 93, 58, 0.2)",
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#4a5d3a",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };



  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#4a5d3a",
          font: {
            size: 12,
            weight: 600,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: false, // We'll use custom titles
      },
      tooltip: {
        backgroundColor: "rgba(74, 93, 58, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#8fa876",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(74, 93, 58, 0.1)",
        },
        ticks: {
          color: "#4a5d3a",
          font: {
            size: 11,
            weight: 500,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(74, 93, 58, 0.1)",
        },
        ticks: {
          color: "#4a5d3a",
          font: {
            size: 11,
            weight: 500,
          },
        },
      },
    },
  };

  // Calculate totals for statistics
  const getTotalUsers = () => {
    return userSellerData.users ? userSellerData.users.reduce((sum, count) => sum + count, 0) : 0;
  };

  const getTotalSellers = () => {
    return userSellerData.sellers ? userSellerData.sellers.reduce((sum, count) => sum + count, 0) : 0;
  };

  const getTotalSales = () => {
    if (salesData.datasets && salesData.datasets[0] && salesData.datasets[0].data) {
      return salesData.datasets[0].data.reduce((sum, amount) => sum + amount, 0);
    }
    return 0;
  };

  return (
    <>
      {/* Fixed Header */}
      <Box
        component="header"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        sx={{
          px: 4,
          py: 2,
          backgroundColor: "#4a5d3a", // Dark green matching Dashboard.jsx
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
              src="/src/assets/ClimateFitLogo.png"
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
              ADMIN - ANALYTICS DASHBOARD
            </Typography>
          </Box>
        </Box>

        {/* Header Navigation */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            component={Link}
            to="/admin/dashboard"
            startIcon={<DashboardIcon />}
            sx={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "25px",
              px: 2,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.85rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#ffffff",
              },
            }}
          >
            Dashboard
          </Button>
          <Button
            component={Link}
            to="/admin/users"
            startIcon={<People />}
            sx={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "25px",
              px: 2,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.85rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#ffffff",
              },
            }}
          >
            Users
          </Button>
          <Button
            component={Link}
            to="/admin/sellers"
            startIcon={<Store />}
            sx={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "25px",
              px: 2,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.85rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#ffffff",
              },
            }}
          >
            Sellers
          </Button>
          <Button
            component={Link}
            to="/admin/products"
            startIcon={<ShoppingBag />}
            sx={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "25px",
              px: 2,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.85rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#ffffff",
              },
            }}
          >
            Products
          </Button>
          <Button
            component={Link}
            to="/admin/orders"
            startIcon={<ShoppingCart />}
            sx={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "25px",
              px: 2,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.85rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#ffffff",
              },
            }}
          >
            Orders
          </Button>
          <Button
            onClick={handleLogout}
            sx={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "25px",
              px: 2,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.85rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#ffffff",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content with Dashboard.jsx background */}
      <Box
        sx={{
          pt: 12, // Account for fixed header height
          mt: 10, // Add top margin for extra spacing
          minHeight: "100vh",
          backgroundColor: "#f0f8f0", // Light green background matching Dashboard.jsx
          background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)", // Light green gradient matching Dashboard.jsx
          px: { xs: 2, md: 4 },
          py: 4,
        }}
      >
        {/* Page Header */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          sx={{
            maxWidth: 1400,
            mx: "auto",
            mb: 4,
          }}
        >
          <Box
            sx={{
              background: "#4a5d3a", // Dark green background matching Dashboard.jsx
              borderRadius: "24px",
              p: 4,
              boxShadow: "0 10px 30px rgba(74, 93, 58, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Box
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Analytics sx={{ fontSize: 40, color: "#ffffff" }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: "#ffffff",
                  fontSize: "2rem",
                  mb: 1,
                  lineHeight: 1.2,
                }}
              >
                Analytics Dashboard 📊
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "1rem",
                  lineHeight: 1.5,
                }}
              >
                Monitor platform growth, user engagement, and sales performance with comprehensive analytics
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          sx={{
            maxWidth: 900,
            mx: "auto",
            mb: 4,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #8fa876 0%, #7a956a 100%)",
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(143, 168, 118, 0.3)",
                  color: "#ffffff",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                      Total Users
                    </Typography>
                    <People sx={{ fontSize: 30, opacity: 0.8 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: "2.5rem", mb: 1 }}>
                    {getTotalUsers()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.85rem" }}>
                    Registered platform users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #7a956a 0%, #6b8459 100%)",
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(122, 149, 106, 0.3)",
                  color: "#ffffff",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                      Total Sellers
                    </Typography>
                    <Store sx={{ fontSize: 30, opacity: 0.8 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: "2.5rem", mb: 1 }}>
                    {getTotalSellers()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.85rem" }}>
                    Active marketplace sellers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #6b8459 0%, #5c7349 100%)",
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(107, 132, 89, 0.3)",
                  color: "#ffffff",
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                      Total Sales
                    </Typography>
                    <AttachMoney sx={{ fontSize: 30, opacity: 0.8 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: "2.5rem", mb: 1 }}>
                    ₱{getTotalSales()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.85rem" }}>
                    Total revenue generated
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Charts Section */}
        <Box
          sx={{
            width: "100%",
            px: 1,
          }}
        >
          <Box display="flex" gap={2} width="100%">
            {/* User and Seller Growth Chart */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              sx={{ flex: 1 }}
            >
              <Paper
                sx={{
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                  overflow: "hidden",
                  background: "#ffffff",
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    background: "linear-gradient(135deg, #4a5d3a 0%, #5c7349 100%)",
                    p: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 30, color: "#ffffff" }} />
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                      }}
                    >
                      User & Seller Growth
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.85rem",
                      }}
                    >
                      Platform growth over time
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 3, height: 400 }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
              </Paper>
            </Box>

            {/* Monthly Sales Chart */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              sx={{ flex: 1 }}
            >
              <Paper
                sx={{
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                  overflow: "hidden",
                  background: "#ffffff",
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    background: "linear-gradient(135deg, #4a5d3a 0%, #5c7349 100%)",
                    p: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <BarChart sx={{ fontSize: 30, color: "#ffffff" }} />
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                      }}
                    >
                      Monthly Sales
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.85rem",
                      }}
                    >
                      Revenue trends by month
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 3, height: 400 }}>
                  <Bar data={salesData} options={chartOptions} />
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default AdminGraphs;
