import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  WbSunny,
  Cloud,
  Grain,
  Air,
  Visibility,
  Thermostat,
  Water,
  Refresh,
  LocationOn,
} from "@mui/icons-material";
import { motion } from "framer-motion";

const WeatherMapSection = () => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    setError("");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Location access denied. Using default location.");
          // Default to Manila, Philippines
          const defaultLat = 14.5995;
          const defaultLng = 120.9842;
          setLocation({ lat: defaultLat, lng: defaultLng });
          fetchWeatherData(defaultLat, defaultLng);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  };

  const fetchWeatherData = async (lat, lng) => {
    try {
      // Mock weather data - replace with actual API call
      const mockWeatherData = {
        location: "Manila, Philippines",
        temperature: 28,
        condition: "Partly Cloudy",
        humidity: 75,
        windSpeed: 12,
        visibility: 10,
        uvIndex: 6,
        feelsLike: 32,
        description: "Perfect weather for lightweight, breathable clothing",
        icon: "partly-cloudy",
        suggestions: [
          "Light cotton shirts recommended",
          "UV protection advised",
          "Breathable fabrics ideal",
        ],
      };

      // Simulate API delay
      setTimeout(() => {
        setWeather(mockWeatherData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setError("Failed to fetch weather data");
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      sunny: <WbSunny sx={{ color: "#ffa726" }} />,
      cloudy: <Cloud sx={{ color: "#78909c" }} />,
      "partly-cloudy": <Cloud sx={{ color: "#90a4ae" }} />,
      rainy: <Grain sx={{ color: "#42a5f5" }} />,
    };
    return icons[condition] || <WbSunny sx={{ color: "#ffa726" }} />;
  };

  const getTemperatureColor = (temp) => {
    if (temp > 30) return "#ff5722"; // Hot - red
    if (temp > 25) return "#ff9800"; // Warm - orange
    if (temp > 20) return "#4caf50"; // Mild - green
    return "#2196f3"; // Cool - blue
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="center" py={4}>
          <CircularProgress sx={{ mr: 2 }} />
          <Typography>Loading weather and location data...</Typography>
        </Box>
      </Paper>
    );
  }

  if (error && !weather) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#2e7d32" }}
          >
            🌍 Current Location & Weather
          </Typography>
          <Tooltip title="Refresh weather data">
            <IconButton onClick={getCurrentLocation} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {/* Map Section */}
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ height: 300, borderRadius: 2 }}>
              <CardContent sx={{ height: "100%", p: 0 }}>
                <Box
                  sx={{
                    height: "100%",
                    background: `linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  <LocationOn sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" textAlign="center">
                    {weather?.location || "Loading location..."}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Lat: {location?.lat.toFixed(4)}, Lng:{" "}
                    {location?.lng.toFixed(4)}
                  </Typography>

                  {/* Placeholder for actual map integration */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 16,
                      left: 16,
                      right: 16,
                      bgcolor: "rgba(255,255,255,0.2)",
                      borderRadius: 1,
                      p: 1,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="caption">
                      Interactive map will be integrated here
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Weather Section */}
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ height: 300, borderRadius: 2 }}>
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Current Weather
                  </Typography>
                  {weather && getWeatherIcon(weather.icon)}
                </Box>

                {weather && (
                  <>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Typography
                        variant="h2"
                        sx={{
                          fontWeight: "bold",
                          color: getTemperatureColor(weather.temperature),
                          mr: 2,
                        }}
                      >
                        {weather.temperature}°C
                      </Typography>
                      <Box>
                        <Typography variant="h6">
                          {weather.condition}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Feels like {weather.feelsLike}°C
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                          <Water
                            sx={{ mr: 1, color: "#2196f3", fontSize: 20 }}
                          />
                          <Typography variant="body2">
                            Humidity: {weather.humidity}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                          <Air sx={{ mr: 1, color: "#607d8b", fontSize: 20 }} />
                          <Typography variant="body2">
                            Wind: {weather.windSpeed} km/h
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                          <Visibility
                            sx={{ mr: 1, color: "#9e9e9e", fontSize: 20 }}
                          />
                          <Typography variant="body2">
                            Visibility: {weather.visibility} km
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                          <WbSunny
                            sx={{ mr: 1, color: "#ffa726", fontSize: 20 }}
                          />
                          <Typography variant="body2">
                            UV Index: {weather.uvIndex}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, fontStyle: "italic" }}
                    >
                      {weather.description}
                    </Typography>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: "bold" }}
                      >
                        Climate-Fit Suggestions:
                      </Typography>
                      {weather.suggestions.map((suggestion, index) => (
                        <Chip
                          key={index}
                          label={suggestion}
                          size="small"
                          sx={{
                            mr: 1,
                            mb: 1,
                            bgcolor: "#e8f5e8",
                            color: "#2e7d32",
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </motion.div>
  );
};

export default WeatherMapSection;
