import React, { useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { Link as RouterLink, useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(
    () => [
      {
        label: "New Arrival",
        type: "combo",
        to: "/new-arrivals",
        badgeColor: "#E53935",
        badgeText: "New",
      },
      {
        label: "Discount",
        type: "combo",
        to: "/discounts",
        badgeColor: "#E53935",
        badgeText: "Sale",
      },
      {
        label: "Packages",
        type: "combo",
        to: "/packages",
        badgeColor: "#1A73E8",
        badgeText: "Save",
      },
      { label: "Home", type: "link", to: "/" },
      { label: "Products", type: "link", to: "/products" },
      { label: "About", type: "link", to: "/about" },
      { label: "Contact", type: "link", to: "/contact" },
    ],
    []
  );

  const handleNavClick = (item) => {
    if (item.type === "link" || item.type === "combo") {
      navigate(item.to);
    }
    setMobileOpen(false);
  };

  const highlightBadge = (badgeColor = "#E53935", text = "Hot") => (
    <span
      style={{
        backgroundColor: badgeColor,
        color: "#fff",
        fontSize: "0.65rem",
        padding: "2px 8px",
        borderRadius: 999,
        marginLeft: 8,
        textTransform: "uppercase",
      }}
    >
      {text}
    </span>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "#E0E0E0",
        color: "#FFFFFF",
        borderBottom: "1px solid rgba(255,255,255,0.25)",
        fontFamily: '"Inter","Poppins","Montserrat",sans-serif',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          py: 1,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <img
            src="/images/logo.png"
            alt="Nerd Stationery"
            style={{ height: 56, width: 56, objectFit: "contain" }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#1A1A1A", letterSpacing: 0.5 }}
          >
            Nerd Stationery
          </Typography>
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 2,
          }}
        >
          {navItems.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0.3,
              }}
            >
              <Button
                component={RouterLink}
                to={item.to}
                sx={{
                  color: "#3D3D3D",
                  textTransform: "none",
                  mx: 0,
                  fontWeight: item.type === "combo" ? 600 : 500,
                  fontSize: "0.95rem",
                  position: "relative",
                  "&:hover": {
                    color: "#820035",
                    "&::after": {
                      width: "100%",
                    },
                  },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    bottom: -6,
                    height: 2,
                    width: 0,
                    backgroundColor: "#820035",
                    transition: "width 0.2s ease",
                  },
                }}
              >
                {item.label}
                {item.type !== "link" &&
                  highlightBadge(item.badgeColor, item.badgeText)}
              </Button>
            </Box>
          ))}
          <IconButton
            aria-label="Go to cart"
            onClick={() => navigate("/cart")}
            sx={{ color: "#3D3D3D" }}
          >
            <ShoppingCartOutlinedIcon />
          </IconButton>
        </Box>

        <IconButton
          aria-label="open navigation menu"
          onClick={() => setMobileOpen(true)}
          sx={{ display: { xs: "inline-flex", md: "none" }, color: "#3D3D3D" }}
        >
          <MenuIcon />
        </IconButton>

        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{
            sx: { width: 280, backgroundColor: "#E0E0E0", paddingTop: 2, color: "#3D3D3D" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              pb: 1,
            }}
          >
            <Typography fontWeight={600} color="#3D3D3D">
              Menu
            </Typography>
            <IconButton onClick={() => setMobileOpen(false)} sx={{ color: "#3D3D3D" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.label}
                onClick={() => handleNavClick(item)}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(7,27,63,0.12)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  alignItems: "flex-start",
                  flexDirection: "column",
                  gap: 0.5,
                  color: "#3D3D3D",
                }}
              >
                <ListItemText
                  primary={
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span>{item.label}</span>
                      {item.type !== "link" &&
                        highlightBadge(item.badgeColor, item.badgeText)}
                    </span>
                  }
                />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ px: 2, py: 1 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                navigate("/cart");
                setMobileOpen(false);
              }}
              startIcon={<ShoppingCartOutlinedIcon />}
              sx={{ background: "#820035", "&:hover": { background: "#6a002a" } }}
            >
              Cart
            </Button>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
