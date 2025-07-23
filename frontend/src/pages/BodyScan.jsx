import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Button, Select, MenuItem, Slider, AppBar,  Toolbar, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useAuth } from "../contexts/AuthContext";

const BodyScan = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const [gender, setGender] = useState(user?.gender || "male");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);

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
      <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
          <TextField fullWidth placeholder="Enter your location" sx={{ mb: 2 }} />
        </Box>
      </Box>
    </>
  );
};

export default BodyScan; 