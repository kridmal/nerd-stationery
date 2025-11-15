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

export const buildProductCardData = (item) => ({
  key: item._id || item.itemCode || item.id || item.name,
  image: item.imageUrl || item.image || PLACEHOLDER_IMAGE,
  name: item.name,
  finalPrice:
    item.finalPrice ?? item.originalPrice ?? item.unitPrice ?? item.price ?? 0,
  originalPrice:
    item.originalPrice ?? item.unitPrice ?? item.price ?? item.finalPrice ?? 0,
  discountType: item.discountType,
  discountValue: item.discountValue,
  description: item.shortDescription || item.description || "",
  price: item.price,
});

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
