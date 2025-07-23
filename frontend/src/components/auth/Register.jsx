import React, { useState } from "react";
import Navigator from "../../pages/Navigator";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { username, email, password, full_name } = formData;
      const result = await register({ username, email, password, full_name });

      if (result.success) {
        setSuccess(
          "Registration successful! Please login with your credentials."
        );
        setTimeout(() => {
          navigate("/login");
        }, 2000);
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
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #6b8357 0%, #5a7047 100%)", // Dark green gradient matching your image
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
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
          {/* Registration Form Card */}
          <Paper
            elevation={8}
            sx={{
              borderRadius: "30px",
              p: { xs: 3, md: 5 },
              width: "100%",
              maxWidth: 450,
              background: "#f5f2ed", // Light cream background matching your image
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              minHeight: 650,
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
                mb: 3,
                fontSize: { xs: "2.2rem", md: "3rem" },
              }}
            >
              Sign Up
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, fontSize: "0.85rem" }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2, fontSize: "0.85rem" }}>
                {success}
              </Alert>
            )}

            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              style={{ width: "100%" }}
            >
              <Typography
                sx={{
                  color: "#2d3d2d",
                  fontWeight: 500,
                  mb: 1,
                  fontSize: "0.9rem",
                }}
              >
                Full Name
              </Typography>
              <TextField
                fullWidth
                name="full_name"
                placeholder="Juan Dela Cruz"
                value={formData.full_name}
                onChange={handleChange}
                margin="none"
                required
                InputProps={{
                  sx: {
                    background: "#e8e4dd", // Light gray background matching your image
                    borderRadius: "25px",
                    fontStyle: "italic",
                    fontSize: "0.95rem",
                    height: 48,
                    mb: 2,
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
                  },
                }}
              />

              <Typography
                sx={{
                  color: "#2d3d2d",
                  fontWeight: 500,
                  mb: 1,
                  mt: 2,
                  fontSize: "0.9rem",
                }}
              >
                Username
              </Typography>
              <TextField
                fullWidth
                name="username"
                placeholder="JuanDelaCruz02"
                value={formData.username}
                onChange={handleChange}
                margin="none"
                required
                InputProps={{
                  sx: {
                    background: "#e8e4dd",
                    borderRadius: "25px",
                    fontStyle: "italic",
                    fontSize: "0.95rem",
                    height: 48,
                    mb: 2,
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
                  },
                }}
              />

              <Typography
                sx={{
                  color: "#2d3d2d",
                  fontWeight: 500,
                  mb: 1,
                  mt: 2,
                  fontSize: "0.9rem",
                }}
              >
                Email Address
              </Typography>
              <TextField
                fullWidth
                name="email"
                placeholder="juan@google.com"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="none"
                required
                InputProps={{
                  sx: {
                    background: "#e8e4dd",
                    borderRadius: "25px",
                    fontStyle: "italic",
                    fontSize: "0.95rem",
                    height: 48,
                    mb: 2,
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
                  },
                }}
              />

              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      color: "#2d3d2d",
                      fontWeight: 500,
                      mb: 1,
                      fontSize: "0.9rem",
                    }}
                  >
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    margin="none"
                    required
                    placeholder="**********"
                    InputProps={{
                      sx: {
                        background: "#e8e4dd",
                        borderRadius: "25px",
                        fontStyle: "italic",
                        fontSize: "0.95rem",
                        height: 48,
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
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword((show) => !show)}
                            edge="end"
                            size="small"
                            sx={{ color: "#6d7d6d" }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      color: "#2d3d2d",
                      fontWeight: 500,
                      mb: 1,
                      fontSize: "0.9rem",
                    }}
                  >
                    Confirm Password
                  </Typography>
                  <TextField
                    fullWidth
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    margin="none"
                    required
                    placeholder="**********"
                    InputProps={{
                      sx: {
                        background: "#e8e4dd",
                        borderRadius: "25px",
                        fontStyle: "italic",
                        fontSize: "0.95rem",
                        height: 48,
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
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirm((show) => !show)}
                            edge="end"
                            size="small"
                            sx={{ color: "#6d7d6d" }}
                          >
                            {showConfirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
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
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography
                  sx={{ color: "#8a8a8a", fontSize: 14, fontStyle: "italic" }}
                >
                  Or
                </Typography>
              </Box>

              <Button
                fullWidth
                component={Link}
                to="/login"
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
                Log in
              </Button>
            </form>
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default Register;
