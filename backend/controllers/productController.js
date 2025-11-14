import Product from "../models/Product.js";

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
    return res.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(400).json({ message: error.message });
  }
};
