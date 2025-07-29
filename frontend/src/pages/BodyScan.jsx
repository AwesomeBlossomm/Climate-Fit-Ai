import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Button, Select, MenuItem, Slider, TextField, IconButton, Grid } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useAuth } from "../contexts/AuthContext";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

const BodyScan = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const [gender, setGender] = useState(user?.gender || "male");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [climateOverview, setClimateOverview] = useState("");
  const [productRecommendations, setProductRecommendations] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    const loader = new GLTFLoader();
    loader.load(`/src/assets/3DModels/${gender}/${gender}.gltf`, (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      scene.add(model);

      // Set camera position based on gender
      if (gender === "male") {
        camera.position.set(0, 0.5, 2);
        model.position.set(0, 0, 0);
      } else {
        camera.position.set(0, 0.5, 2);
        model.position.set(0, -1, 0);
      }

      const animate = function () {
        requestAnimationFrame(animate);
        model.scale.set(weight / 70, height / 170, weight / 70);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    });

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [gender, height, weight]);

  const fetchWeatherData = async (latitude, longitude) => {
    try {
      // Fetch location details using OpenCage Geocoder
      const locationResponse = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=11e5b381c9044da4bf265856b677886e`
      );
      const components = locationResponse.data.results[0].components;

      const continent = components.continent || "Unknown Continent";
      const locality = components.town || components.city || components.village || "Unknown Locality";
      const country = components.country || "Unknown Country";

      // Combine details into a formatted string
      setLocation(`${locality}, ${country}, ${continent}`);

      // Fetch weather details using WeatherAPI
      const weatherResponse = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=bd230479f01a45ca8ae41503252407&q=${latitude},${longitude}`
      );
      const weatherType = weatherResponse.data.current.condition.text;
      const temperature = weatherResponse.data.current.temp_c;
      setWeather(`${weatherType}, ${temperature}°C`);
    } catch (error) {
      console.error("Error fetching location or weather data:", error);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherData(latitude, longitude);
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleLocationChange = async (event) => {
    const newLocation = event.target.value;
    setSelectedLocation(newLocation);

    try {
      const geocodeResponse = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(newLocation)}&key=11e5b381c9044da4bf265856b677886e`
      );
      const { lat, lng } = geocodeResponse.data.results[0].geometry;

      // Fetch weather data and update location
      const weatherResponse = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=bd230479f01a45ca8ae41503252407&q=${lat},${lng}`
      );
      const weatherType = weatherResponse.data.current.condition.text;
      const temperature = weatherResponse.data.current.temp_c;
      const components = geocodeResponse.data.results[0].components;

      const continent = components.continent || "Unknown Continent";
      const locality = components.town || components.city || components.village || "Unknown Locality";
      const country = components.country || "Unknown Country";

      const formattedLocation = `${locality}, ${country}, ${continent}`;
      setLocation(formattedLocation);
      setWeather(`${weatherType}, ${temperature}°C`);

      // Fetch climate overview immediately after weather and location update
      fetchClimateOverview(locality, country, continent, gender, height, weight);
    } catch (error) {
      console.error("Error fetching coordinates or weather for the selected location:", error);
    }
  };

  const determineSeason = (month, country) => {
    const northernHemisphereSeasons = [
      "Winter", "Winter", "Spring", "Spring", "Spring", "Summer", "Summer", "Summer", "Autumn", "Autumn", "Autumn", "Winter"
    ];
    const southernHemisphereSeasons = [
      "Summer", "Summer", "Autumn", "Autumn", "Autumn", "Winter", "Winter", "Winter", "Spring", "Spring", "Spring", "Summer"
    ];

    // Special case for countries with unique seasonal patterns
    const tropicalCountries = {
      "Philippines": ["Summer", "Summer", "Summer", "Summer", "Summer", "Rainy", "Rainy", "Rainy", "Rainy", "Rainy", "Rainy", "Summer"],
    };

    if (tropicalCountries[country]) {
      return tropicalCountries[country][month];
    }

    // Default to hemisphere-based seasons
    const southernHemisphereContinents = ["Australia", "South America", "Africa", "Oceania"];
    const isSouthernHemisphere = southernHemisphereContinents.some((hemisphere) => country.includes(hemisphere));

    const seasons = isSouthernHemisphere ? southernHemisphereSeasons : northernHemisphereSeasons;
    return seasons[month];
  };

  const fetchProductRecommendations = async (season) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/products?season=${encodeURIComponent(season)}`);
      return response.data.products || [];
    } catch (error) {
      console.error("Error fetching product recommendations:", error);
      return [];
    }
  };

  const fetchClimateOverview = async (city, country, continent, gender, height, weight) => {
    try {
      const currentMonth = new Date().getMonth(); // 0 = January, 11 = December
      const currentSeason = determineSeason(currentMonth, country);

      const seasonClothingRecommendations = {
        "Winter": "Wear warm layers such as wool sweaters, thermal pants, and insulated jackets. Accessories like scarves, gloves, and beanies are essential. Materials: wool, fleece, down.",
        "Spring": "Opt for light layers such as cardigans, long-sleeve shirts, and jeans. Comfortable sneakers or flats are ideal. Materials: cotton, light denim, polyester blends.",
        "Summer": "Choose breathable fabrics like cotton or linen. T-shirts, shorts, and sundresses are perfect. Don’t forget sunglasses and hats. Materials: cotton, linen, rayon.",
        "Autumn": "Go for cozy sweaters, light jackets, and boots. Earth-tone colors are popular during this season. Materials: wool, corduroy, flannel.",
        "Dry Season": "Light and breathable clothing such as cotton shirts and shorts are ideal. Hats and sunglasses can help with the sun. Materials: cotton, linen, synthetic blends.",
        "Wet Season": "Water-resistant jackets, boots, and umbrellas are essential. Avoid fabrics that soak easily, like cotton. Materials: polyester, nylon, waterproof fabrics.",
      };

      const clothesRecommendation = seasonClothingRecommendations[currentSeason] || "No specific recommendation available.";

      const productRecommendations = await fetchProductRecommendations(currentSeason);

      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Provide a brief summary of the general seasons for ${city}, ${country}, located in ${continent}. 
                Format the response as follows:
                  General Season:
                  - [Details about the seasons the country experiences]`,
            },
            {
              role: "user",
              content: `Current Season:
                  - ${currentSeason} [Details about the current season based on the location and month]`,
            },
            {
              role: "user",
              content: `Clothes Recommendations:
                  - ${clothesRecommendation}`,
            },
            {
              role: "user",
              content: `Product Recommendations:
                  - ${productRecommendations.join(", ")}`,
            },
          ],
        },
        {
          headers: {
            Authorization: "Bearer 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",
            "Content-Type": "application/json",
          },
        }
      );

      const overview = response.data.choices[0].message.content;
      setClimateOverview(overview);
      setProductRecommendations(productRecommendations); // Update product recommendations state
    } catch (error) {
      console.error("Error fetching season overview:", error);
    }
  };

  useEffect(() => {
    if (location && weather) {
      const [city, country, continent] = location.split(", ");
      fetchClimateOverview(city, country, continent, weather, gender, height, weight);
    }
  }, [location, weather, gender, height, weight]);

  useEffect(() => {
    if (weather) {
      const weatherType = weather.split(",")[0].toLowerCase();

      // Adjust background color based on weather type
      const sceneBackground = {
        clear: "#87CEEB", // Light blue for clear weather
        clouds: "#B0C4DE", // Light gray for cloudy weather
        rain: "#708090", // Dark gray for rainy weather
        snow: "#F0F8FF", // White for snowy weather
      }[weatherType] || "#FFFFFF"; // Default to white

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(sceneBackground);
    }
  }, [weather]);

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [...chatMessages, userMessage],
        },
        {
          headers: {
            Authorization: "Bearer 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",
            "Content-Type": "application/json",
          },
        }
      );

      const botMessage = {
        role: "assistant",
        content: response.data.choices[0].message.content,
      };
      setChatMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error communicating with chatbot:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again later.",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <>
      <Box
        component="header"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        sx={{
          px: 4,
          py: 2,
          backgroundColor: "#4a5d3a", // Dark green matching Dashboard.jsx
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1100,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* Logo and Title */}
        <Box display="flex" alignItems="center">
          <Box
            display="flex"
            alignItems="center"
            sx={{
              textDecoration: "none",
              cursor: "pointer",
              "&:hover": {
                opacity: 0.9,
              },
              transition: "opacity 0.2s ease",
            }}
            onClick={() => navigate("/dashboard")}
          >
            <Box
              component="img"
              src="src/assets/ClimateFitLogo.png"
              alt="Climate Fit Logo"
              sx={{
                width: "50px",
                height: "30px",
                objectFit: "cover",
                mr: 2,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 1.5,
                color: "#ffffff",
                fontSize: "1.2rem",
              }}
            >
              3D BODY SCAN
            </Typography>
          </Box>
        </Box>

        {/* Header Actions */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            onClick={() => navigate("/products")}
            variant="outlined"
            sx={{
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "2px solid #ffffff",
              borderRadius: "25px",
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.9rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#ffffff",
              },
            }}
          >
            Shop Now
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            sx={{
              backgroundColor: "#8fa876", // Light green matching Dashboard.jsx
              color: "#ffffff",
              borderRadius: "25px",
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.9rem",
              "&:hover": {
                backgroundColor: "#7a956a",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>
      {/* Main Content with Dashboard.jsx background */}
      <Box sx={{ 
        pt: 12, // Account for fixed header height
        mt: 10, // Add top margin for extra spacing
        minHeight: "100vh",
        backgroundColor: "#f0f8f0", // Light green background matching Dashboard.jsx
        background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)", // Light green gradient matching Dashboard.jsx
        px: { xs: 2, md: 4 },
        py: 4,
      }}>
        {/* 3D Model and Controls Section */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: "100%", maxWidth: 1400, mx: 'auto', mb: 4, gap: 4 }}>
          {/* 3D Model Container */}
          <Box sx={{ 
            width: "30%", 
            maxWidth: 600, 
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
            p: 3,
            border: "1px solid rgba(74, 93, 58, 0.1)"
          }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#4a5d3a",
                mb: 3,
                textAlign: "center",
                fontSize: "1.5rem",
                letterSpacing: 1
              }}
            >
              🧍 3D Avatar Preview
            </Typography>
            <Box ref={mountRef} sx={{ 
              width: "100%", 
              height: "500px", 
              bgcolor: "#f8fdf8", 
              borderRadius: "16px",
              border: "2px solid rgba(74, 93, 58, 0.1)",
              overflow: "hidden"
            }} />
          </Box>

          {/* Controls Container */}
          <Box sx={{ 
            width: "30%", 
            maxWidth: 400, 
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
            p: 3,
            border: "1px solid rgba(74, 93, 58, 0.1)"
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                color: "#4a5d3a",
                fontWeight: 700,
                fontSize: "1.3rem",
                textAlign: "center"
              }}
            >
              ⚙️ Model Settings
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ color: "#4a5d3a", mb: 1, fontWeight: 600 }}>Gender</Typography>
              <Select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)} 
                fullWidth 
                sx={{ 
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(74, 93, 58, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4a5d3a',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4a5d3a',
                  },
                }}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ color: "#4a5d3a", mb: 1, fontWeight: 600 }}>Height: {height} cm</Typography>
              <Slider 
                value={height} 
                onChange={(e, newValue) => setHeight(newValue)} 
                min={150} 
                max={200} 
                step={1} 
                valueLabelDisplay="auto" 
                sx={{ 
                  width: '100%', 
                  color: '#4a5d3a',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#4a5d3a',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#4a5d3a',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: 'rgba(74, 93, 58, 0.3)',
                  },
                }} 
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ color: "#4a5d3a", mb: 1, fontWeight: 600 }}>Weight: {weight} kg</Typography>
              <Slider 
                value={weight} 
                onChange={(e, newValue) => setWeight(newValue)} 
                min={50} 
                max={100} 
                step={1} 
                valueLabelDisplay="auto" 
                sx={{ 
                  width: '100%', 
                  color: '#4a5d3a',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#4a5d3a',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#4a5d3a',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: 'rgba(74, 93, 58, 0.3)',
                  },
                }} 
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ color: "#4a5d3a", mb: 1, fontWeight: 600 }}>Location</Typography>
              <TextField
                fullWidth
                placeholder="Enter a location"
                value={selectedLocation}
                onChange={handleLocationChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: 'rgba(74, 93, 58, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#4a5d3a',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4a5d3a',
                    },
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                backgroundColor: "rgba(74, 93, 58, 0.1)",
                borderRadius: "12px",
                p: 2,
                mb: 2,
              }}
            >
              <Typography variant="body2" sx={{ color: "#4a5d3a", fontWeight: 600, fontSize: '0.8rem' }}>
                📍 Current Location
              </Typography>
              <Typography variant="body2" sx={{ color: "#2c3e2c", fontSize: '0.85rem' }}>
                {location || "Loading..."}
              </Typography>
            </Box>

            <Box
              sx={{
                backgroundColor: "rgba(74, 93, 58, 0.1)",
                borderRadius: "12px",
                p: 2,
              }}
            >
              <Typography variant="body2" sx={{ color: "#4a5d3a", fontWeight: 600, fontSize: '0.8rem' }}>
                🌤️ Current Weather
              </Typography>
              <Typography variant="body2" sx={{ color: "#2c3e2c", fontSize: '0.85rem' }}>
                {weather || "Loading..."}
              </Typography>
            </Box>
          </Box>
        </Box>
        {/* Climate Information Cards */}
        <Box sx={{ maxWidth: 1400, mx: 'auto', mb: 4 }}>
          <Grid container spacing={3}>
            {/* General Season Card */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                background: "#ffffff",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                p: 4,
                border: "1px solid rgba(74, 93, 58, 0.1)",
                height: "100%"
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    color: "#4a5d3a",
                    fontWeight: 700,
                    fontSize: "1.3rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  🌍 General Season
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: "#2c3e2c",
                    lineHeight: 1.6,
                    fontSize: "0.95rem"
                  }}
                >
                  {climateOverview.split("General Season:")[1]?.split("Current Season:")[0]?.trim() || "Loading climate information..."}
                </Typography>
              </Box>
            </Grid>

            {/* Current Season Card */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                background: "#ffffff",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
                p: 4,
                border: "1px solid rgba(74, 93, 58, 0.1)",
                height: "100%"
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    color: "#4a5d3a",
                    fontWeight: 700,
                    fontSize: "1.3rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  📅 Current Season
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: "#2c3e2c",
                    lineHeight: 1.6,
                    fontSize: "0.95rem"
                  }}
                >
                  {climateOverview.split("Current Season:")[1]?.split("Clothes Recommendations:")[0]?.trim() || "Loading current season info..."}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Clothes Recommendations Card */}
        <Box sx={{ maxWidth: 1400, mx: 'auto', mb: 4 }}>
          <Box sx={{ 
            background: "linear-gradient(135deg, #4a5d3a 0%, #5c7349 100%)",
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(74, 93, 58, 0.25)",
            p: 4,
            color: "#ffffff"
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                fontWeight: 700,
                fontSize: "1.3rem",
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              👕 Clothes Recommendations
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                lineHeight: 1.6,
                fontSize: "0.95rem",
                color: "rgba(255, 255, 255, 0.95)"
              }}
            >
              {climateOverview.split("Clothes Recommendations:")[1]?.trim() || "Loading clothing recommendations..."}
            </Typography>
          </Box>
        </Box>

        {/* Product Recommendations Card */}
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Box sx={{ 
            background: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(74, 93, 58, 0.15)",
            p: 4,
            border: "1px solid rgba(74, 93, 58, 0.1)"
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                color: "#4a5d3a",
                fontWeight: 700,
                fontSize: "1.3rem",
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              🛍️ Product Recommendations
            </Typography>
            {Array.isArray(productRecommendations) && productRecommendations.length > 0 ? (
              <Grid container spacing={3}>
                {productRecommendations.map((product) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                    <Box 
                      sx={{ 
                        border: '2px solid rgba(74, 93, 58, 0.1)',
                        borderRadius: "16px",
                        p: 3,
                        bgcolor: '#f8fdf8',
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: "#4a5d3a",
                          boxShadow: "0 8px 25px rgba(74, 93, 58, 0.15)",
                          transform: "translateY(-2px)"
                        }
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: '#4a5d3a', 
                          fontWeight: 700,
                          mb: 2,
                          fontSize: "1rem"
                        }}
                      >
                        {product.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#2c3e2c',
                          mb: 2,
                          flex: 1,
                          fontSize: "0.85rem",
                          lineHeight: 1.4
                        }}
                      >
                        {product.description}
                      </Typography>
                      <Box sx={{ mt: "auto" }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#6b8459',
                            mb: 1,
                            fontSize: "0.8rem",
                            fontWeight: 600
                          }}
                        >
                          Category: {product.category}
                        </Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#4a5d3a',
                            fontWeight: 700,
                            fontSize: "1.1rem"
                          }}
                        >
                          ₱{product.price_php}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: "#6b8459"
                }}
              >
                <Typography variant="body1" sx={{ fontSize: "0.95rem" }}>
                  No product recommendations found for your current location.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {/* Chat toggle button */}
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={() => setIsChatOpen((prev) => !prev)}
          sx={{
            bgcolor: "#4a5d3a",
            color: "#fff",
            width: 64,
            height: 64,
            borderRadius: "50%",
            boxShadow: "0 8px 25px rgba(74, 93, 58, 0.3)",
            "&:hover": {
              bgcolor: "#3a4d2a",
              boxShadow: "0 12px 35px rgba(74, 93, 58, 0.4)",
              transform: "translateY(-2px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ChatBubbleOutlineIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>

      {/* Chat window */}
      {isChatOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 110,
            right: 24,
            width: 420,
            maxHeight: 520,
            background: "#ffffff",
            boxShadow: "0 20px 40px rgba(74, 93, 58, 0.2)",
            borderRadius: "20px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid rgba(74, 93, 58, 0.1)",
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #4a5d3a 0%, #5c7349 100%)",
              color: "#fff",
              p: 3,
              textAlign: "center",
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1
              }}
            >
              🤖 Clothing Assistant
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "0.85rem",
                mt: 0.5
              }}
            >
              Ask me about sustainable fashion
            </Typography>
          </Box>
          
          {/* Chat Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              background: "linear-gradient(135deg, #f8fdf8 0%, #ffffff 100%)",
              maxHeight: "350px",
            }}
          >
            {chatMessages.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: "#6b8459"
                }}
              >
                <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                  👋 Hello! I'm here to help you with clothing recommendations based on your location and weather.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.85rem", mt: 1, color: "#8fa876" }}>
                  Try asking: "What should I wear today?" or "Recommend sustainable fabrics"
                </Typography>
              </Box>
            ) : (
              chatMessages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                    bgcolor: message.role === "user" 
                      ? "linear-gradient(135deg, #4a5d3a 0%, #5c7349 100%)"
                      : "rgba(74, 93, 58, 0.1)",
                    color: message.role === "user" ? "#000000" : "#2c3e2c", // Changed from "#ffffff" to "#000000"
                    p: 2.5,
                    borderRadius: message.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    maxWidth: "80%",
                    boxShadow: message.role === "user" 
                      ? "0 4px 15px rgba(74, 93, 58, 0.3)"
                      : "0 2px 10px rgba(74, 93, 58, 0.1)",
                    border: message.role === "user" ? "none" : "1px solid rgba(74, 93, 58, 0.1)",
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: "0.9rem",
                      lineHeight: 1.4,
                      fontWeight: message.role === "user" ? 500 : 400
                    }}
                  >
                    {message.content}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
          
          {/* Chat Input */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 2,
              borderTop: "1px solid rgba(74, 93, 58, 0.1)",
              background: "#ffffff",
            }}
          >
            <TextField
              fullWidth
              placeholder="Ask me about clothes..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleChatSubmit();
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '25px',
                  pr: 1,
                  '& fieldset': {
                    borderColor: 'rgba(74, 93, 58, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#4a5d3a',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4a5d3a',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.9rem',
                },
              }}
            />
            <IconButton 
              onClick={handleChatSubmit}
              sx={{
                ml: 1,
                bgcolor: "#4a5d3a",
                color: "#ffffff",
                width: 44,
                height: 44,
                "&:hover": {
                  bgcolor: "#3a4d2a",
                  boxShadow: "0 4px 15px rgba(74, 93, 58, 0.3)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <SendIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  );
};

export default BodyScan;