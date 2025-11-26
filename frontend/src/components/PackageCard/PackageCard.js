import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Divider,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { PLACEHOLDER_IMAGE } from "../../utils/productUtils";
import "./PackageCard.css";

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const dedupeImages = (list = []) => {
  const seen = new Set();
  return list.filter((img) => {
    if (!img) return false;
    const key = img.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildImages = (pkg) => {
  const merged = [
    pkg?.primaryImage,
    ...(Array.isArray(pkg?.secondaryImages) ? pkg.secondaryImages : []),
  ].filter(Boolean);
  const safe = dedupeImages(merged);
  return safe.length ? safe : [PLACEHOLDER_IMAGE];
};

const getIncludedItems = (pkg) => (Array.isArray(pkg?.items) ? pkg.items : []);

const PriceBlock = ({ price, totalOriginal }) => (
  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
    <Typography variant="h6" className="package-card__price">
      {formatCurrency(price)}
    </Typography>
    {totalOriginal && Number(totalOriginal) > Number(price || 0) ? (
      <Chip
        label={`Value ${formatCurrency(totalOriginal)}`}
        size="small"
        color="default"
        variant="outlined"
      />
    ) : null}
  </Stack>
);

const PackageCard = ({ pkg, onAddToCart, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const images = useMemo(() => buildImages(pkg), [pkg]);

  useEffect(() => {
    setActiveIndex(0);
  }, [images, open]);

  const activeImage = images[activeIndex] || images[0] || PLACEHOLDER_IMAGE;
  const previewImages = images.slice(0, 5);
  const includedItems = getIncludedItems(pkg);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleNavigate = () => {
    if (onNavigate) onNavigate(pkg);
  };

  return (
    <>
      <article className="package-card package-card--media">
        <div className="package-card__content">
          <div className="package-card__text">
            <Typography
              variant="h6"
              className="package-card__title"
              role="button"
              tabIndex={0}
              onClick={handleNavigate}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNavigate();
                }
              }}
            >
              {pkg?.name}
            </Typography>
            <Typography variant="body2" className="package-card__description">
              {pkg?.shortDescription || pkg?.description}
            </Typography>
            {includedItems.length > 0 ? (
              <ul className="package-card__items-list">
                {includedItems.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {includedItems.length > 3 ? (
                  <li className="package-card__items-more">
                    +{includedItems.length - 3} more included
                  </li>
                ) : null}
              </ul>
            ) : null}
            <PriceBlock price={pkg?.price} totalOriginal={pkg?.totalOriginal} />
          </div>

          <div className="package-card__media">
            <img src={activeImage} alt={pkg?.name} />
            <div className="package-card__actions">
              <IconButton color="primary" onClick={handleOpen} aria-label="Quick view package">
                <VisibilityOutlinedIcon />
              </IconButton>
              <IconButton
                color="primary"
                onClick={handleNavigate}
                aria-label="Add package to cart"
              >
                <AddShoppingCartIcon />
              </IconButton>
            </div>
          </div>
        </div>
      </article>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          <Typography variant="h6">{pkg?.name}</Typography>
          <IconButton onClick={handleClose} aria-label="Close package details">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box flex={1}>
              <Box
                component="img"
                src={activeImage}
                alt={pkg?.name}
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  objectFit: "cover",
                  maxHeight: 340,
                }}
              />
              {previewImages.length > 1 && (
                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                  {previewImages.map((img, idx) => (
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
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {pkg?.name}
              </Typography>
              <Typography variant="body1" sx={{ color: "#4a5568" }}>
                {pkg?.shortDescription || pkg?.description || "Curated stationery bundle"}
              </Typography>
              <PriceBlock price={pkg?.price} totalOriginal={pkg?.totalOriginal} />
              <Divider />
              <div>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Included items
                </Typography>
                {includedItems.length ? (
                  <ul className="package-card__items-list package-card__items-list--dialog">
                    {includedItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Item breakdown not provided.
                  </Typography>
                )}
              </div>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: "auto" }}>
                <Button
                  variant="contained"
                  startIcon={<AddShoppingCartIcon />}
                  onClick={() => {
                    if (onAddToCart) onAddToCart(pkg);
                    handleClose();
                  }}
                  sx={{ flex: 1 }}
                >
                  Add to cart
                </Button>
                <Button variant="outlined" onClick={handleClose} sx={{ flex: 1 }}>
                  Close
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PackageCard;
