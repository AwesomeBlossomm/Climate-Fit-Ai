import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  WbSunny,
  Cloud,
  Grain,
  Air,
  Water,
  Refresh,
  LocationOn,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  geocodeAddress,
  getWeatherData,
  generateClothingSuggestions,
} from "../services/weatherService";

const WeatherWidget = ({ selectedAddress, onClothingSuggestions }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clothingSuggestions, setClothingSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [lastProcessedAddress, setLastProcessedAddress] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedAddress) {
        // Create a unique identifier for the address
        const addressKey = `${selectedAddress._id}-${selectedAddress.postal_code}-${selectedAddress.city}`;
        const lastKey = lastProcessedAddress
          ? `${lastProcessedAddress._id}-${lastProcessedAddress.postal_code}-${lastProcessedAddress.city}`
          : null;

        // Check if this is actually a new address to process
        if (addressKey === lastKey && weather) {
          return;
        }

        // Clear previous data immediately and show loading
        setWeather(null);
        setClothingSuggestions([]);
        setError("");

        try {
          await handleAddressWeather(selectedAddress);
          setLastProcessedAddress({ ...selectedAddress });
        } catch (error) {
          console.error("Error in address weather fetch:", error);
          setError(error.message);
          setLoading(false);
        }
      } else {
        // Only use current location if no address is selected and no previous address
        if (!lastProcessedAddress) {
          setWeather(null);
          setClothingSuggestions([]);
          setError("");
          try {
            await getCurrentLocation();
          } catch (error) {
            console.error("Error in current location fetch:", error);
            setError(error.message);
            setLoading(false);
          }
        }
      }
    };

    fetchData();
  }, [selectedAddress]);

  const handleAddressWeather = async (address) => {
    setLoading(true);
    setError("");
    setClothingSuggestions([]);

    try {
      if (!address || !address.city || !address.postal_code) {
        throw new Error(
          "Address must have city and postal code for weather lookup"
        );
      }

      const coordinates = await geocodeAddress(address);

      if (
        !coordinates ||
        typeof coordinates.lat !== "number" ||
        typeof coordinates.lon !== "number"
      ) {
        throw new Error(
          `Invalid coordinates received: ${JSON.stringify(coordinates)}`
        );
      }

      const weatherData = await getWeatherData(
        coordinates.lat,
        coordinates.lon
      );

      const processedWeather = {
        location: `${address.city}, ${address.region}`,
        temperature: Math.round(weatherData.main.temp),
        condition: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: Math.round(weatherData.wind.speed * 3.6),
        icon: weatherData.weather[0].icon,
        rawData: weatherData,
      };

      setWeather(processedWeather);
      await generateSuggestions(weatherData);
    } catch (error) {
      console.error("Error in address weather processing:", error);
      setError(
        `Failed to get weather for ${address.city}, ${address.region}: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    setError("");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const weatherData = await getWeatherData(latitude, longitude);

            const processedWeather = {
              location: weatherData.name || "Current Location",
              temperature: Math.round(weatherData.main.temp),
              condition: weatherData.weather[0].main,
              description: weatherData.weather[0].description,
              humidity: weatherData.main.humidity,
              windSpeed: Math.round(weatherData.wind.speed * 3.6),
              icon: weatherData.weather[0].icon,
              rawData: weatherData,
            };

            setWeather(processedWeather);
            await generateSuggestions(weatherData);
          } catch (error) {
            console.error("Error fetching weather:", error);
            setError("Failed to fetch weather data");
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setError(
            "Location access denied. Please select an address or enable location access."
          );
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  };

  const generateSuggestions = async (weatherData) => {
    setLoadingSuggestions(true);
    try {
      const suggestions = await generateClothingSuggestions(weatherData);
      setClothingSuggestions(suggestions);

      // Pass suggestions to parent component for filtering
      if (onClothingSuggestions) {
        onClothingSuggestions(suggestions);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      // Set fallback suggestions based on temperature
      const temp = weatherData.main.temp;
      let fallbackSuggestions = [];

      if (temp > 30) {
        fallbackSuggestions = [
          "lightweight",
          "breathable",
          "cotton",
          "shorts",
          "tank-top",
        ];
      } else if (temp > 25) {
        fallbackSuggestions = [
          "light",
          "cotton",
          "t-shirt",
          "comfortable",
          "casual",
        ];
      } else if (temp > 20) {
        fallbackSuggestions = [
          "long-sleeve",
          "light-jacket",
          "comfortable",
          "layers",
        ];
      } else {
        fallbackSuggestions = [
          "warm",
          "jacket",
          "sweater",
          "layered",
          "insulated",
        ];
      }

      setClothingSuggestions(fallbackSuggestions);
      if (onClothingSuggestions) {
        onClothingSuggestions(fallbackSuggestions);
      }
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      Clear: <WbSunny sx={{ color: "#ffa726" }} />,
      Clouds: <Cloud sx={{ color: "#78909c" }} />,
      Rain: <Grain sx={{ color: "#42a5f5" }} />,
      Drizzle: <Grain sx={{ color: "#64b5f6" }} />,
      Snow: <Grain sx={{ color: "#e1f5fe" }} />,
      Mist: <Cloud sx={{ color: "#90a4ae" }} />,
      Fog: <Cloud sx={{ color: "#90a4ae" }} />,
    };
    return icons[condition] || <WbSunny sx={{ color: "#ffa726" }} />;
  };

  if (loading) {
    return (
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          borderRadius: 3,
          background: "linear-gradient(135deg, #d4e9d4 30%, #e8f5e8 90%)",
          border: "2px solid #8fa876",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" py={2}>
          <CircularProgress size={20} sx={{ mr: 1, color: "#4a5d3a" }} />
          <Typography variant="body2" sx={{ color: "#4a5d3a" }}>
            Loading weather data...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error && !weather) {
    return (
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          borderRadius: 3,
          background: "linear-gradient(135deg, #d4e9d4 30%, #e8f5e8 90%)",
          border: "2px solid #8fa876",
        }}
      >
        <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
          {error}
        </Alert>
        <Box display="flex" justifyContent="center" mt={1}>
          <IconButton
            size="small"
            onClick={
              selectedAddress
                ? () => handleAddressWeather(selectedAddress)
                : getCurrentLocation
            }
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 3,
          background: "linear-gradient(135deg, #d4e9d4 30%, #e8f5e8 90%)",
          border: "2px solid #8fa876",
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1.5}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOn sx={{ fontSize: 18, color: "#4a5d3a" }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: "bold", color: "#4a5d3a", fontSize: "0.9rem" }}
            >
              Weather Widget
            </Typography>
          </Box>
          <Tooltip title="Refresh weather data">
            <IconButton
              size="small"
              onClick={
                selectedAddress
                  ? () => handleAddressWeather(selectedAddress)
                  : getCurrentLocation
              }
              disabled={loading}
            >
              <Refresh fontSize="small" sx={{ color: "#4a5d3a" }} />
            </IconButton>
          </Tooltip>
        </Box>

        {weather && (
          <>
            {/* Location and Temperature */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: "#4a5d3a", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  {weather.location}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#6b8459", textTransform: "capitalize", fontSize: "0.75rem" }}
                >
                  {weather.description}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    color: "#4a5d3a",
                    fontSize: "1.8rem",
                  }}
                >
                  {weather.temperature}°C
                </Typography>
                <Box display="flex" alignItems="center">
                  {getWeatherIcon(weather.condition)}
                  {weather.icon && (
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                      alt={weather.description}
                      style={{ width: 24, height: 24, marginLeft: 4 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Weather Details */}
            <Box display="flex" justifyContent="space-around" mb={1.5}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Water sx={{ fontSize: 16, color: "#6b8459" }} />
                <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "#4a5d3a" }}>
                  {weather.humidity}%
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Air sx={{ fontSize: 16, color: "#6b8459" }} />
                <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "#4a5d3a" }}>
                  {weather.windSpeed} km/h
                </Typography>
              </Box>
            </Box>

            {/* AI Suggestions */}
            <Box>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    color: "#4a5d3a",
                    fontSize: "0.75rem",
                  }}
                >
                  🤖 AI Suggestions:
                </Typography>
                {loadingSuggestions && <CircularProgress size={12} />}
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.3 }}>
                {clothingSuggestions.slice(0, 4).map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    size="small"
                    sx={{
                      bgcolor: "#c8e6c9",
                      color: "#4a5d3a",
                      fontSize: "0.65rem",
                      height: 18,
                      "& .MuiChip-label": {
                        px: 0.5,
                      },
                    }}
                  />
                ))}
                {clothingSuggestions.length > 4 && (
                  <Chip
                    label={`+${clothingSuggestions.length - 4}`}
                    size="small"
                    sx={{
                      bgcolor: "#a5d6a7",
                      color: "#4a5d3a",
                      fontSize: "0.65rem",
                      height: 18,
                      "& .MuiChip-label": {
                        px: 0.5,
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </motion.div>
  );
};

export default WeatherWidget;
