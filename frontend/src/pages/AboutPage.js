import React from "react";
import { Box, Typography } from "@mui/material";

function AboutPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" color="#333" gutterBottom>
        About Us
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Nerd Stationery is your go-to place for modern and elegant stationery products.
      </Typography>
    </Box>
  );
}

export default AboutPage;
