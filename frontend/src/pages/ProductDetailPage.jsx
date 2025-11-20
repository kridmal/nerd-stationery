import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import {
  createProductSlug,
  formatCurrency,
  getPrimaryImage,
  toNumber,
} from "../utils/productUtils";
import { getProducts } from "../services/api";
import { addToCart } from "../utils/cartUtils";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getProducts();
        const list = Array.isArray(data) ? data : [];
        const matched = list.find((item) => {
          const candidate = item?.name || item?.itemCode || item?._id;
          return createProductSlug(candidate) === slug;
        });
        setProduct(matched || null);
        if (!matched) {
          setError("We couldn't find that product. It may have been removed.");
        }
      } catch (err) {
        setError("Failed to load product. Please try again.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  const primaryImage = product ? getPrimaryImage(product) : null;
  const imageGallery = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter((img) => typeof img === "string" && img.length > 0);
    }
    return primaryImage ? [primaryImage] : [];
  }, [product, primaryImage]);

  const originalPrice = product
    ? toNumber(
        product.originalPrice ??
          product.unitPrice ??
          product.price ??
          product.finalPrice ??
          0
      )
    : 0;
  const finalPrice = product
    ? toNumber(product.finalPrice ?? product.price ?? originalPrice, originalPrice)
    : 0;
  const hasDiscount =
    product &&
    product.discountType &&
    product.discountType !== "none" &&
    finalPrice < originalPrice;
  const discountLabel =
    hasDiscount && product.discountType === "percentage"
      ? `${Math.round(product.discountValue || 0)}% OFF`
      : hasDiscount
      ? "SALE"
      : null;

  const handleAddToCart = () => {
    if (!product) return;
    const computedSlug = createProductSlug(
      product.name || product.itemCode || product._id
    );
    addToCart({
      ...product,
      slug: computedSlug,
      image: primaryImage,
      finalPrice,
      originalPrice,
    });
    navigate("/cart");
  };

  const renderContent = () => {
    if (loading) {
      return <Typography>Loading product...</Typography>;
    }

    if (error || !product) {
      return (
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography color="error">{error || "Product not found."}</Typography>
          <Button variant="outlined" onClick={() => navigate("/products")}>
            Back to products
          </Button>
        </Box>
      );
    }

    return (
      <>
        <Button variant="text" onClick={() => navigate("/products")} sx={{ mb: 2 }}>
          ← Back to products
        </Button>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            boxShadow: "0 12px 28px rgba(0,0,0,0.05)",
            backgroundColor: "#fff",
          }}
        >
          <Box flex={1} display="flex" flexDirection="column" gap={2}>
            {primaryImage && (
              <Box
                component="img"
                src={primaryImage}
                alt={product.name}
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  objectFit: "cover",
                  maxHeight: 420,
                }}
              />
            )}
            {imageGallery.length > 1 && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {imageGallery.slice(0, 4).map((img, idx) => (
                  <Box
                    key={`${img}-${idx}`}
                    component="img"
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 1,
                      objectFit: "cover",
                      border: "1px solid #eee",
                    }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Box flex={1} display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {product.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#777", mt: 0.5 }}>
                {product.shortDescription || product.description || "No description available."}
              </Typography>
              {(product.badgeLabel || discountLabel) && (
                <Stack direction="row" spacing={1} mt={1}>
                  {product.badgeLabel && (
                    <Chip
                      size="small"
                      label={product.badgeLabel}
                      sx={{ backgroundColor: product.badgeColor || "#1A73E8", color: "#fff" }}
                    />
                  )}
                  {discountLabel && (
                    <Chip size="small" label={discountLabel} sx={{ backgroundColor: "#E53935", color: "#fff" }} />
                  )}
                </Stack>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A73E8" }}>
                {formatCurrency(finalPrice)}
              </Typography>
              {hasDiscount && (
                <Typography
                  variant="body1"
                  sx={{ color: "#888", textDecoration: "line-through", mt: 0.5 }}
                >
                  {formatCurrency(originalPrice)}
                </Typography>
              )}
            </Box>

            <Divider />

            <Box display="flex" flexDirection="column" gap={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Category
              </Typography>
              <Typography variant="body2" sx={{ color: "#555" }}>
                {product.category || "General"}
                {product.subcategory ? ` • ${product.subcategory}` : ""}
              </Typography>
            </Box>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<AddShoppingCartIcon />}
                fullWidth
                onClick={handleAddToCart}
              >
                Add to cart
              </Button>
              <Button
                variant="outlined"
                startIcon={<KeyboardArrowLeftIcon />}
                fullWidth
                onClick={() => navigate("/products")}
              >
                Continue shopping
              </Button>
              <Button
                variant="text"
                startIcon={<FavoriteBorderIcon />}
                fullWidth
                onClick={() => navigate("/products")}
              >
                Add to wishlist
              </Button>
            </Stack>
          </Box>
        </Stack>
      </>
    );
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", my: { xs: 3, md: 6 }, px: { xs: 2, md: 0 } }}>
      {renderContent()}
    </Box>
  );
};

export default ProductDetailPage;
