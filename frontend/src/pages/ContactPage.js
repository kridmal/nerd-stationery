import React from "react";
import { Box, Typography } from "@mui/material";

function ContactPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" color="#333" gutterBottom>
        Contact Us
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Email: contact@nerdstationery.com
        <br />
        Phone: +94 123 456 789
      </Typography>
    </Box>
  );
}

export default ContactPage;
