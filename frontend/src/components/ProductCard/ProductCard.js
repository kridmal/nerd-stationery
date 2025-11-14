import React from "react";
import { Card, CardContent, CardMedia, Typography, Box } from "@mui/material";

const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (value == null) return 0;
  const parsed = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const normalizeDiscountType = (type) => {
  if (!type) return "none";
  return type === "value" ? "fixed" : type;
};

const ProductCard = ({
  image,
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
  const fallbackPrice = toNumber(price);
  let baseOriginal = toNumber(originalPrice || finalPrice || fallbackPrice);
  let baseFinal = toNumber(finalPrice || fallbackPrice || baseOriginal);
  if (baseOriginal < baseFinal) {
    baseOriginal = baseFinal;
  }
  const normalizedDiscountType = normalizeDiscountType(discountType);
  const hasDiscount =
    normalizedDiscountType !== "none" && baseOriginal > 0 && baseOriginal > baseFinal;

  const diff = Math.max(baseOriginal - baseFinal, 0);
  const derivedPercent = baseOriginal > 0 ? (diff / baseOriginal) * 100 : 0;
  const percentValue =
    normalizedDiscountType === "percentage"
      ? Number(discountValue || derivedPercent)
      : derivedPercent;
  const fixedValue =
    normalizedDiscountType === "fixed"
      ? Number(
          discountValue && discountValue <= baseOriginal ? discountValue : diff
        )
      : diff;

  const discountLabel =
    hasDiscount && normalizedDiscountType === "percentage"
      ? `${percentValue.toFixed(0)}% OFF`
      : hasDiscount
      ? `Rs ${fixedValue.toFixed(2)} OFF`
      : null;

  return (
    <Card
      className="product-card"
      sx={{
        borderRadius: 3,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        backgroundColor: "#fff",
        "&:hover": {
          transform: "scale(1.03)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          height="200"
          image={image}
          alt={name}
          sx={{
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            objectFit: "cover",
          }}
        />
        {badgeLabel && (
          <Box
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              backgroundColor: badgeColor,
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            {badgeLabel}
          </Box>
        )}
      </Box>
      <CardContent sx={{ textAlign: "left" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: "#1F1F1F",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {description}
        </Typography>
        <Box display="flex" flexDirection="column" gap={0.5}>
          <Box display="flex" alignItems="baseline" gap={1}>
            <Typography variant="h6" sx={{ color: "#1A73E8", fontWeight: 700 }}>
              {formatCurrency(baseFinal)}
            </Typography>
            {hasDiscount && (
              <Typography
                variant="body2"
                sx={{ color: "#888", textDecoration: "line-through" }}
              >
                {formatCurrency(baseOriginal)}
              </Typography>
            )}
          </Box>
          {discountLabel && (
            <Typography variant="caption" sx={{ color: "#E53935", fontWeight: 600 }}>
              {discountLabel}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
