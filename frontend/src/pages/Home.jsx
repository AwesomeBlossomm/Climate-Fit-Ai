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
      py: 2,
      backgroundColor: "#4a5d3a", // Dark green matching the image
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
        component={Link}
        to="/"
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
      >
        <Box
          component="img"
          src="src/assets/ClimateFitLogo.png"
          alt="Climate Fit Logo"
          sx={{
              width: "90px",
              height: "50px",
              objectFit: "cover",
          }}
        />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            letterSpacing: 1.5,
            color: "#ffffff",
            fontSize: "1.5rem",
          }}
        >
          CLIMATE FIT
        </Typography>
      </Box>
    </Box>
    {/* Buttons */}
    <Box display="flex" alignItems="center" gap={2}>
      <Button
        component={Link}
        to="/login"
        variant="outlined"
        sx={{
          backgroundColor: "transparent",
          color: "#ffffff",
          border: "2px solid #ffffff",
          borderRadius: "25px",
          px: 4,
          py: 1,
          fontWeight: 600,
          textTransform: "none",
          fontSize: "0.95rem",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.1)",
            borderColor: "#ffffff",
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
          backgroundColor: "#8fa876", // Light green matching the image
          color: "#ffffff",
          borderRadius: "25px",
          px: 4,
          py: 1,
          fontWeight: 600,
          textTransform: "none",
          fontSize: "0.95rem",
          "&:hover": {
            backgroundColor: "#7a956a",
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
        backgroundColor: "#f0f8f0", // Light green background matching the image
        overflowX: "hidden",
      }}
    >
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
      <Navigator />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        minHeight="100vh"
        sx={{
          pt: 10,
          px: { xs: 4, md: 8 },
          background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)", // Light green gradient matching the image
        }}
      >
        {/* Main Content Container */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: 1400,
            width: "100%",
            mx: "auto",
            position: "relative",
            minHeight: "80vh",
          }}
        >
          {/* Left Content - Hero Image */}
          <Box
            sx={{
              position: "absolute",
              left: { xs: "50%", md: "5%" },
              top: "50%",
              transform: { xs: "translate(-50%, -50%)", md: "translateY(-50%)" },
              width: { xs: "80%", md: "55%" },
              maxWidth: 650,
              zIndex: 1,
            }}
          >
            <Box
              component="img"
              src="src/assets/ClimateFitLogo.png"
              alt="Climate Fit Illustration"
              sx={{
                width: "100%",
                height: "auto",
                animation: "floatY 3s ease-in-out infinite",
                filter: "drop-shadow(0 20px 40px rgba(74, 93, 58, 0.2))",
              }}
            />
          </Box>

          {/* Right Content - Description with Green Background (Overlapping) */}
          <Box 
            sx={{ 
              position: "absolute",
              right: { xs: "50%", md: "5%" },
              top: "50%",
              transform: { xs: "translate(50%, -50%)", md: "translateY(-50%)" },
              width: { xs: "90%", md: "50%" },
              maxWidth: 550,
              background: "#4a5d3a",
              borderRadius: "32px",
              p: { xs: 4, md: 5 },
              boxShadow: "0 20px 60px rgba(74, 93, 58, 0.4)",
              zIndex: 3,
              textAlign: { xs: "center", md: "left" },
              ml: { xs: 0, md: "-100px" }, // Negative margin to create overlap
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                color: "#ffffff",
                fontSize: { xs: "2.5rem", md: "4rem" },
                mb: 3,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Climate Fit
            </Typography>
            
            <Typography
              variant="h5"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                mb: 4,
                fontWeight: 400,
                fontSize: { xs: "1rem", md: "1.2rem" },
                lineHeight: 1.5,
              }}
            >
              SDG 12: Responsible Consumption and Production.
              Significantly reducing fashion returns, promoting sustainable
              materials and encouraging the purchase
              of climate-appropriate wear,
            </Typography>
            
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#8fa876",
                color: "#ffffff",
                borderRadius: "30px",
                px: 6,
                py: 2,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1.1rem",
                boxShadow: "0 4px 20px rgba(143, 168, 118, 0.3)",
                "&:hover": {
                  backgroundColor: "#7a956a",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 25px rgba(143, 168, 118, 0.4)",
                },
                transition: "all 0.3s ease",
              }}
              endIcon={<span style={{ fontSize: "1.2rem" }}>{">"}</span>}
            >
              LEARN MORE
            </Button>
          </Box>
        </Box>
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
      background: "linear-gradient(135deg, #8fa876 0%, #7a956a 100%)", // Clean green gradient matching the image
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      py: { xs: 8, md: 12 },
      px: { xs: 2, md: 4 },
    }}
  >
    <Typography
      variant="h2"
      align="center"
      sx={{
        fontWeight: 800,
        color: "#ffffff",
        mb: 8,
        fontSize: { xs: "2.5rem", md: "3.5rem" },
        letterSpacing: 2,
        textShadow: "0 2px 10px rgba(0,0,0,0.2)",
      }}
    >
      WHY CHOOSE OUR SITE?
    </Typography>
    
    <Grid
      container
      spacing={3}
      justifyContent="center"
      alignItems="stretch"
      sx={{
        maxWidth: 1200,
        width: "100%",
        flexWrap: "nowrap", // Prevent wrapping to keep all cards in one line
      }}
    >
      {/* Card 1 */}
      <Grid item xs={4} sx={{ minWidth: 0 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileFocus={{ scale: 1.02 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          tabIndex={0}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative",
            height: 250,
            background: `url('src/assets/01.png') center/cover no-repeat`,
            boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            cursor: "pointer",
            outline: "none",
            "&:hover": {
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              zIndex: 2,
            }}
          >
            01
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)",
              zIndex: 1,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2, p: 2.5 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: "#fff", 
                fontWeight: 700,
                mb: 1,
                fontSize: "1.1rem",
              }}
            >
              Smart Style, Less Waste
            </Typography>
            <Typography 
              sx={{ 
                color: "rgba(255,255,255,0.9)", 
                fontSize: "0.85rem",
                lineHeight: 1.4,
              }}
            >
              Reduce fashion returns by 68% with AI-driven, climate-aware
              clothing recommendations tailored to your real-time location
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* Card 2 */}
      <Grid item xs={4} sx={{ minWidth: 0 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileFocus={{ scale: 1.02 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          tabIndex={0}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative",
            height: 250,
            background: `url('src/assets/02.png') center/cover no-repeat`,
            boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            cursor: "pointer",
            outline: "none",
            "&:hover": {
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              zIndex: 2,
            }}
          >
            02
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)",
              zIndex: 1,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2, p: 2.5 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: "#fff", 
                fontWeight: 700,
                mb: 1,
                fontSize: "1.1rem",
              }}
            >
              Support Local, Shop Green
            </Typography>
            <Typography 
              sx={{ 
                color: "rgba(255,255,255,0.9)", 
                fontSize: "0.85rem",
                lineHeight: 1.4,
              }}
            >
              Empower local economies and sustainable practices by exploring a
              marketplace championing regional brands and eco-friendly
              materials.
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* Card 3 */}
      <Grid item xs={4} sx={{ minWidth: 0 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileFocus={{ scale: 1.02 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          tabIndex={0}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative",
            height: 250,
            background: `url('src/assets/03.png') center/cover no-repeat`,
            boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            cursor: "pointer",
            outline: "none",
            "&:hover": {
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              zIndex: 2,
            }}
          >
            03
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)",
              zIndex: 1,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2, p: 2.5 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: "#fff", 
                fontWeight: 700,
                mb: 1,
                fontSize: "1.1rem",
              }}
            >
              Perfect Fit, Informed Choices
            </Typography>
            <Typography 
              sx={{ 
                color: "rgba(255,255,255,0.9)", 
                fontSize: "0.85rem",
                lineHeight: 1.4,
              }}
            >
              Minimize waste with precise 3D body scanning, gain valuable
              sustainable fashion insights, and access real-time AI stylist
              support.
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  </Box>
);

