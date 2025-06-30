import React from "react";
import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h3" gutterBottom>
          Welcome to Our App
        </Typography>

        {isAuthenticated ? (
          <>
            <Typography variant="h5" paragraph>
              Hello, {user?.username}!
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" component={Link} to="/dashboard">
                Go to Dashboard
              </Button>
              <Button variant="outlined" onClick={logout}>
                Logout
              </Button>
            </Stack>
          </>
        ) : (
          <>
            <Typography variant="body1" paragraph>
              This is a public page accessible to everyone.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" component={Link} to="/login">
                Login
              </Button>
              <Button variant="outlined" component={Link} to="/register">
                Register
              </Button>
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Home;
