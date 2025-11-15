import React, { useCallback, useMemo, useState } from "react";
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
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollOrNavigate = useCallback(
    (sectionId, stateKey) => {
      if (location.pathname === "/") {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        navigate("/", { state: { scrollTo: stateKey } });
      }
    },
    [location.pathname, navigate]
  );

  const showComboLayout = location.pathname !== "/products";

  const navItems = useMemo(
    () => [
      {
        label: "New Arrival",
        type: "combo",
        to: "/new-arrivals",
        quickDetour: {
          sectionId: "new-arrivals-section",
          stateKey: "new-arrivals",
          label: "Quick Detour",
        },
        badgeColor: "#E53935",
        badgeText: "New",
      },
      {
        label: "Discount",
        type: "combo",
        to: "/discounts",
        quickDetour: {
          sectionId: "discounts-section",
          stateKey: "discounts",
          label: "Quick Detour",
        },
        badgeColor: "#E53935",
        badgeText: "Sale",
      },
      {
        label: "Packages",
        type: "combo",
        to: "/packages",
        quickDetour: {
          sectionId: "packages-section",
          stateKey: "packages",
          label: "Quick Detour",
        },
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

  const handleQuickDetour = (quickDetour) => {
    if (!quickDetour) return;
    scrollOrNavigate(quickDetour.sectionId, quickDetour.stateKey);
    setMobileOpen(false);
  };

  const handleNavClick = (item) => {
    if (item.type === "link" || item.type === "combo") {
      navigate(item.to);
    } else if (item.type === "section") {
      scrollOrNavigate(item.sectionId, item.stateKey);
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
        backgroundColor: "#FFFFFF",
        color: "#333333",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
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
            alignItems: showComboLayout ? "stretch" : "center",
            gap: showComboLayout ? 2 : 1,
          }}
        >
          {navItems.map((item) =>
            item.type === "combo" && showComboLayout ? (
              <Box
                key={item.label}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.4,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  border: "1px solid rgba(26,115,232,0.15)",
                  boxShadow: "0 8px 20px rgba(26,115,232,0.08)",
                  backgroundColor: "#fff",
                  minWidth: 150,
                }}
              >
                <Button
                  onClick={() => handleNavClick(item)}
                  sx={{
                    color: "#333",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    position: "relative",
                    "&:hover": {
                      color: "#1A73E8",
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
                      backgroundColor: "#1A73E8",
                      transition: "width 0.2s ease",
                    },
                  }}
                >
                  {item.label}
                  {highlightBadge(item.badgeColor, item.badgeText)}
                </Button>
                {item.quickDetour && (
                  <Button
                    size="small"
                    onClick={() => handleQuickDetour(item.quickDetour)}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.7rem",
                      color: "#1A73E8",
                      fontWeight: 600,
                      alignSelf: "center",
                      px: 0,
                      py: 0,
                      minWidth: "auto",
                    }}
                  >
                    {item.quickDetour.label}
                  </Button>
                )}
              </Box>
            ) : (
              <Button
                key={item.label}
                component={RouterLink}
                to={item.to}
                sx={{
                  color: "#333",
                  textTransform: "none",
                  mx: 1,
                  fontWeight: item.type === "combo" ? 600 : 500,
                  fontSize: "0.95rem",
                  position: "relative",
                  "&:hover": {
                    color: "#1A73E8",
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
                    backgroundColor: "#1A73E8",
                    transition: "width 0.2s ease",
                  },
                }}
              >
                {item.label}
                {item.type !== "link" &&
                  highlightBadge(item.badgeColor, item.badgeText)}
              </Button>
            )
          )}
        </Box>

        <IconButton
          aria-label="open navigation menu"
          onClick={() => setMobileOpen(true)}
          sx={{ display: { xs: "inline-flex", md: "none" }, color: "#333" }}
        >
          <MenuIcon />
        </IconButton>

        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{
            sx: { width: 280, backgroundColor: "#FFFFFF", paddingTop: 2 },
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
            <Typography fontWeight={600}>Menu</Typography>
            <IconButton onClick={() => setMobileOpen(false)}>
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
                  border:
                    item.type === "combo" && showComboLayout
                      ? "1px solid rgba(26,115,232,0.2)"
                      : "1px solid transparent",
                  boxShadow:
                    item.type === "combo" && showComboLayout
                      ? "0 8px 18px rgba(26,115,232,0.12)"
                      : "none",
                  alignItems: "flex-start",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <ListItemText
                  primary={
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <span>{item.label}</span>
                      {item.type !== "link" &&
                        highlightBadge(item.badgeColor, item.badgeText)}
                    </span>
                  }
                />
                {item.quickDetour && showComboLayout && (
                  <Button
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleQuickDetour(item.quickDetour);
                    }}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.75rem",
                      color: "#1A73E8",
                      p: 0,
                      minWidth: "auto",
                      fontWeight: 600,
                      alignSelf: "center",
                    }}
                  >
                    {item.quickDetour.label}
                  </Button>
                )}
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
