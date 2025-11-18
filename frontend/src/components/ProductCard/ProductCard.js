import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
  Stack,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { PLACEHOLDER_IMAGE } from "../../utils/productUtils";

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
  images = [],
  name,
  finalPrice,
  originalPrice,
  discountType,
  discountValue,
  shortDescription,
  description,
  price,
  badgeLabel,
  badgeColor = "#1A73E8",
}) => {
  const fallbackPrice = toNumber(price);
  let baseOriginal = toNumber(originalPrice || finalPrice || fallbackPrice);
  let baseFinal = toNumber(finalPrice || fallbackPrice || baseOriginal);
  if (baseOriginal < baseFinal) baseOriginal = baseFinal;

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
      ? `${Math.round(percentValue)}% OFF`
      : hasDiscount
      ? `Rs ${fixedValue.toFixed(2)} OFF`
      : null;

  const sanitizedImages = Array.isArray(images)
    ? images.filter((img) => typeof img === "string" && img.length > 0)
    : [];
  const safeCardImage =
    (typeof image === "string" && image.length ? image : null) ||
    sanitizedImages[0] ||
    PLACEHOLDER_IMAGE;

  const galleryImages = useMemo(() => {
    if (sanitizedImages.length > 0) return sanitizedImages;
    return [safeCardImage];
  }, [sanitizedImages, safeCardImage]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setActiveIndex(0);
  }, [galleryImages, detailOpen]);

  useEffect(() => {
    if (!detailOpen) {
      setQuantity(1);
    }
  }, [detailOpen]);

  const activeImage = galleryImages[activeIndex] || safeCardImage;
  const previewImages = useMemo(
    () =>
      galleryImages
        .slice(0, 4)
        .map((img, idx) => ({ img, idx })),
    [galleryImages]
  );

  const shortText =
    typeof shortDescription === "string" && shortDescription.trim().length > 0
      ? shortDescription
      : typeof description === "string"
      ? description
      : "";
  const handleClose = () => setDetailOpen(false);
  const handleQuickView = (event) => {
    if (event) event.stopPropagation();
    setDetailOpen(true);
  };
  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  return (
    <>
      <Card
        className="product-card"
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          backgroundColor: "#fff",
          cursor: "default",
          position: "relative",
          "&:hover": {
            transform: "scale(1.03)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
          "&:hover .product-card__actions": {
            opacity: 1,
            transform: "translate(-50%, 0)",
          },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            height="200"
            image={safeCardImage}
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
          <Box
            className="product-card__actions"
            sx={{
              position: "absolute",
              left: "50%",
              bottom: 16,
              transform: "translate(-50%, 10px)",
              display: "flex",
              gap: 1,
              opacity: 0,
              pointerEvents: "auto",
              transition: "all 0.2s ease",
            }}
          >
            <Tooltip title="Add to cart" arrow>
              <IconButton
                color="primary"
                sx={{
                  backgroundColor: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                <AddShoppingCartIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Quick view" arrow>
              <IconButton
                color="primary"
                onClick={handleQuickView}
                sx={{
                  backgroundColor: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add to wishlist" arrow>
              <IconButton
                color="primary"
                sx={{
                  backgroundColor: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                <FavoriteBorderIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <CardContent
          sx={{
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography
            variant="h6"
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
          {shortText && (
            <Typography
              variant="body2"
              sx={{
                color: "#666",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {shortText}
            </Typography>
          )}
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
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
            {discountLabel && (
              <Chip
                label={discountLabel}
                size="small"
                sx={{
                  backgroundColor: "#E53935",
                  color: "#fff",
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={detailOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="product-detail-title"
      >
        <DialogTitle
          id="product-detail-title"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          <Typography variant="h6" component="span">
            {name}
          </Typography>
          <IconButton aria-label="Close product details" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems="stretch"
          >
            <Box flex={1}>
              <Box
                component="img"
                src={activeImage}
                alt={name}
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  objectFit: "cover",
                  maxHeight: 320,
                }}
              />
              {previewImages.length > 0 && (
                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                  {previewImages.map(({ img, idx }) => (
                    <Box
                      key={`${img}-${idx}`}
                      component="button"
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      sx={{
                        border: "none",
                        padding: 0,
                        background: "transparent",
                        cursor: "pointer",
                        opacity: idx === activeIndex ? 1 : 0.7,
                      }}
                    >
                      <Box
                        component="img"
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: 1,
                          objectFit: "cover",
                          border:
                            idx === activeIndex
                              ? "2px solid #1A73E8"
                              : "1px solid #ddd",
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
            <Box flex={1} display="flex" flexDirection="column" gap={2}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {name}
                </Typography>
                {(badgeLabel || discountLabel) && (
                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                    {badgeLabel && (
                      <Chip
                        size="small"
                        label={badgeLabel}
                        sx={{ backgroundColor: badgeColor, color: "#fff" }}
                      />
                    )}
                    {discountLabel && (
                      <Chip
                        size="small"
                        label={discountLabel}
                        sx={{ backgroundColor: "#E53935", color: "#fff" }}
                      />
                    )}
                  </Stack>
                )}
              </Box>
              <Divider />
              <Box>
                <Typography variant="h4" sx={{ color: "#1A73E8", fontWeight: 700 }}>
                  {formatCurrency(baseFinal)}
                </Typography>
                {hasDiscount && (
                  <Typography
                    variant="body1"
                    sx={{ color: "#888", textDecoration: "line-through" }}
                  >
                    {formatCurrency(baseOriginal)}
                  </Typography>
                )}
                {hasDiscount && (
                  <Typography variant="body2" sx={{ color: "#1A73E8", mt: 0.5 }}>
                    You save {formatCurrency(diff)} (
                    {Math.round(percentValue)}% off)
                  </Typography>
                )}
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Product Details
                </Typography>
                <Typography variant="body2" sx={{ color: "#4d4d4d" }}>
                  {shortText || "No description available for this item."}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Quantity
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton
                    aria-label="Decrease quantity"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity === 1}
                    sx={{ border: "1px solid #ddd" }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography variant="h6" sx={{ minWidth: 32, textAlign: "center" }}>
                    {quantity}
                  </Typography>
                  <IconButton
                    aria-label="Increase quantity"
                    onClick={() => handleQuantityChange(1)}
                    sx={{ border: "1px solid #ddd" }}
                  >
                    <AddIcon />
                  </IconButton>
                </Stack>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mt: 1 }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddShoppingCartIcon />}
                  sx={{ flex: 1 }}
                >
                  Add to cart
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FavoriteBorderIcon />}
                  sx={{ flex: 1 }}
                >
                  Add to wishlist
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;
