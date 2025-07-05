import React, { useState } from "react";
import Navigator from "/src/pages/Navigator";
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
          background: "#f7ecdd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
      <Box
        sx={{
          display: "flex",
          width: { xs: "500%", md: "1000px" },
          boxShadow: "none",
          borderRadius: 0,
          background: "transparent",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1, md: 9 },
        }}
      >
        {/* Illustration */}
        <Box
          sx={{
            flex: 1,
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            pr: 0,
          }}
        >
          <img
            src="/assets/signup-illustration.png" // <-- replace with your actual image path
            alt="Sign Up Illustration"
            style={{ width: "100%", maxWidth: 400, height: "auto" }}
          />
        </Box>

        {/* Form */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: "40px",
            background: "#d1c1ad",
            p: { xs: 2, md: 3 },
            width: { xs: "100%", md: 420 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            // minWidth: 400,
            // maxWidth: 320,
            // width: "100%",
            minHeight: 550,   // reduced from 500
            maxHeight: 480,   // add a maxHeight
            boxShadow: "0 4px 24px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#4d3b2a",
              mb: 3,
              fontSize: { xs: "2rem", md: "2.8rem" },
              textAlign: "left",
            }}
          >
            Sign Up
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 1, fontSize: "0.85rem" }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 1, fontSize: "0.85rem" }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" style={{ width: "100%" }}>
            <TextField
              fullWidth
              name="full_name"
              label="Full Name"
              placeholder="Juan Dela Cruz"
              value={formData.full_name}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                sx: {
                  borderRadius: "25px",
                  background: "#ede3d4",
                  fontStyle: "italic",
                  fontSize: "1rem",
                  height: 48,
                },
              }}
              InputLabelProps={{
                sx: { color: "#4d3b2a", fontWeight: 500, fontSize: "0.95rem" },
              }}
            />
            <TextField
              fullWidth
              name="username"
              label="Username"
              placeholder="JuanDelaCruz02"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                sx: {
                  borderRadius: "25px",
                  background: "#ede3d4",
                  fontStyle: "italic",
                  fontSize: "1rem",
                  height: 48,
                },
              }}
              InputLabelProps={{
                sx: { color: "#4d3b2a", fontWeight: 500, fontSize: "0.95rem"  },
              }}
            />
            <TextField
              fullWidth
              name="email"
              label="Email Address"
              placeholder="juan@gmail.com"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                sx: {
                  borderRadius: "25px",
                  background: "#ede3d4",
                  fontStyle: "italic",
                  fontSize: "1rem",
                  height: 48,
                },
              }}
              InputLabelProps={{
                sx: { color: "#4d3b2a", fontWeight: 500, fontSize: "0.95rem" },
              }}
            />
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                placeholder="********"
                InputProps={{
                  sx: {
                    borderRadius: "25px",
                    background: "#ede3d4",
                    fontStyle: "italic",
                    fontSize: "1rem",
                    height: 48, 
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  sx: { color: "#4d3b2a", fontWeight: 500, fontSize: "0.95rem" },
                }}
              />
              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                required
                placeholder="********"
                InputProps={{
                  sx: {
                    borderRadius: "25px",
                    background: "#ede3d4",
                    fontStyle: "italic",
                    fontSize: "1rem",
                    height: 48,
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirm((show) => !show)}
                        edge="end"
                        size="small"
                      >
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  sx: { color: "#4d3b2a", fontWeight: 500, fontSize: "0.95rem" },
                }}
              />
            </Box>
             <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 1,
                borderRadius: "25px",
                background: "#181818",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                py: 1,
                boxShadow: "none",
                "&:hover": { background: "#333" },
              }}
              disabled={loading}
            >
              {loading ? "Registering..." : "Create Account"}
            </Button>
            <Divider sx={{ my: 1, color: "#b48c5a", fontWeight: 500, fontSiz: "0.95rem" }}>Or</Divider>
            <Button
              fullWidth
              component={Link}
              to="/login"
              variant="outlined"
              sx={{
                borderRadius: "25px",
                background: "#ede3d4",
                color: "#4d3b2a",
                fontWeight: 600,
                fontSize: "1rem",
                py: 1,
                border: "none",
                "&:hover": { background: "#e2cfa3" },
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
