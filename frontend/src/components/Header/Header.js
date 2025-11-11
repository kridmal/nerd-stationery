import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

function Header() {
  return (
    <AppBar position="static" sx={{ backgroundColor: "#f5f5f5" }} elevation={0}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo + Title */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img
            src="/images/logo.png"
            alt="Nerd Stationery"
            style={{ height: 80, width: 80, marginRight: 16 }}
          />
          <Typography variant="h6" color="#333">
            Nerd Stationery
          </Typography>
        </Box>

        {/* Navigation Buttons */}
        <Box>
          <Button
            component={RouterLink}
            to="/"
            sx={{ color: "#333", textTransform: "none", mx: 1 }}
          >
            Home
          </Button>
          <Button
            component={RouterLink}
            to="/about"
            sx={{ color: "#333", textTransform: "none", mx: 1 }}
          >
            About
          </Button>
          <Button
            component={RouterLink}
            to="/products"
            sx={{ color: "#333", textTransform: "none", mx: 1 }}
          >
            Products
          </Button>
          <Button
            component={RouterLink}
            to="/contact"
            sx={{ color: "#333", textTransform: "none", mx: 1 }}
          >
            Contact
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
