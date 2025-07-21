import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const Navigator = () => (
  <Box
    component="header"
    display="flex"
    justifyContent="space-between"
    alignItems="center"
    width="100%"
    sx={{
      px: 4,
      py: 2,
      backgroundColor: "#4a5d3a", // Dark green matching the image
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
        component={Link}
        to="/"
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
          src="src/assets/ClimateFitLogo.png"
          alt="Climate Fit Logo"
          sx={{
              width: "90px",
              height: "50px",
              objectFit: "cover",
          }}
        />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            letterSpacing: 1.5,
            color: "#ffffff",
            fontSize: "1.5rem",
          }}
        >
          CLIMATE FIT
        </Typography>
      </Box>
    </Box>
    {/* Buttons */}
    <Box display="flex" alignItems="center" gap={2}>
      <Button
        component={Link}
        to="/login"
        variant="outlined"
        sx={{
          backgroundColor: "transparent",
          color: "#ffffff",
          border: "2px solid #ffffff",
          borderRadius: "25px",
          px: 4,
          py: 1,
          fontWeight: 600,
          textTransform: "none",
          fontSize: "0.95rem",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.1)",
            borderColor: "#ffffff",
          },
        }}
      >
        Log In
      </Button>
      <Button
        component={Link}
        to="/register"
        variant="contained"
        sx={{
          backgroundColor: "#8fa876", // Light green matching the image
          color: "#ffffff",
          borderRadius: "25px",
          px: 4,
          py: 1,
          fontWeight: 600,
          textTransform: "none",
          fontSize: "0.95rem",
          "&:hover": {
            backgroundColor: "#7a956a",
          },
        }}
      >
        Join Us
      </Button>
    </Box>
  </Box>
);

export default Navigator;
