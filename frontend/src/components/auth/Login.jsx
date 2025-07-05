import React, { useState } from "react";
import Navigator from "/src/pages/Navigator";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, Person, Lock } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";



const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navigator />
    <Box
      minHeight="100vh"
      width="100vw"
      sx={{
        background: "#c9bba5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 0,
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width="100%"
        maxWidth={1100}
        sx={{ mx: "auto" }}
      >
        {/* Left: Login Form */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "40px",
            p: { xs: 2, md: 3 },
            width: { xs: "100%", md: 420 },
            background: "#f7ebdd",
            mr: { md: 4 },
            boxShadow: "none",
            minHeight: 450,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#3a2e25",
              mb: 3,
              fontSize: { xs: "2rem", md: "2.8rem" },
            }}
          >
            Welcome Back!
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "#3a2e25" }} />
                  </InputAdornment>
                ),
                sx: {
                  background: "#e6dfd5",
                  borderRadius: "24px",
                  fontStyle: "italic",
                  fontWeight: 500,
                  color: "#3a2e25",
                  "& input": { color: "#3a2e25" },
                },
              }}
              />
            <TextField
              fullWidth
              name="password"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#3a2e25" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  background: "#e6dfd5",
                  borderRadius: "24px",
                  fontStyle: "italic",
                  fontWeight: 500,
                  color: "#3a2e25",
                  "& input": { color: "#3a2e25" },
                },
              }}
            />
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mt={1}
              mb={2}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    sx={{
                      color: "#3a2e25",
                      "&.Mui-checked": { color: "#3a2e25" },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 15, color: "#3a2e25" }}>
                    Remember Me
                  </Typography>
                }
              />
              <Typography
                component={Link}
                to="/forgot-password"
                sx={{
                  color: "#8b7c6a",
                  fontStyle: "italic",
                  fontSize: 15,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Forgot Password?
              </Typography>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 1,
                mb: 2,
                backgroundColor: "#23211d",
                color: "#fff",
                borderRadius: "28px",
                fontWeight: 600,
                fontSize: 18,
                py: 1.5,
                boxShadow: "none",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#3a2e25",
                },
              }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>
            <Divider sx={{ my: 2, color: "#bdbdbd" }}>Or</Divider>
            <Button
              component={Link}
              to="/register"
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: "#e6dfd5",
                color: "#23211d",
                borderRadius: "28px",
                fontWeight: 600,
                fontSize: 18,
                py: 1.5,
                boxShadow: "none",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#d6cfc2",
                },
              }}
            >
              Sign up
            </Button>
          </form>
        </Paper>
        {/* Right: Illustration */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            flex: 1,
            minWidth: 400,
            pl: 4,
          }}
        >
           <Box
            component="img"
            src="/assets/login-illustration.png" // <-- Replace with your illustration path
            alt="Login Illustration"
            sx={{
              width: "100%",
              height: "auto",
              maxWidth: 520,
              display: "block",
            }}
          />
        </Box>
      </Box>
    </Box>
    </>
  );
};

export default Login;
