import Product from "../models/Product.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import AdminAccount from "../models/Admin.js";

const allowedDiscountTypes = ["none", "percentage", "fixed"];

const normalizeDiscountType = (type) =>
  allowedDiscountTypes.includes(type) ? type : "none";

const toNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsed =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : Number(value);
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
  "variations",
];

const toPlainObject = (doc) => {
  if (!doc) return null;
  if (typeof doc.toObject === "function") {
    return doc.toObject({ depopulate: true });
  }
  if (typeof doc === "object") {
    return JSON.parse(JSON.stringify(doc));
  }
  return null;
};

const valuesAreEqual = (a, b) => {
  const normalizedA = a === undefined ? null : a;
  const normalizedB = b === undefined ? null : b;
  const isObjectA = normalizedA !== null && typeof normalizedA === "object";
  const isObjectB = normalizedB !== null && typeof normalizedB === "object";
  if (isObjectA || isObjectB) {
    return JSON.stringify(normalizedA) === JSON.stringify(normalizedB);
  }
  return normalizedA === normalizedB;
};

const collectChangedFields = (beforeDoc = {}, afterDoc = {}) => {
  const changes = {};
  TRACKED_PRODUCT_FIELDS.forEach((field) => {
    const previousValue =
      beforeDoc[field] === undefined ? null : beforeDoc[field];
    const nextValue = afterDoc[field] === undefined ? null : afterDoc[field];
    if (!valuesAreEqual(previousValue, nextValue)) {
      changes[field] = {
        old: previousValue,
        new: nextValue,
      };
    }
  });
  return Object.keys(changes).length ? changes : null;
};

const resolveAdminContext = async (adminPayload) => {
  if (!adminPayload) {
    return { id: null, username: "Unknown Admin", email: "" };
  }

  const adminId = adminPayload.id || adminPayload._id || adminPayload;
  if (!adminId) {
    return { id: null, username: "Unknown Admin", email: "" };
  }

  const adminFromUsers = await User.findById(adminId)
    .select("name email role")
    .lean();
  if (adminFromUsers) {
    return {
      id: adminFromUsers._id,
      username: adminFromUsers.name || "Admin User",
      email: adminFromUsers.email || "",
    };
  }

  const adminFromLegacy = await AdminAccount.findById(adminId)
    .select("name email")
    .lean();
  if (adminFromLegacy) {
    return {
      id: adminFromLegacy._id,
      username: adminFromLegacy.name || "Admin User",
      email: adminFromLegacy.email || "",
    };
  }

  return {
    id: adminId,
    username:
      adminPayload.name || adminPayload.email || "Unknown Admin",
    email: adminPayload.email || "",
  };
};

const recordProductActivity = async (
  req,
  { operation, productDoc, snapshotOverride, changedFields }
) => {
  try {
    const adminContext = await resolveAdminContext(req?.admin);
    const snapshot =
      snapshotOverride || toPlainObject(productDoc) || {};
    const payload = {
      operation,
      adminId: adminContext.id,
      adminUsername: adminContext.username,
      adminEmail: adminContext.email,
      productId:
        productDoc?._id ||
        snapshot?._id ||
        snapshot?.id ||
        null,
      productItemCode:
        productDoc?.itemCode ||
        snapshot?.itemCode ||
        "",
      productName: productDoc?.name || snapshot?.name || "",
      snapshot,
      changedFields:
        changedFields && Object.keys(changedFields).length
          ? changedFields
          : null,
    };
    await Activity.create(payload);
  } catch (activityError) {
    console.error("Failed to record product activity:", activityError);
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      itemCode,
      name,
      category,
      subcategory,
      originalPrice,
      unitPrice,
      discountType = "none",
      discountValue = 0,
      existingQuantity = 0,
      addNewQuantity = 0,
      variations,
      shortDescription = "",
    } = req.body;

    const normalizedOriginalPrice = toNumber(
      originalPrice != null ? originalPrice : unitPrice
    );
    if (normalizedOriginalPrice < 0) {
      return res
        .status(400)
        .json({ message: "Original price must be a non-negative number" });
    }

    const totalQuantity = toNumber(existingQuantity) + toNumber(addNewQuantity);

    const product = new Product({
      itemCode,
      name,
      category,
      subcategory,
      originalPrice: normalizedOriginalPrice,
      discountType: normalizeDiscountType(discountType),
      discountValue: toNumber(discountValue),
      quantity: totalQuantity,
      variations: variations || null,
      shortDescription,
    });

    const saved = await product.save();
    await recordProductActivity(req, {
      operation: "ADD_PRODUCT",
      productDoc: saved,
    });
    return res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      itemCode,
      name,
      category,
      subcategory,
      originalPrice,
      unitPrice,
      discountType = "none",
      discountValue = 0,
      addNewQuantity = 0,
      variations,
      shortDescription = "",
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const beforeSnapshot = toPlainObject(product);

    const newTotalQuantity =
      toNumber(product.quantity || 0) + toNumber(addNewQuantity || 0);

    if (itemCode) product.itemCode = itemCode;
    if (name) product.name = name;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (shortDescription != null) product.shortDescription = shortDescription;
    product.quantity = newTotalQuantity;
    product.variations = variations || null;

    const effectiveOriginal =
      originalPrice != null ? originalPrice : unitPrice;

    if (effectiveOriginal != null) {
      const normalizedOriginalPrice = toNumber(effectiveOriginal);
      if (normalizedOriginalPrice < 0) {
        return res
          .status(400)
          .json({ message: "Original price must be a non-negative number" });
      }
      product.originalPrice = normalizedOriginalPrice;
    }

    product.discountType = normalizeDiscountType(discountType);
    product.discountValue = toNumber(discountValue);

    const updated = await product.save();
    const afterSnapshot = toPlainObject(updated);
    const changedFields = collectChangedFields(
      beforeSnapshot,
      afterSnapshot
    );
    await recordProductActivity(req, {
      operation: "UPDATE_PRODUCT",
      productDoc: updated,
      snapshotOverride: afterSnapshot,
      changedFields,
    });
    return res.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(400).json({ message: error.message });
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

    if (productId) {
      filter.productId = productId;
    }
    if (itemCode) {
      filter.productItemCode = itemCode;
    }

    const activities = await Activity.find(filter)
      .sort({ timestamp: -1 })
      .limit(parsedLimit);
    return res.json(activities);
  } catch (error) {
    console.error("Error fetching product activities:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch product activity logs" });
  }
};
