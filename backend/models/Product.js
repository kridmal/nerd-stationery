import mongoose from "mongoose";

const clampNumber = (value, min = 0, max = Number.POSITIVE_INFINITY) => {
  const numericValue = Number(value) || 0;
  return Math.min(Math.max(numericValue, min), max);
};

const calculateFinalPrice = (originalPrice, discountType, discountValue) => {
  const basePrice = Number(originalPrice) || 0;
  const type = discountType || "none";
  let discountAmount = 0;

  if (type === "percentage") {
    const percentage = clampNumber(discountValue, 0, 100);
    discountAmount = basePrice * (percentage / 100);
  } else if (type === "fixed") {
    discountAmount = clampNumber(discountValue, 0, basePrice);
  }

  const finalPrice = Math.max(0, basePrice - discountAmount);
  return Number(finalPrice.toFixed(2));
};

const variantSchema = new mongoose.Schema(
  {
    brand: { type: String, trim: true, default: "" },
    size: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" },
    sku: { type: String, trim: true, required: true },
    price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
    quantity: { type: Number, required: true, min: [0, "Quantity cannot be negative"] },
    image: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

// Legacy single-variation schema retained for backward compatibility
const legacyVariationSchema = new mongoose.Schema(
  {
    brand: { type: String, trim: true },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: [true, "Item code is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    subcategory: {
      type: String,
      required: [true, "Subcategory is required"],
      trim: true,
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: [0, "Original price cannot be negative"],
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: [0, "Final price cannot be negative"],
    },
    discountType: {
      type: String,
      enum: ["none", "percentage", "fixed"],
      default: "none",
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, "Discount value cannot be negative"],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, "Quantity cannot be negative"],
    },
    minQuantity: {
      type: Number,
      default: 0,
      min: [0, "Minimum quantity cannot be negative"],
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    // Legacy single-variation slot kept for backward compatibility
    variations: {
      type: legacyVariationSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.pre("validate", function handlePricing(next) {
  const product = this;

  const variantPrices = (product.variants || [])
    .map((v) => Number(v?.price) || 0)
    .filter((n) => !Number.isNaN(n));
  const variantQuantities = (product.variants || [])
    .map((v) => Number(v?.quantity) || 0)
    .filter((n) => !Number.isNaN(n));

  if (variantQuantities.length) {
    product.quantity = variantQuantities.reduce((sum, q) => sum + q, 0);
  }
  if (variantPrices.length) {
    product.originalPrice = Math.min(...variantPrices);
  }

  if (!["percentage", "fixed", "none"].includes(product.discountType)) {
    product.discountType = "none";
  }

  if (product.discountType === "none") {
    product.discountValue = 0;
  } else if (product.discountType === "percentage") {
    product.discountValue = clampNumber(product.discountValue, 0, 100);
  } else if (product.discountType === "fixed") {
    const base = Number(product.originalPrice) || 0;
    product.discountValue = clampNumber(product.discountValue, 0, base);
  }

  product.finalPrice = calculateFinalPrice(
    product.originalPrice,
    product.discountType,
    product.discountValue
  );

  // Legacy fallback: if document has quantity but no variants, seed a default variant
  if ((!product.variants || product.variants.length === 0) && product.quantity > 0) {
    product.variants = [
      {
        brand: product.variations?.brand ?? "",
        size: product.variations?.size ?? "",
        color: product.variations?.color ?? "",
        sku: `${product.itemCode}-default`,
        price: product.originalPrice || 0,
        quantity: product.quantity,
        image: (product.images || [])[0] || "",
      },
    ];
  }

  next();
});

export { calculateFinalPrice };
export default mongoose.model("Product", productSchema);
