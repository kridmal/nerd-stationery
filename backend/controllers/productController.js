import Product, { calculateFinalPrice } from "../models/Product.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import AdminAccount from "../models/Admin.js";
import { uploadProductImages } from "../utils/s3Uploader.js";

const clampNumber = (value, min = 0, max = Number.POSITIVE_INFINITY) => {
  const numericValue = Number(value) || 0;
  return Math.min(Math.max(numericValue, min), max);
};

const allowedDiscountTypes = ["none", "percentage", "fixed"];
const normalizeDiscountType = (type) => (allowedDiscountTypes.includes(type) ? type : "none");

const toNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsed =
    typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const TRACKED_PRODUCT_FIELDS = [
  "itemCode",
  "name",
  "shortDescription",
  "category",
  "subcategory",
  "originalPrice",
  "finalPrice",
  "discountType",
  "discountValue",
  "quantity",
  "minQuantity",
  "variants",
  "images",
  "variations",
];

const toPlainObject = (doc) => {
  if (!doc) return null;
  if (typeof doc.toObject === "function") return doc.toObject({ depopulate: true });
  if (typeof doc === "object") return JSON.parse(JSON.stringify(doc));
  return null;
};

const parseJsonArray = (value, fallback = []) => {
  if (!value) return Array.isArray(value) ? value : fallback;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
};

const valuesAreEqual = (a, b) => {
  const normalizedA = a === undefined ? null : a;
  const normalizedB = b === undefined ? null : b;
  const isObjectA = normalizedA !== null && typeof normalizedA === "object";
  const isObjectB = normalizedB !== null && typeof normalizedB === "object";
  if (isObjectA || isObjectB) return JSON.stringify(normalizedA) === JSON.stringify(normalizedB);
  return normalizedA === normalizedB;
};

const collectChangedFields = (beforeDoc = {}, afterDoc = {}) => {
  const changes = {};
  TRACKED_PRODUCT_FIELDS.forEach((field) => {
    const previousValue = beforeDoc[field] === undefined ? null : beforeDoc[field];
    const nextValue = afterDoc[field] === undefined ? null : afterDoc[field];
    if (!valuesAreEqual(previousValue, nextValue)) {
      changes[field] = { old: previousValue, new: nextValue };
    }
  });
  return Object.keys(changes).length ? changes : null;
};

const resolveAdminContext = async (adminPayload) => {
  if (!adminPayload) return { id: null, username: "Unknown Admin", email: "" };
  const adminId = adminPayload.id || adminPayload._id || adminPayload;
  if (!adminId) return { id: null, username: "Unknown Admin", email: "" };

  const adminFromUsers = await User.findById(adminId).select("name email role").lean();
  if (adminFromUsers) {
    return {
      id: adminFromUsers._id,
      username: adminFromUsers.name || "Admin User",
      email: adminFromUsers.email || "",
    };
  }

  const adminFromLegacy = await AdminAccount.findById(adminId).select("name email").lean();
  if (adminFromLegacy) {
    return {
      id: adminFromLegacy._id,
      username: adminFromLegacy.name || "Admin User",
      email: adminFromLegacy.email || "",
    };
  }

  return {
    id: adminId,
    username: adminPayload.name || adminPayload.email || "Unknown Admin",
    email: adminPayload.email || "",
  };
};

const recordProductActivity = async (req, { operation, productDoc, snapshotOverride, changedFields }) => {
  try {
    const adminContext = await resolveAdminContext(req?.admin);
    const snapshot = snapshotOverride || toPlainObject(productDoc) || {};
    const payload = {
      operation,
      adminId: adminContext.id,
      adminUsername: adminContext.username,
      adminEmail: adminContext.email,
      productId: productDoc?._id || snapshot?._id || snapshot?.id || null,
      productItemCode: productDoc?.itemCode || snapshot?.itemCode || "",
      productName: productDoc?.name || snapshot?.name || "",
      snapshot,
      changedFields: changedFields && Object.keys(changedFields).length ? changedFields : null,
    };
    await Activity.create(payload);
  } catch (activityError) {
    console.error("Failed to record product activity:", activityError);
  }
};

const hydrateVariantImages = (variants, uploadedVariantImages) => {
  const hydrated = (variants || []).map((variant) => {
    const copy = { ...variant };
    if (typeof copy.image === "string" && copy.image.startsWith("__variant_image__")) {
      const placeholderIndex = Number(copy.image.replace("__variant_image__", ""));
      copy.image = uploadedVariantImages[placeholderIndex] || "";
    }
    return copy;
  });
  return hydrated;
};

const normalizeVariants = (variants, uploadedVariantImages = [], itemCode = "SKU") => {
  const hydrated = hydrateVariantImages(variants, uploadedVariantImages);
  return hydrated
    .map((v, idx) => ({
      _id: v._id,
      brand: v.brand || "",
      size: v.size || "",
      color: v.color || "",
      sku: v.sku || `${itemCode}-${idx + 1}`,
      price: toNumber(v.price, 0),
      quantity: toNumber(v.quantity, 0),
      image: v.image || "",
    }))
    .filter((v) => v.price >= 0 && v.quantity >= 0);
};

