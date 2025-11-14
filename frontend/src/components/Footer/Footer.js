import React from "react";
import { Box, Typography, Stack, Link as MuiLink } from "@mui/material";
import facebookIcon from "../../assets/facebook.png";
import instagramIcon from "../../assets/instagram.png";
import whatsappIcon from "../../assets/whatsapp.png";

const socialLinks = [
  { href: "https://facebook.com", icon: facebookIcon, label: "Facebook" },
  { href: "https://instagram.com", icon: instagramIcon, label: "Instagram" },
  { href: "https://wa.me/1234567890", icon: whatsappIcon, label: "WhatsApp" },
];

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#1F1F1F",
        color: "#CCCCCC",
        textAlign: "center",
        py: 4,
        px: 2,
        mt: 6,
      }}
    >
      <Stack
        direction="row"
        spacing={3}
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        sx={{ mb: 2 }}
      >
        {socialLinks.map((item) => (
          <MuiLink
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.3)",
              transition: "transform 0.2s ease, border 0.2s ease",
              "&:hover": {
                transform: "scale(1.08)",
                borderColor: "#FFFFFF",
              },
            }}
          >
            <img
              src={item.icon}
              alt={item.label}
              style={{ width: 26, height: 26 }}
            />
          </MuiLink>
        ))}
      </Stack>
      <Typography variant="body2">
        © 2025 Nerd Stationery. All rights reserved.
      </Typography>
    </Box>
  );
}

export default Footer;
