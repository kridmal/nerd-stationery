// Use a data URI placeholder to avoid external network/DNS issues
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%23E5E7EB'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23787C87' font-family='Arial, sans-serif' font-size='18'%3EProduct%20Image%3C/text%3E%3C/svg%3E";

export const toNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsed =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeImageValue = (img) => {
  if (typeof img === "string" && img.startsWith("__variant_image__")) return null;
  if (typeof img === "string" && img.trim().length > 0) return img.trim();
  if (img && typeof img === "object") {
    if (typeof img.url === "string" && img.url.trim().length > 0) return img.url.trim();
    if (typeof img.src === "string" && img.src.trim().length > 0) return img.src.trim();
  }
  return null;
};

export const normalizeImagesList = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .map(normalizeImageValue)
    .filter((v) => typeof v === "string" && v.length > 0);
};

export const getPrimaryImage = (item) => {
  const mainImages = normalizeImagesList(item?.images);
  const variantImages = normalizeImagesList(
    Array.isArray(item?.variants) ? item.variants.map((v) => v?.image) : []
  );

  if (mainImages.length > 0) return mainImages[0];
  if (variantImages.length > 0) return variantImages[0];

  return item?.imageUrl || item?.image || PLACEHOLDER_IMAGE;
};

export const createProductSlug = (name) => {
  if (!name) return "product";
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
};

export const buildProductCardData = (item) => {
  const fallbackDescription =
    typeof item.description === "string" ? item.description : "";
  const shortDescription =
    item.shortDescription || fallbackDescription || "";
  const slug = createProductSlug(item?.name || item?.itemCode || item?._id);
  const mainImages = normalizeImagesList(item.images);
  const variantImages = normalizeImagesList(
    Array.isArray(item.variants) ? item.variants.map((v) => v?.image) : []
  );
  const allImages = [...mainImages, ...variantImages].filter(
    (img, idx, arr) => arr.indexOf(img) === idx
  );

  return {
    key: item._id || item.itemCode || item.id || item.name,
    slug,
    image: getPrimaryImage(item),
    name: item.name,
    finalPrice:
      item.finalPrice ?? item.originalPrice ?? item.unitPrice ?? item.price ?? 0,
    originalPrice:
      item.originalPrice ?? item.unitPrice ?? item.price ?? item.finalPrice ?? 0,
    discountType: item.discountType,
    discountValue: item.discountValue,
    shortDescription,
    description: fallbackDescription || shortDescription,
    price: item.price,
    images: allImages,
  };
};

export const formatCurrency = (value, prefix = "Rs") =>
  `${prefix} ${Number(value || 0).toFixed(2)}`;

export const buildPackageSummary = (pkg) => {
  const items = Array.isArray(pkg.products)
    ? pkg.products.map((product) => product?.name).filter(Boolean)
    : [];
  const preview = items.slice(0, 4);
  const extra = items.length - preview.length;
  return {
    id: pkg._id || pkg.id || pkg.name,
    name: pkg.name || "Curated Package",
    price: toNumber(pkg.price, 0),
    items,
    description: preview.length
      ? `Includes: ${preview.join(", ")}${extra > 0 ? ` +${extra} more` : ""}`
      : "Includes a curated mix of our best-selling stationery picks.",
  };
};
