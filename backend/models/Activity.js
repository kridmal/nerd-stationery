import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    operation: {
      type: String,
      enum: ["ADD_PRODUCT", "UPDATE_PRODUCT", "DELETE_PRODUCT"],
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminUsername: {
      type: String,
      default: "Unknown Admin",
      trim: true,
    },
    adminEmail: {
      type: String,
      default: "",
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productItemCode: {
      type: String,
      default: "",
      trim: true,
    },
    productName: {
      type: String,
      default: "",
      trim: true,
    },
    changedFields: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
