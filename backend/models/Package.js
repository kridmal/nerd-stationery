import mongoose from "mongoose";

const PackageItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    itemCode: { type: String, trim: true },
    productName: { type: String, trim: true },
    shortDescription: { type: String, trim: true },
    quantity: { type: Number, default: 0, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true },
    brand: { type: String, trim: true },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
  },
  { _id: false }
);

const packageSchema = new mongoose.Schema(
  {
    packageCode: { type: String, trim: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true, default: "" },
    primaryImage: { type: String, trim: true, default: "" },
    secondaryImages: { type: [String], default: [] },
    items: { type: [PackageItemSchema], default: [] },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // legacy field
    packagePrice: { type: Number, required: true, min: 0 },
    price: { type: Number, min: 0 }, // legacy alias
    totalOriginal: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

packageSchema.pre("save", function computeTotals(next) {
  const pkg = this;
  const computedTotal =
    Array.isArray(pkg.items) && pkg.items.length
      ? pkg.items.reduce(
          (sum, item) =>
            sum +
            (Number(item.originalPrice || 0) || 0) * (Number(item.quantity || 0) || 0),
          0
        )
      : pkg.totalOriginal || 0;
  pkg.totalOriginal = computedTotal;
  pkg.secondaryImages = Array.isArray(pkg.secondaryImages)
    ? pkg.secondaryImages.filter(Boolean)
    : [];
  if (!pkg.primaryImage && pkg.secondaryImages.length) {
    [pkg.primaryImage] = pkg.secondaryImages;
  }
  if (pkg.packagePrice == null && pkg.price != null) {
    pkg.packagePrice = pkg.price;
  }
  pkg.price = pkg.packagePrice;
  next();
});

const Package = mongoose.model("Package", packageSchema);
export default Package;
