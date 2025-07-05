import React from "react";
import { Box, Typography, Button, Paper, Stack, Grid } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";


const Navigator = () => (
  <Box
    component="header"
    display="flex"
    justifyContent="space-between"
    alignItems="center"
    width="100%"
    sx={{
      px: 4,
      py: 1.5,
      backgroundColor: "#c9b190",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1100,
      boxShadow: 1,
    }}
  >
    {/* Logo and Title */}
    <Box display="flex" alignItems="center">
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#fff",
          mr: 2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src="src/assets/logo.png"
          alt="Climate Fit Logo"
          sx={{
            width: "80%",
            height: "80%",
            objectFit: "cover",
          }}
        />
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          letterSpacing: 2,
          color: "#46403d",
          
        }}
      >
        CLIMATE FIT
      </Typography>
    </Box>
    {/* Buttons */}
    <Box display="flex" alignItems="center">
      <Button
        component={Link}
        to="/login"
        variant="outlined"
        sx={{
          backgroundColor: "#f5f5dc",
          color: "#46403d",
          border: "2px solid #46403d",
          borderRadius: "20px",
          px: 3,
          py: 1,
          fontWeight: 600,
          textTransform: "none",
          mr: 1, // less margin between buttons
          "&:hover": {
            backgroundColor: "#e9e4d0",
            borderColor: "#46403d",
          },
        }}
      >
        Log In
      </Button>
      <Button
        component={Link}
        to="/register"
        variant="contained"
        sx={{
          backgroundColor: "#46403d",
          color: "#fff",
          borderRadius: "20px",
          px: 3,
          py: 1,
          fontWeight: 600,
          textTransform: "none",
          "&:hover": {
            backgroundColor: "#2d2926",
          },
        }}
      >
        Join Us
      </Button>
    </Box>
  </Box>
);



const Home = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
     <Box
      minHeight="100vh"
      sx={{
        p: 0,
        backgroundColor: "#f7ebdd",
        overflowX: "hidden",
      }}
    >
      <Navigator />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{
          pt: 10, // padding for fixed header
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            borderRadius: "32px",
            background: "#f3e5cb",
            px: 6,
            py: 4,
            boxShadow: "none",
            maxWidth: 1000,
            width: "100%",
            gap: 6,
          }}
        >
          {/* Illustration */}
          <Box
            sx={{
              minWidth: 420,
              maxWidth: 500,
              display: { xs: "none", md: "block" },
              // border: "3px solid #7e6b5a",
              borderRadius: "16px",
              p: 2,
              background: "transparent",
              overflow: "hidden",
              animation: "floatY 3s ease-in-out infinite",
            }}
          >
            <Box
              component="img"
              src="src/assets/landing-illustration.png"
              alt="Landing Illustration"
              sx={{
                width: "100%",
                height: "auto",
                borderRadius: "12px",
                background: "transparent",
                display: "block",
              }}
            />
          </Box>
          {/* Add keyframes for animation */}
          <style>
            {`
              @keyframes floatY {
                0% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
                100% { transform: translateY(0); }
              }
            `}
          </style>
          {/* Main Text */}
          <Box flex={1} textAlign="left">
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: "#46403d",
                fontSize: { xs: "2rem", md: "3rem" },
                mb: 2,
              }}
            >
              Climate Fit
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "#6d5c4d",
                mb: 3,
                fontWeight: 400,
                maxWidth: 500,
              }}
            >
              SDG 12: Responsible Consumption and Production.<br />
              Significantly reducing fashion returns, promoting sustainable materials, and encouraging the purchase of climate-appropriate wear,
            </Typography>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#3a2e25",
                color: "#fff",
                borderRadius: "20px",
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#2d221a",
                },
              }}
              endIcon={<span style={{ fontWeight: "bold" }}>{">"}</span>}
            >
              Learn More
            </Button>
          </Box>
        </Paper>
      </Box>
      <WhyChooseSection />
      <MeetOurTeamSection />
    </Box>
  );
};

