import express from "express";
import Product from "../models/Product.js";
import authAdmin from "../middleware/authAdmin.js";
import { createProduct, updateProduct } from "../controllers/productController.js";

const router = express.Router();
const allowedDiscountTypes = ["none", "percentage", "fixed"];

const normalizeDiscountType = (type) => {
  if (allowedDiscountTypes.includes(type)) return type;
  return "none";
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add Product (admin only)
router.post("/", authAdmin, createProduct);

// Update Product (admin only)
router.put("/:id", authAdmin, updateProduct);

// Update only minimum quantity (admin only)
router.put("/:id/min-quantity", authAdmin, async (req, res) => {
  try {
    const { minQuantity } = req.body;
    if (minQuantity == null || Number(minQuantity) < 0) {
      return res
        .status(400)
        .json({ message: "minQuantity must be a non-negative number" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.minQuantity = Number(minQuantity);
    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error("Error updating min quantity:", error);
    res.status(400).json({ message: error.message });
  }
});

// Delete Product (admin only)
router.delete("/:id", authAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
