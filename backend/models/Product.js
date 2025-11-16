import mongoose from "mongoose";

const variationSchema = new mongoose.Schema(
  {
    brand: { type: String, trim: true },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
  },
  { _id: false }
);

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
      required: [true, "Original price is required"],
      min: [0, "Original price cannot be negative"],
    },
    finalPrice: {
      type: Number,
      required: true,
      min: [0, "Final price cannot be negative"],
      default: 0,
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
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    minQuantity: {
      type: Number,
      default: 0,
      min: [0, "Minimum quantity cannot be negative"],
    },
    variations: {
      type: variationSchema,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.virtual("unitPrice")
  .get(function getUnitPrice() {
    return this.originalPrice;
  })
  .set(function setUnitPrice(value) {
    this.originalPrice = value;
  });

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.pre("validate", function handlePricing(next) {
  const product = this;

  // Backfill legacy documents that only stored `unitPrice`
  if (
    (product.originalPrice == null || Number.isNaN(product.originalPrice)) &&
    product.get("unitPrice") != null
  ) {
    product.originalPrice = Number(product.get("unitPrice")) || 0;
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

  next();
});

export { calculateFinalPrice };
export default mongoose.model("Product", productSchema);
