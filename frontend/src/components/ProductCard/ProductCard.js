import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { PLACEHOLDER_IMAGE } from "../../utils/productUtils";

const ProductCard = ({
  image,
  images = [],
  name,
  finalPrice,
  originalPrice,
  discountType,
  discountValue,
  description,
  price,
  badgeLabel,
  badgeColor = "#1A73E8",
}) => {
  /* ---------------- DEBUG LOG ------------------- */
  useEffect(() => {
    console.log("🟢 PRODUCT CARD RECEIVED:", {
      name,
      imageProp: image,
      imagesProp: images,
    });
  }, [image, images, name]);

  /* --------------- FIXED IMAGE RESOLUTION ------------------ */
  const safeCardImage =
    (typeof image === "string" && image.startsWith("http") && image) ||
    (Array.isArray(images)
      ? images.find((img) => typeof img === "string" && img.startsWith("http"))
      : null) ||
    PLACEHOLDER_IMAGE;

  console.log("🟣 FINAL IMAGE USED:", safeCardImage);

  /* ------------------- GALLERY SUPPORT -------------------- */
  const galleryImages = useMemo(() => {
    const valid = (images || []).filter(
      (img) => typeof img === "string" && img.startsWith("http")
    );
    return valid.length > 0 ? valid : [safeCardImage];
  }, [images, safeCardImage]);

  /* ---------------------- UI ------------------------------ */
  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          "&:hover": { transform: "scale(1.03)" },
          cursor: "pointer",
        }}
      >
        <CardMedia
          component="img"
          height="200"
          image={safeCardImage}
          alt={name}
          sx={{ objectFit: "cover" }}
        />

        <CardContent>
          <Typography variant="h6">{name}</Typography>
        </CardContent>
      </Card>
    </>
  );
};

export default ProductCard;