const MeetOurTeamSection = () => (
  <Box
    sx={{
      width: "100%",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #e8f5e8 0%, #d4e9d4 100%)", // Light green gradient matching the image
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      py: { xs: 8, md: 12 },
      px: { xs: 2, md: 4 },
    }}
  >
    <Typography
      variant="h2"
      align="center"
      sx={{
        fontWeight: 800,
        color: "#2d3d2d", // Dark green/black text matching the image
        mb: 3,
        fontSize: { xs: "2.5rem", md: "3.5rem" },
        letterSpacing: 2,
      }}
    >
      MEET OUR TEAM
    </Typography>
    <Typography
      align="center"
      sx={{
        color: "#4a5d4a", // Darker green for subtitle
        mb: 8,
        maxWidth: 800,
        fontSize: { xs: "1.1rem", md: "1.3rem" },
        lineHeight: 1.6,
        fontWeight: 400,
      }}
    >
      Meet the innovative team of developers, designers, and climate experts
      committed to delivering "Climate Fit," your intelligent guide to
      sustainable and perfectly-suited fashion.
    </Typography>
    
    <Grid 
      container 
      spacing={6} 
      justifyContent="center"
      alignItems="center"
      sx={{
        maxWidth: 1200,
        width: "100%",
      }}
    >
      <Grid
        item
        xs={12}
        sm={6}
        md={3}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            component="img"
            src="src/assets/team-raymond.jpg"
            alt="Raymond Lei Nogalo"
            sx={{
              width: 180,
              height: 180,
              mb: 3,
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid #ffffff",
              boxShadow: "0 8px 24px rgba(74, 93, 58, 0.15)",
            }}
          />
          <Typography 
            sx={{ 
              fontWeight: 700, 
              fontSize: "1.3rem",
              color: "#2d3d2d",
              mb: 0.5,
            }}
          >
            Raymond Lei Nogalo
          </Typography>
          <Typography 
            sx={{ 
              fontStyle: "italic", 
              color: "#6d7d6d",
              fontSize: "1rem",
            }}
          >
            Mobile App Developer
          </Typography>
        </Box>
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        md={3}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            component="img"
            src="src/assets/team-justine.jpg"
            alt="Justine Julianna Balla"
            sx={{
              width: 180,
              height: 180,
              mb: 3,
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid #ffffff",
              boxShadow: "0 8px 24px rgba(74, 93, 58, 0.15)",
            }}
          />
          <Typography 
            sx={{ 
              fontWeight: 700, 
              fontSize: "1.3rem",
              color: "#2d3d2d",
              mb: 0.5,
            }}
          >
            Justine Julianna Balla
          </Typography>
          <Typography 
            sx={{ 
              fontStyle: "italic", 
              color: "#6d7d6d",
              fontSize: "1rem",
            }}
          >
            Website developer
          </Typography>
        </Box>
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        md={3}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            component="img"
            src="src/assets/team-angel.jpg"
            alt="Angel Galapon"
            sx={{
              width: 180,
              height: 180,
              mb: 3,
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid #ffffff",
              boxShadow: "0 8px 24px rgba(74, 93, 58, 0.15)",
            }}
          />
          <Typography 
            sx={{ 
              fontWeight: 700, 
              fontSize: "1.3rem",
              color: "#2d3d2d",
              mb: 0.5,
            }}
          >
            Angel Galapon
          </Typography>
          <Typography 
            sx={{ 
              fontStyle: "italic", 
              color: "#6d7d6d",
              fontSize: "1rem",
            }}
          >
            Tech Writter
          </Typography>
        </Box>
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        md={3}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            component="img"
            src="src/assets/km.png"
            alt="Kristine Mae Prado"
            sx={{
              width: 180,
              height: 180,
              mb: 3,
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid #ffffff",
              boxShadow: "0 8px 24px rgba(74, 93, 58, 0.15)",
            }}
          />
          <Typography 
            sx={{ 
              fontWeight: 700, 
              fontSize: "1.3rem",
              color: "#2d3d2d",
              mb: 0.5,
            }}
          >
            Kristine Mae Prado
          </Typography>
          <Typography 
            sx={{ 
              fontStyle: "italic", 
              color: "#6d7d6d",
              fontSize: "1rem",
            }}
          >
            UI/UX Designer
          </Typography>
        </Box>
      </Grid>
    </Grid>
  </Box>
);

export default Home;
