import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed"],
      default: "pending",
    },
    packageSelected: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