export const createProduct = async (req, res) => {
  try {
    const {
      itemCode,
      name,
      category,
      subcategory,
      discountType = "none",
      discountValue = 0,
      shortDescription = "",
      existingImages,
      variants,
    } = req.body;

    if (!itemCode || !name || !category || !subcategory) {
      return res.status(400).json({ message: "itemCode, name, category and subcategory are required" });
    }

    const retainedImages = parseJsonArray(existingImages, []);
    const uploadedMainImages = await uploadProductImages(req.files?.images || req.files || []);
    const uploadedVariantImages = await uploadProductImages(req.files?.variantImages || []);

    const parsedVariants = parseJsonArray(variants, []);
    const normalizedVariants = normalizeVariants(parsedVariants, uploadedVariantImages, itemCode);

    if (!normalizedVariants.length) {
      return res.status(400).json({ message: "At least one variant is required" });
    }
    if (normalizedVariants.some((v) => v.price < 0 || v.quantity < 0)) {
      return res.status(400).json({ message: "Variant price/quantity cannot be negative" });
    }

    const aggregatedQuantity = normalizedVariants.reduce((sum, v) => sum + toNumber(v.quantity, 0), 0);
    const lowestVariantPrice = Math.min(...normalizedVariants.map((v) => toNumber(v.price, 0)));
    const normalizedDiscountType = normalizeDiscountType(discountType);
    const normalizedDiscountValue =
      normalizedDiscountType === "percentage"
        ? clampNumber(discountValue, 0, 100)
        : normalizedDiscountType === "fixed"
        ? clampNumber(discountValue, 0, lowestVariantPrice)
        : 0;
    const finalPrice = calculateFinalPrice(lowestVariantPrice, normalizedDiscountType, normalizedDiscountValue);

    const product = new Product({
      itemCode,
      name,
      category,
      subcategory,
      discountType: normalizedDiscountType,
      discountValue: normalizedDiscountValue,
      shortDescription,
      variants: normalizedVariants,
      quantity: aggregatedQuantity,
      originalPrice: lowestVariantPrice,
      finalPrice,
      images: [...retainedImages, ...uploadedMainImages],
      variations: null,
    });

    const saved = await product.save();
    await recordProductActivity(req, { operation: "ADD_PRODUCT", productDoc: saved });
    return res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating product:", error);
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Item code must be unique" });
    }
    return res.status(400).json({ message: error?.message || "Failed to create product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      itemCode,
      name,
      category,
      subcategory,
      discountType = "none",
      discountValue = 0,
      shortDescription = "",
      existingImages,
      variants,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const beforeSnapshot = toPlainObject(product);

    const retainedImages = parseJsonArray(existingImages, product.images || []);
    const uploadedMainImages = await uploadProductImages(req.files?.images || req.files || []);
    const uploadedVariantImages = await uploadProductImages(req.files?.variantImages || []);

    const parsedVariants = parseJsonArray(variants, []);
    const normalizedVariants = normalizeVariants(
      parsedVariants,
      uploadedVariantImages,
      itemCode || product.itemCode
    );
    if (!normalizedVariants.length) {
      return res.status(400).json({ message: "At least one variant is required" });
    }
    if (normalizedVariants.some((v) => v.price < 0 || v.quantity < 0)) {
      return res.status(400).json({ message: "Variant price/quantity cannot be negative" });
    }

    if (itemCode) product.itemCode = itemCode;
    if (name) product.name = name;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (shortDescription != null) product.shortDescription = shortDescription;

    const aggregatedQuantity = normalizedVariants.reduce((sum, v) => sum + toNumber(v.quantity, 0), 0);
    const lowestVariantPrice = Math.min(...normalizedVariants.map((v) => toNumber(v.price, 0)));
    const normalizedDiscountType = normalizeDiscountType(discountType);
    const normalizedDiscountValue =
      normalizedDiscountType === "percentage"
        ? clampNumber(discountValue, 0, 100)
        : normalizedDiscountType === "fixed"
        ? clampNumber(discountValue, 0, lowestVariantPrice)
        : 0;
    const finalPrice = calculateFinalPrice(lowestVariantPrice, normalizedDiscountType, normalizedDiscountValue);

    product.variants = normalizedVariants;
    product.quantity = aggregatedQuantity;
    product.originalPrice = lowestVariantPrice;
    product.discountType = normalizedDiscountType;
    product.discountValue = normalizedDiscountValue;
    product.finalPrice = finalPrice;
    product.images = [...retainedImages, ...uploadedMainImages];

    const updated = await product.save();
    const afterSnapshot = toPlainObject(updated);
    const changedFields = collectChangedFields(beforeSnapshot, afterSnapshot);

    await recordProductActivity(req, {
      operation: "UPDATE_PRODUCT",
      productDoc: updated,
      snapshotOverride: afterSnapshot,
      changedFields,
    });
    return res.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Item code must be unique" });
    }
    return res.status(400).json({ message: error?.message || "Failed to update product" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const snapshotBeforeDelete = toPlainObject(product);
    await product.deleteOne();
    await recordProductActivity(req, {
      operation: "DELETE_PRODUCT",
      productDoc: product,
      snapshotOverride: snapshotBeforeDelete,
    });
    return res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const getProductActivities = async (req, res) => {
  try {
    const { productId, itemCode, limit } = req.query;
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const filter = {};

    if (productId) filter.productId = productId;
    if (itemCode) filter.productItemCode = itemCode;

    const activities = await Activity.find(filter)
      .sort({ timestamp: -1 })
      .limit(parsedLimit);
    return res.json(activities);
  } catch (error) {
    console.error("Error fetching product activities:", error);
    return res.status(500).json({ message: "Failed to fetch product activity logs" });
  }
};
