import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

const Package = mongoose.model("Package", packageSchema);
export default Package;
