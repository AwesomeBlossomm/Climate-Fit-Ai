import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  AppBar,
  Toolbar,
  Grid,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  LocalOffer,
  Storefront,
  Payment,
} from "@mui/icons-material";
import WeatherMapSection from "../components/WeatherMapSection";
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const quickActions = [
    {
      title: "Browse Products",
      description: "Explore our eco-friendly product collection",
      icon: <Storefront sx={{ fontSize: 40, color: "#2e7d32" }} />,
      action: () => navigate("/products"),
      color: "#e8f5e8",
    },
    {
      title: "View Discounts",
      description: "Check out available offers and discounts",
      icon: <LocalOffer sx={{ fontSize: 40, color: "#ff6b6b" }} />,
      action: () => navigate("/discounts"),
      color: "#ffe8e8",
    },
    {
      title: "Shopping Cart",
      description: "Review items in your cart",
      icon: <ShoppingCart sx={{ fontSize: 40, color: "#1976d2" }} />,
      action: () => navigate("/cart"),
      color: "#e3f2fd",
    },
    {
      title: "3D Body Scan",
      description: "Explore the Modern way of Shopping",
      icon: <SensorOccupiedIcon sx={{ fontSize: 40, color: "#8e24aa " }} />,
      action: () => navigate("/bodyscan"),
      color: "#e3f2fd",
    },
  ];

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ClimateFit Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate("/products")}>
            Shop Now
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
        <Paper
          elevation={3}
          sx={{ p: 4, maxWidth: 1200, mx: "auto", borderRadius: 3 }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#2e7d32" }}
          >
            Welcome to ClimateFit! 🌱
          </Typography>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Hello, {user?.full_name || user?.username}!
          </Typography>

          {/* Weather and Map Section */}
          <WeatherMapSection />

          <Box mt={3} mb={4}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Account Information:</strong>
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Username:</strong> {user?.username}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Email:</strong> {user?.email}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Full Name:</strong> {user?.full_name}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: "bold", mb: 3 }}
          >
            Quick Actions
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    borderRadius: 2,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Box
                      sx={{
                        bgcolor: action.color,
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                    <Button
                      variant="contained"
                      onClick={action.action}
                      sx={{
                        bgcolor: "#2e7d32",
                        "&:hover": { bgcolor: "#1b5e20" },
                      }}
                    >
                      Get Started
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box
            sx={{
              textAlign: "center",
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleLogout}
              sx={{ mt: 3 }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default Dashboard;
