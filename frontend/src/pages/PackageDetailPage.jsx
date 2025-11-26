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
import {
  PLACEHOLDER_IMAGE,
  buildPackageSummary,
  computePackageOriginalValue,
  createPackageSlug,
  formatCurrency,
  normalizeImagesList,
  normalizePackageLineItems,
} from "../utils/productUtils";
import { getPackages } from "../services/api";
import { addToCart } from "../utils/cartUtils";

const dedupeImages = (images = []) =>
  images.filter((img, idx, arr) => typeof img === "string" && img.length > 0 && arr.indexOf(img) === idx);

const PackageDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const loadPackage = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getPackages();
        const list = Array.isArray(data) ? data : [];
        const matched = list.find((item) => {
          const computedSlug = createPackageSlug(
            item?.slug || item?.name || item?.packageCode || item?.code || item?.id
          );
          return computedSlug === slug;
        });
        if (!matched) {
          setError("We couldn't find that package. It may have been removed.");
          setPkg(null);
        } else {
          setPkg(matched);
        }
      } catch (_err) {
        setError("Failed to load package. Please try again.");
        setPkg(null);
      } finally {
        setLoading(false);
      }
    };

    loadPackage();
  }, [slug]);

  const summary = useMemo(() => (pkg ? buildPackageSummary(pkg) : null), [pkg]);
  const lineItems = useMemo(() => normalizePackageLineItems(pkg), [pkg]);

  const gallery = useMemo(() => {
    if (!summary) return [PLACEHOLDER_IMAGE];
    const primary = summary.primaryImage;
    const secondary = normalizeImagesList(pkg?.secondaryImages);
    const main = normalizeImagesList(pkg?.images);
    const combined = dedupeImages([primary, ...main, ...secondary]);
    return combined.length ? combined : [PLACEHOLDER_IMAGE];
  }, [summary, pkg]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [gallery.length]);

  const totalOriginal = useMemo(() => {
    if (!pkg) return 0;
    return summary?.totalOriginal ?? computePackageOriginalValue(pkg);
  }, [pkg, summary]);

  const handleAddToCart = () => {
    if (!summary) return;
    addToCart(
      {
        id: summary.id,
        slug: summary.slug,
        name: summary.name,
        image: summary.primaryImage || gallery[0],
        shortDescription: summary.shortDescription || summary.description,
        originalPrice: totalOriginal || summary.price,
        finalPrice: summary.price,
      },
      1
    );
    navigate("/cart");
  };

  const renderContent = () => {
    if (loading) {
      return <Typography>Loading package...</Typography>;
    }

    if (error || !summary) {
      return (
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography color="error">{error || "Package not found."}</Typography>
          <Button variant="outlined" onClick={() => navigate("/packages")}>
            Back to packages
          </Button>
        </Box>
      );
    }

    return (
      <>
        <Button variant="text" onClick={() => navigate("/packages")} sx={{ mb: 2 }}>
          ← Back to packages
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
            <Box
              component="img"
              src={gallery[activeImageIndex] || PLACEHOLDER_IMAGE}
              alt={summary.name}
              sx={{
                width: "100%",
                borderRadius: 2,
                objectFit: "cover",
                maxHeight: 420,
                border: "1px solid #eee",
              }}
            />
            {gallery.length > 1 && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {gallery.map((img, idx) => (
                  <Box
                    key={`${img}-${idx}`}
                    component="button"
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    sx={{
                      border: "none",
                      padding: 0,
                      background: "transparent",
                      cursor: "pointer",
                      opacity: idx === activeImageIndex ? 1 : 0.7,
                    }}
                  >
                    <Box
                      component="img"
                      src={img}
                      alt={`${summary.name} ${idx + 1}`}
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 1,
                        objectFit: "cover",
                        border:
                          idx === activeImageIndex ? "2px solid #1A73E8" : "1px solid #eee",
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Box flex={1} display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {summary.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#777", mt: 0.5 }}>
                {summary.shortDescription || summary.description || "Curated stationery bundle."}
              </Typography>
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip
                  size="small"
                  label={summary.isActive ? "Active" : "Inactive"}
                  color={summary.isActive ? "success" : "default"}
                />
              </Stack>
            </Box>

            <Divider />

            <Stack direction="row" spacing={2} alignItems="baseline" flexWrap="wrap">
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A73E8" }}>
                {formatCurrency(summary.price)}
              </Typography>
              {totalOriginal > summary.price ? (
                <Chip
                  label={`Value ${formatCurrency(totalOriginal)}`}
                  size="small"
                  variant="outlined"
                />
              ) : null}
            </Stack>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Included items
              </Typography>
              {lineItems.length ? (
                <ul style={{ paddingLeft: 18, margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  {lineItems.map((item) => (
                    <li key={item.tempId || item.productId || item.itemCode}>
                      <strong>{item.productName || item.itemName || item.itemCode}</strong>
                      {item.quantity ? ` × ${item.quantity}` : ""}
                      {item.shortDescription ? ` — ${item.shortDescription}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Item breakdown not provided.
                </Typography>
              )}
            </Box>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button variant="contained" fullWidth onClick={handleAddToCart}>
                Add package to cart
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/packages")}
              >
                Continue browsing
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

export default PackageDetailPage;