const WhyChooseSection = () => (
  <Box
    sx={{
      position: "relative",
      width: "100%", 
      minHeight: "100vh", 
      background: "#c9bba5",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      pb: { xs: 10, md: 16 },
    }}
  >
    <Typography
      variant="h3"
      align="center"
      sx={{
        fontWeight: 800,
        color: "#f7ebdd",
        mb: 6,
        fontSize: { xs: "2rem", md: "3rem" },
        letterSpacing: 2,
        textShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      WHY CHOOSE OUR SITE?
    </Typography>
    <Grid
      container
      spacing={4}
      justifyContent="center"
      alignItems="stretch"
      sx={{
        maxWidth: "100%", 
        px: { xs: 0, md: 4 },
        m: 0,
      }}
    >
      {/* Card 1 */}
      <Grid item xs={12} md={4} sx={{ maxWidth: 380 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.07 }}
          whileFocus={{ scale: 1.05 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 1.0, delay: 0.2 }}
          tabIndex={0}
          sx={{
            borderRadius: "32px",
            overflow: "hidden",
            position: "relative",
            minHeight: 260,
            background: `url('src/assets/01.png') center/cover no-repeat`,
            boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            p: 3,
            height: "100%",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
              zIndex: 2,
            }}
          >
            01
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg,rgba(0,0,0,0.15) 40%,rgba(0,0,0,0.7) 100%)",
              zIndex: 1,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2 }}>
            <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
              Smart Style, Less Waste
            </Typography>
            <Typography sx={{ color: "#fff", mt: 1 }}>
              Reduce fashion returns by 68% with AI-driven, climate-aware clothing recommendations tailored to your real-time location
            </Typography>
          </Box>
        </Box>
      </Grid>
      {/* Card 2 */}
      <Grid item xs={12} md={4} sx={{ maxWidth: 380 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.07 }}
          whileFocus={{ scale: 1.05 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 1.0, delay: 0.2 }}
          tabIndex={0}
          sx={{
            borderRadius: "32px",
            overflow: "hidden",
            position: "relative",
            minHeight: 260,
            background: `url('src/assets/02.png') center/cover no-repeat`,
            boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            p: 3,
            height: "100%",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
              zIndex: 2,
            }}
          >
            02
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg,rgba(0,0,0,0.15) 40%,rgba(0,0,0,0.7) 100%)",
              zIndex: 1,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2 }}>
            <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
              Support Local, Shop Green
            </Typography>
            <Typography sx={{ color: "#fff", mt: 1 }}>
              Empower local economies and sustainable practices by exploring a marketplace championing regional brands and eco-friendly materials.
            </Typography>
          </Box>
        </Box>
      </Grid>
      {/* Card 3 */}
      <Grid item xs={12} md={4} sx={{ maxWidth: 380 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.06 }}
          whileFocus={{ scale: 1.06 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 1.0, delay: 0.2 }}
          tabIndex={0}
          sx={{
            borderRadius: "32px",
            overflow: "hidden",
            position: "relative",
            minHeight: 260,
            background: `url('src/assets/03.png') center/cover no-repeat`,
            boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            p: 3,
            height: "100%",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
              zIndex: 2,
            }}
          >
            03
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg,rgba(0,0,0,0.15) 40%,rgba(0,0,0,0.7) 100%)",
              zIndex: 1,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2 }}>
            <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
              Perfect Fit, Informed Choices
            </Typography>
            <Typography sx={{ color: "#fff", mt: 1 }}>
              Minimize waste with precise 3D body scanning, gain valuable sustainable fashion insights, and access real-time AI stylist support.
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
    <Box
      sx={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: { xs: 80, md: 120 },
        background: "#c9b190",
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  </Box>
);


const MeetOurTeamSection = () => (
  <Box
    sx={{
      width: "100%",
      minHeight: "100vh",
      background: "#f7ebdd",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      py: { xs: 8, md: 12 },
    }}
  >
    <Typography
      variant="h3"
      align="center"
      sx={{
        fontWeight: 800,
        color: "#d1a86c",
        mb: 2,
        fontSize: { xs: "2rem", md: "2.8rem" },
        letterSpacing: 2,
      }}
    >
      MEET OUR TEAM
    </Typography>
    <Typography
      align="center"
      sx={{
        color: "#b48c5a",
        mb: 6,
        maxWidth: 700,
        fontSize: { xs: "1rem", md: "1.2rem" },
      }}
    >
      Meet the innovative team of developers, designers, and climate experts committed to delivering "Climate Fit", your intelligent guide to sustainable and perfectly-suited fashion.
    </Typography>
    <Grid container spacing={4} justifyContent="center">
      <Grid item xs={12} sm={6} md={3} display="flex" flexDirection="column" alignItems="center">
        <Box
          component="img"
          src="src/assets/team-raymond.png"
          alt="Raymond Lei Nogalo"
          sx={{ width: 170, height: 170, mb: 2, borderRadius: "50%", objectFit: "cover", background: "#fff" }}
        />
        <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Raymond Lei Nogalo</Typography>
        <Typography sx={{ fontStyle: "italic", color: "#6d5c4d" }}>Creative Director</Typography>
      </Grid>
      <Grid item xs={12} sm={6} md={3} display="flex" flexDirection="column" alignItems="center">
        <Box
          component="img"
          src="src/assets/team-justine.png"
          alt="Justine Julianna Balla"
          sx={{ width: 170, height: 170, mb: 2, borderRadius: "50%", objectFit: "cover", background: "#fff" }}
        />
        <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Justine Julianna Balla</Typography>
        <Typography sx={{ fontStyle: "italic", color: "#6d5c4d" }}>Art Director</Typography>
      </Grid>
      <Grid item xs={12} sm={6} md={3} display="flex" flexDirection="column" alignItems="center">
        <Box
          component="img"
          src="src/assets/team-angel.png"
          alt="Angel Galapon"
          sx={{ width: 170, height: 170, mb: 2, borderRadius: "50%", objectFit: "cover", background: "#fff" }}
        />
        <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Angel Galapon</Typography>
        <Typography sx={{ fontStyle: "italic", color: "#6d5c4d" }}>Graphic Designer</Typography>
      </Grid>
      <Grid item xs={12} sm={6} md={3} display="flex" flexDirection="column" alignItems="center">
        <Box
          component="img"
          src="src/assets/km.png"
          alt="Kristine Mae Prado"
          sx={{ width: 170, height: 170, mb: 2, borderRadius: "50%", objectFit: "cover", background: "#fff" }}
        />
        <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Kristine Mae Prado</Typography>
        <Typography sx={{ fontStyle: "italic", color: "#6d5c4d" }}>UI/UX Designer</Typography>
      </Grid>
    </Grid>
  </Box>
);


export default Home;



