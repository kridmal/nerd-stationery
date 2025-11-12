import mongoose from "mongoose";

const variationSchema = new mongoose.Schema(
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
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
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
    discountType: {
      type: String,
      enum: ["percentage", "value", null],
      default: null,
    },
    discountValue: {
      type: Number,
      default: null,
      min: [0, "Discount value cannot be negative"],
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
