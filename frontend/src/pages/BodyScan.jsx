import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Button, Select, MenuItem, Slider, AppBar,  Toolbar, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

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
      fetchClimateOverview(locality, country, continent, `${weatherType}, ${temperature}°C`, gender, height, weight);
    } catch (error) {
      console.error("Error fetching coordinates or weather for the selected location:", error);
    }
  };

  const fetchClimateOverview = async (city, country, continent, weather, gender, height, weight) => {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Provide a brief summary of the general climate for ${city}, ${country}, located in ${continent}. 
                Format the response as follows:
                  General Climate:
                  - [Details]`,
            },
            {
              role: "user",
              content: `Current Climate:
                  - ${weather.toLowerCase().includes("rain") ? "Rainy Season" : weather.toLowerCase().includes("snow") ? "Snowy Season" : weather.toLowerCase().includes("clear") || weather.toLowerCase().includes("sunny") ? "Dry Season" : weather.toLowerCase().includes("cloud") ? "Cloudy Season" : "Unknown Season"},
                  - ${weather} [Details]`,
            },
            {
              role: "user",
              content: `Clothes Recommendations:
                  - [Details for fabric, top, bottom, etc., based on the current climate, general climate, gender (${gender}), height (${height} cm), weight (${weight} kg), body composition, and BODY TYPE. Consider fitting and proportions for the recommendations.]`,
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
    } catch (error) {
      console.error("Error fetching climate overview:", error);
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

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#2e7d32" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ClimateFit Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate("/products")}>Shop Now</Button>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: "100%", maxWidth: 1200, mb: 4 }}>
          <Box sx={{ width: "50%", maxWidth: 600, bgcolor: "#fff", borderRadius: 2, boxShadow: 3, p: 3, mr: 4 }}>
            <Box ref={mountRef} sx={{ width: "100%", height: "500px", bgcolor: "#e0e0e0", borderRadius: 2 }} />
          </Box>
          <Box sx={{ width: "30%", maxWidth: 400, bgcolor: "#fff", borderRadius: 2, boxShadow: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#2e7d32" }}>Adjust Model</Typography>
            <Select value={gender} onChange={(e) => setGender(e.target.value)} fullWidth sx={{ mb: 2 }}>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
            <Typography variant="body1" sx={{ color: "#2e7d32" }}>Height, cm</Typography>
            <Slider value={height} onChange={(e, newValue) => setHeight(newValue)} min={150} max={200} step={1} valueLabelDisplay="auto" sx={{ width: '100%', color: '#2e7d32', mb: 2 }} />
            <Typography variant="body1" sx={{ color: "#2e7d32" }}>Weight, kg</Typography>
            <Slider value={weight} onChange={(e, newValue) => setWeight(newValue)} min={50} max={100} step={1} valueLabelDisplay="auto" sx={{ width: '100%', color: '#2e7d32', mb: 2 }} />
            <Typography variant="body1" sx={{ color: "#2e7d32" }}>Location</Typography>
            <TextField
              fullWidth
              placeholder="Enter a location"
              value={selectedLocation}
              onChange={handleLocationChange}
              sx={{ mb: 2 }}
            />
            <Typography variant="body1" sx={{ color: "#2e7d32", mb: 1 }}>
              Current Location: {location}
            </Typography>
            <Typography variant="body1" sx={{ color: "#2e7d32", mb: 2 }}>
              Weather: {weather}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ width: "80%", maxWidth: 800, bgcolor: "#fff", borderRadius: 2, boxShadow: 3, p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#2e7d32" }}>General Climate</Typography>
          <Typography variant="body1" sx={{ color: "#2e7d32" }}>
            {climateOverview.split("General Climate:")[1]?.split("Current Climate:")[0]?.trim() || "Loading..."}
          </Typography>
        </Box>
        <Box sx={{ width: "80%", maxWidth: 800, bgcolor: "#fff", borderRadius: 2, boxShadow: 3, p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#2e7d32" }}>Current Climate</Typography>
          <Typography variant="body1" sx={{ color: "#2e7d32" }}>
            {climateOverview.split("Current Climate:")[1]?.split("Clothes Recommendations:")[0]?.trim() || "Loading..."}
          </Typography>
        </Box>
        <Box sx={{ width: "80%", maxWidth: 800, bgcolor: "#fff", borderRadius: 2, boxShadow: 3, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#2e7d32" }}>Clothes Recommendations</Typography>
          <Typography variant="body1" sx={{ color: "#2e7d32" }}>
            {climateOverview.split("Clothes Recommendations:")[1]?.trim() || "Loading..."}
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default BodyScan;