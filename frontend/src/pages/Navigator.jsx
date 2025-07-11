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
      py: 1.5,
      backgroundColor: "#c9b190",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1100,
      boxShadow: 1,
    }}
  >
    {/* Logo and Title */}
    <Box display="flex" alignItems="center">
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#fff",
          mr: 2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src="src/assets/logo.png"
          alt="Climate Fit Logo"
          sx={{
            width: "115px",
            height: "115px",
            objectFit: "cover",
          }}
        />
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          letterSpacing: 2,
          color: "#46403d",
        }}
      >
        CLIMATE FIT
      </Typography>
    </Box>
    {/* Buttons */}
    <Box display="flex" alignItems="center">
      <Button
        component={Link}
        to="/login"
        variant="outlined"
        sx={{
          backgroundColor: "#f5f5dc",
          color: "#46403d",
          border: "2px solid #46403d",
          borderRadius: "20px",
          px: 3,
          py: 1,
          fontWeight: 600,
          textTransform: "none",
          mr: 1, // less margin between buttons
          "&:hover": {
            backgroundColor: "#e9e4d0",
            borderColor: "#46403d",
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
          backgroundColor: "#46403d",
          color: "#fff",
          borderRadius: "20px",
          px: 3,
          py: 1,
          fontWeight: 600,
          textTransform: "none",
          "&:hover": {
            backgroundColor: "#2d2926",
          },
        }}
      >
        Join Us
      </Button>
    </Box>
  </Box>
);

export default Navigator;
