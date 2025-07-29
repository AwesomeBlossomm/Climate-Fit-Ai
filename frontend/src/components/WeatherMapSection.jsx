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
import {
  geocodeAddress,
  getWeatherData,
  generateClothingSuggestions,
} from "../services/weatherService";

const WeatherMapSection = ({ selectedAddress, onClothingSuggestions }) => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clothingSuggestions, setClothingSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [lastProcessedAddress, setLastProcessedAddress] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log("=== WEATHER EFFECT TRIGGERED ===");
      console.log("Selected address:", selectedAddress);
      console.log("Last processed address:", lastProcessedAddress);

      if (selectedAddress) {
        // Create a unique identifier for the address
        const addressKey = `${selectedAddress._id}-${selectedAddress.postal_code}-${selectedAddress.city}`;
        const lastKey = lastProcessedAddress
          ? `${lastProcessedAddress._id}-${lastProcessedAddress.postal_code}-${lastProcessedAddress.city}`
          : null;

        console.log("Address key:", addressKey);
        console.log("Last key:", lastKey);

        // Check if this is actually a new address to process
        if (addressKey === lastKey && weather) {
          console.log("Skipping fetch - same address already processed");
          return;
        }

        console.log("Processing new selected address:", {
          id: selectedAddress._id,
          city: selectedAddress.city,
          postal_code: selectedAddress.postal_code,
          region: selectedAddress.region,
        });

        // Clear previous data immediately and show loading
        setWeather(null);
        setClothingSuggestions([]);
        setError("");
        setLocation(null);

        try {
          await handleAddressWeather(selectedAddress);
          setLastProcessedAddress({ ...selectedAddress }); // Create a copy
        } catch (error) {
          console.error("Error in address weather fetch:", error);
          setError(error.message);
          setLoading(false);
        }
      } else {
        // Only use current location if no address is selected and no previous address
        if (!lastProcessedAddress) {
          console.log("No address selected, fetching current location");
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
  }, [selectedAddress]); // Only depend on selectedAddress object

  const handleAddressWeather = async (address) => {
    console.log("=== HANDLE ADDRESS WEATHER START ===");
    setLoading(true);
    setError("");
    setClothingSuggestions([]);

    console.log(
      "Processing address for weather:",
      JSON.stringify(address, null, 2)
    );

    try {
      // Validate required address fields
      if (!address || !address.city || !address.postal_code) {
        throw new Error(
          "Address must have city and postal code for weather lookup"
        );
      }

      // Step 1: Geocode the address - THIS MUST RUN FIRST AND COMPLETE
      console.log("Step 1: Starting geocoding for address...");
      console.log("Geocoding input:", {
        city: address.city,
        province: address.province,
        region: address.region,
        postal_code: address.postal_code,
      });

      // CRITICAL: Wait for geocoding to complete before proceeding
      console.log("🔍 Calling geocodeAddress function...");
      const coordinates = await geocodeAddress(address);
      console.log("✅ Step 2: Geocoding completed successfully:", coordinates);

      // Enhanced coordinate validation
      if (
        !coordinates ||
        typeof coordinates.lat !== "number" ||
        typeof coordinates.lon !== "number"
      ) {
        throw new Error(
          `Invalid coordinates received: ${JSON.stringify(coordinates)}`
        );
      }

      // Validate coordinates are reasonable for Philippines
      const PHILIPPINES_BOUNDS = {
        lat: { min: 4.5, max: 21.5 },
        lon: { min: 116.0, max: 127.0 },
      };

      if (
        coordinates.lat < PHILIPPINES_BOUNDS.lat.min ||
        coordinates.lat > PHILIPPINES_BOUNDS.lat.max ||
        coordinates.lon < PHILIPPINES_BOUNDS.lon.min ||
        coordinates.lon > PHILIPPINES_BOUNDS.lon.max
      ) {
        throw new Error(
          `Coordinates ${coordinates.lat}, ${coordinates.lon} are outside Philippines bounds. Expected location in Philippines for "${address.city}, ${address.region}".`
        );
      }

      // Update location state with geocoded coordinates
      setLocation({ lat: coordinates.lat, lng: coordinates.lon });
      console.log("📍 Location state updated with coordinates:", {
        lat: coordinates.lat,
        lng: coordinates.lon,
      });

      // Step 3: Get weather data using the geocoded coordinates
      console.log("Step 3: Fetching weather data for geocoded coordinates...");
      console.log("Weather API will be called with:", {
        lat: coordinates.lat,
        lon: coordinates.lon,
      });

      const weatherData = await getWeatherData(
        coordinates.lat,
        coordinates.lon
      );
      console.log("✅ Step 4: Weather data received:", {
        location: weatherData.name,
        country: weatherData.sys?.country,
        temp: weatherData.main.temp,
        description: weatherData.weather[0].description,
        coordinates_used: { lat: coordinates.lat, lon: coordinates.lon },
      });

      // Validate weather data is from Philippines
      if (weatherData.sys?.country && weatherData.sys.country !== "PH") {
        console.warn(
          `⚠️ Weather data is from ${weatherData.sys.country}, not Philippines. This indicates geocoding returned wrong coordinates.`
        );
        throw new Error(
          `Weather data returned from ${weatherData.sys.country} instead of Philippines. Please verify the address "${address.city}, ${address.region}".`
        );
      }

      // Verify weather location
      const weatherCity = weatherData.name?.toLowerCase() || "";
      const expectedCity = address.city.toLowerCase().replace("city of ", "");

      console.log("Step 5: Location verification:", {
        weatherCity,
        expectedCity,
        weatherCountry: weatherData.sys?.country,
        postalCode: address.postal_code,
        coordinates: coordinates,
        match:
          weatherCity.includes(expectedCity) ||
          expectedCity.includes(weatherCity),
      });

      // Process weather data
      const processedWeather = {
        location: `${address.city}, ${address.region}`,
        weatherApiLocation: weatherData.name,
        weatherCountry: weatherData.sys?.country || "Unknown",
        addressDetails: `${address.street}, ${address.barangay}`,
        postalCode: address.postal_code,
        temperature: Math.round(weatherData.main.temp),
        condition: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: Math.round(weatherData.wind.speed * 3.6),
        visibility: Math.round(weatherData.visibility / 1000),
        feelsLike: Math.round(weatherData.main.feels_like),
        pressure: weatherData.main.pressure,
        icon: weatherData.weather[0].icon,
        rawData: weatherData,
        // Include coordinates for debugging
        geocodedCoordinates: coordinates,
        coordinatesValid: true,
      };

      setWeather(processedWeather);
      console.log(
        "✅ Step 6: Weather processed successfully for:",
        processedWeather.location
      );

      // Step 7: Generate clothing suggestions
      console.log("Step 7: Generating clothing suggestions...");
      await generateSuggestions(weatherData);

      console.log("=== HANDLE ADDRESS WEATHER COMPLETED SUCCESSFULLY ===");
    } catch (error) {
      console.error("=== ERROR IN ADDRESS WEATHER PROCESSING ===");
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Address being processed:", address);
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
          setLocation({ lat: latitude, lng: longitude });

          try {
            const weatherData = await getWeatherData(latitude, longitude);

            const processedWeather = {
              location: weatherData.name || "Current Location",
              temperature: Math.round(weatherData.main.temp),
              condition: weatherData.weather[0].main,
              description: weatherData.weather[0].description,
              humidity: weatherData.main.humidity,
              windSpeed: Math.round(weatherData.wind.speed * 3.6),
              visibility: Math.round(weatherData.visibility / 1000),
              feelsLike: Math.round(weatherData.main.feels_like),
              pressure: weatherData.main.pressure,
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
      console.log("Generating clothing suggestions for weather:", weatherData);
      const suggestions = await generateClothingSuggestions(weatherData);
      console.log("Generated suggestions:", suggestions);
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
        <Box display="flex" justifyContent="center">
          <IconButton
            onClick={
              selectedAddress
                ? () => handleAddressWeather(selectedAddress)
                : getCurrentLocation
            }
          >
            <Refresh />
          </IconButton>
        </Box>
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
            sx={{ fontWeight: "bold", color: "#4a5d3a" }}
          >
            🌍 {selectedAddress ? "Selected Location" : "Current Location"} &
            Weather
          </Typography>
          <Tooltip title="Refresh weather data">
            <IconButton
              onClick={
                selectedAddress
                  ? () => handleAddressWeather(selectedAddress)
                  : getCurrentLocation
              }
              disabled={loading}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {/* Map Section */}
          <Grid item xs={12} sm={5} md={5}>
            <Card elevation={1} sx={{ height: 400, borderRadius: 2 }}>
              <CardContent sx={{ height: "100%", p: 0 }}>
                <Box
                  sx={{
                    height: "100%",
                    background: selectedAddress
                      ? `linear-gradient(45deg, #4a5d3a 30%, #6b8459 90%)`
                      : `linear-gradient(45deg, #4a5d3a 30%, #8fa876 90%)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  <LocationOn sx={{ fontSize: 60, mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ mb: 0.5, fontSize: "1.1rem" }}>
                    {weather?.location || "Loading location..."}
                  </Typography>
                  {selectedAddress && weather && (
                    <>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          opacity: 0.9,
                          textAlign: "center",
                          fontSize: "0.8rem",
                        }}
                      >
                        📍 {weather.addressDetails}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.3,
                          opacity: 0.9,
                          textAlign: "center",
                          fontSize: "0.8rem",
                        }}
                      >
                        📮 Postal Code: {weather.postalCode}
                      </Typography>
                    </>
                  )}
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8, fontSize: "0.75rem" }}>
                    Lat: {location?.lat.toFixed(4)}, Lng: {location?.lng.toFixed(4)}
                  </Typography>

                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      right: 12,
                      bgcolor: "rgba(255,255,255,0.2)",
                      borderRadius: 1,
                      p: 1,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                      Real-time weather data from OpenWeatherMap
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Weather Section */}
          <Grid item xs={12} sm={7} md={7}>
            <Card elevation={1} sx={{ height: 400, borderRadius: 2 }}>
              <CardContent sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column" }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1.1rem" }}>
                    Current Weather
                  </Typography>
                  {weather && (
                    <Box display="flex" alignItems="center">
                      {getWeatherIcon(weather.condition)}
                      {weather.icon && (
                        <img
                          src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                          alt={weather.description}
                          style={{ width: 32, height: 32, marginLeft: 6 }}
                        />
                      )}
                    </Box>
                  )}
                </Box>

                {weather && (
                  <>
                    <Box display="flex" alignItems="center" mb={1.5}>
                      <Typography
                        variant="h1"
                        sx={{
                          fontWeight: "bold",
                          color: "#4a5d3a",
                          mr: 1.5,
                          fontSize: "2.5rem",
                        }}
                      >
                        {weather.temperature}°C
                      </Typography>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ textTransform: "capitalize", fontSize: "1rem" }}
                        >
                          {weather.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                          Feels like {weather.feelsLike}°C
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={0.5} sx={{ mb: 1.5 }}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                          <Water
                            sx={{ mr: 0.5, color: "#6b8459", fontSize: 16 }}
                          />
                          <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                            Humidity: {weather.humidity}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                          <Air sx={{ mr: 0.5, color: "#6b8459", fontSize: 16 }} />
                          <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                            Wind: {weather.windSpeed} km/h
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                          <Visibility
                            sx={{ mr: 0.5, color: "#6b8459", fontSize: 16 }}
                          />
                          <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                            Visibility: {weather.visibility} km
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center">
                          <Thermostat
                            sx={{ mr: 0.5, color: "#6b8459", fontSize: 16 }}
                          />
                          <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                            Pressure: {weather.pressure} hPa
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* AI Clothing Suggestions Bulletin - Embedded */}
                    <Box
                      sx={{
                        flex: 1,
                        mt: 1,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "linear-gradient(45deg, #d4e9d4 30%, #e8f5e8 90%)",
                        border: "2px solid #8fa876",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: "bold",
                            color: "#4a5d3a",
                            fontSize: "0.8rem",
                          }}
                        >
                          🤖 AI Climate-Fit Clothing Bulletin
                        </Typography>
                        {loadingSuggestions && <CircularProgress size={12} />}
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block", fontSize: "0.65rem" }}>
                        Based on current weather conditions in {weather.location}:
                      </Typography>

                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.3, mb: 0.5 }}>
                        {clothingSuggestions.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            size="small"
                            sx={{
                              bgcolor: "#d4e9d4",
                              color: "#4a5d3a",
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        ))}
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          fontStyle: "italic",
                          color: "#6b8459",
                          display: "block",
                          textAlign: "center",
                          fontSize: "0.6rem",
                          lineHeight: 1.2,
                        }}
                      >
                        💡 These suggestions are generated by AI based on temperature (
                        {weather.temperature}°C), humidity ({weather.humidity}%), and
                        weather conditions ({weather.description})
                      </Typography>
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
