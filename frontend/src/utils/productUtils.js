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

const fallbackLineQuantity = (product) => {
  if (product == null) return 0;
  const variantQuantities = Array.isArray(product.variants)
    ? product.variants
        .map((v) => toNumber(v?.quantity, 0))
        .filter((n) => !Number.isNaN(n))
    : [];
  if (variantQuantities.length) {
    return variantQuantities.reduce((sum, qty) => sum + qty, 0);
  }
  return toNumber(product.quantity, product.minQuantity ? 1 : 0) || 1;
};

const fallbackLineOriginalPrice = (product) => {
  if (!product) return 0;
  if (Array.isArray(product?.variants) && product.variants.length) {
    const prices = product.variants
      .map((v) => toNumber(v?.price, null))
      .filter((n) => n != null);
    if (prices.length) return Math.min(...prices);
  }
  return toNumber(
    product.originalPrice ??
      product.unitPrice ??
      product.price ??
      product.finalPrice ??
      0,
    0
  );
};

export const normalizePackageLineItems = (pkg) => {
  if (Array.isArray(pkg?.items) && pkg.items.length) {
    return pkg.items.map((item, idx) => ({
      ...item,
      tempId: item.tempId || item._id || `${pkg._id || "pkg"}-item-${idx}`,
      quantity: toNumber(item.quantity, 0),
      originalPrice: toNumber(item.originalPrice ?? item.price, 0),
    }));
  }

  if (Array.isArray(pkg?.products) && pkg.products.length) {
    return pkg.products.map((product, idx) => ({
      productId: product._id,
      itemCode: product.itemCode ?? product.productCode,
      productName: product.name,
      shortDescription: product.shortDescription || product.description || "",
      quantity: fallbackLineQuantity(product),
      originalPrice: fallbackLineOriginalPrice(product),
      brand: product.variations?.brand || "",
      size: product.variations?.size || "",
      color: product.variations?.color || "",
      sku:
        Array.isArray(product.variants) && product.variants[0]
          ? product.variants[0].sku
          : `${product.itemCode || product.productCode}-default`,
      tempId: `${product._id || product.itemCode || "product"}-${idx}`,
    }));
  }

  return [];
};

export const computePackageLineTotal = (line) => {
  const qty = toNumber(line?.quantity, 0);
  const price = toNumber(
    line?.originalPrice ?? line?.price ?? line?.basePrice,
    0
  );
  return Number((qty * price).toFixed(2));
};

export const computePackageOriginalValue = (pkgOrLines) => {
  const lines = Array.isArray(pkgOrLines)
    ? pkgOrLines
    : normalizePackageLineItems(pkgOrLines);
  return lines.reduce((sum, line) => sum + computePackageLineTotal(line), 0);
};

export const buildPackageSummary = (pkg) => {
  const lineItems = normalizePackageLineItems(pkg);
  const itemNames = lineItems
    .map((item) => item.productName || item.name || item.itemName)
    .filter(Boolean);
  const preview = itemNames.slice(0, 4);
  const extra = itemNames.length - preview.length;

  const totalOriginal =
    pkg?.totalOriginal != null
      ? toNumber(pkg.totalOriginal, 0)
      : computePackageOriginalValue(lineItems);

  const name = pkg?.name || "Curated Package";

  return {
    id: pkg?._id || pkg?.id || name,
    code: pkg?.packageCode || pkg?.code || pkg?.reference || "",
    name,
    price: toNumber(pkg?.packagePrice ?? pkg?.price, 0),
    totalOriginal,
    items: itemNames,
    isActive: pkg?.isActive !== false,
    description: preview.length
      ? `Includes: ${preview.join(", ")}${extra > 0 ? ` +${extra} more` : ""}`
      : "Includes a curated mix of our best-selling stationery picks.",
  };
};
