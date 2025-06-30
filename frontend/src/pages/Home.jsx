import React from "react";
import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      textAlign="center"
      sx={{ p: 3 }}
    >
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Our App
        </Typography>
        <Typography variant="h6" component="p" gutterBottom>
          Your journey starts here
        </Typography>

        <Box mt={4}>
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
            <Box>
              <Button
                variant="contained"
                component={Link}
                to="/login"
                sx={{ mr: 2 }}
              >
                Login
              </Button>
              <Button variant="outlined" component={Link} to="/register">
                Register
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
