export const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/320x200.png?text=Product";

export const toNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsed =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getPrimaryImage = (item) => {
  if (Array.isArray(item?.images) && item.images.length > 0) {
    return item.images[0];
  }
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
    images: Array.isArray(item.images) ? item.images : [],
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
