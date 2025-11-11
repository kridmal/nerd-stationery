import React from "react";
import { Card, CardContent, CardMedia, Typography, Button, Box } from "@mui/material";

const ProductCard = ({ image, name, price, description }) => {
  return (
    <Card
      sx={{
        maxWidth: 280,
        borderRadius: 3,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 6px 25px rgba(0,0,0,0.12)",
        },
      }}
    >
      <CardMedia
        component="img"
        height="180"
        image={image}
        alt={name}
        sx={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      />
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {description}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary">
            ${price}
          </Typography>
          <Button variant="contained" size="small" sx={{ textTransform: "none" }}>
            Add to Cart
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
