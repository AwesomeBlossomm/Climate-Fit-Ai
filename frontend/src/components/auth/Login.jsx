import React, { useState } from "react";
import Navigator from "../../pages/Navigator";
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
        const role = localStorage.getItem("role"); 
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
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
          background: "linear-gradient(135deg, #8fa876 0%, #7a956a 100%)", // Green gradient matching your image
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          pt: 12, // Account for fixed navigator
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="100%"
          maxWidth={500}
          sx={{ mx: "auto" }}
        >
          {/* Login Form Card */}
          <Paper
            elevation={8}
            sx={{
              borderRadius: "30px",
              p: { xs: 3, md: 5 },
              width: "100%",
              maxWidth: 450,
              background: "#f5f2ed", // Light cream background matching your image
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              minHeight: 550,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h3"
              align="center"
              sx={{
                fontWeight: 700,
                color: "#2d3d2d", // Dark text matching your image
                mb: 4,
                fontSize: { xs: "2.2rem", md: "3rem" },
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
                      <Person sx={{ color: "#6d7d6d" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    background: "#e8e4dd", // Light gray background matching your image
                    borderRadius: "25px",
                    fontStyle: "italic",
                    fontWeight: 500,
                    color: "#2d3d2d",
                    "& input": {
                      color: "#2d3d2d",
                      "&::placeholder": {
                        color: "#8a8a8a",
                        fontStyle: "italic",
                      },
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      border: "2px solid #8fa876",
                    },
                    mb: 2,
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
                      <Lock sx={{ color: "#6d7d6d" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                        size="small"
                        sx={{ color: "#6d7d6d" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    background: "#e8e4dd", // Light gray background matching your image
                    borderRadius: "25px",
                    fontStyle: "italic",
                    fontWeight: 500,
                    color: "#2d3d2d",
                    "& input": {
                      color: "#2d3d2d",
                      "&::placeholder": {
                        color: "#8a8a8a",
                        fontStyle: "italic",
                      },
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      border: "2px solid #8fa876",
                    },
                    mb: 2,
                  },
                }}
              />
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mt={1}
                mb={3}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      sx={{
                        color: "#6d7d6d",
                        "&.Mui-checked": { color: "#8fa876" },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: "#6d7d6d",
                        fontStyle: "italic",
                      }}
                    >
                      Remember Me
                    </Typography>
                  }
                />
                <Typography
                  component={Link}
                  to="/forgot-password"
                  sx={{
                    color: "#6d7d6d",
                    fontStyle: "italic",
                    fontSize: 14,
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                      color: "#8fa876",
                    },
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
                  mt: 2,
                  mb: 3,
                  backgroundColor: "#4a5d3a", // Dark green matching your image
                  color: "#fff",
                  borderRadius: "25px",
                  fontWeight: 700,
                  fontSize: 16,
                  py: 1.8,
                  boxShadow: "0 4px 15px rgba(74, 93, 58, 0.3)",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#3a4d2a",
                    boxShadow: "0 6px 20px rgba(74, 93, 58, 0.4)",
                  },
                  "&:disabled": {
                    backgroundColor: "#a5a5a5",
                  },
                }}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </Button>

              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography
                  sx={{ color: "#8a8a8a", fontSize: 14, fontStyle: "italic" }}
                >
                  Or
                </Typography>
              </Box>

              <Button
                component={Link}
                to="/register"
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: "#e8e4dd", // Light background matching your image
                  color: "#2d3d2d",
                  borderRadius: "25px",
                  fontWeight: 600,
                  fontSize: 16,
                  py: 1.8,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#d8d4cd",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                  },
                }}
              >
                Sign up
              </Button>
            </form>
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default Login;
