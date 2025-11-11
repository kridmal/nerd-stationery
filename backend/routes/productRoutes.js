import express from "express";
import Product from "../models/Product.js";
import authAdmin from "../middleware/authAdmin.js";

const router = express.Router();

// ✅ Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Add Product (admin only)
router.post("/", authAdmin, async (req, res) => {
  try {
    const {
      itemCode,
      name,
      category,
      subcategory,
      unitPrice,
      existingQuantity = 0,
      addNewQuantity = 0,
      variations,
    } = req.body;

    const totalQuantity = Number(existingQuantity) + Number(addNewQuantity);

    const newProduct = new Product({
      itemCode,
      name,
      category,
      subcategory,
      unitPrice,
      quantity: totalQuantity,
      variations,
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("❌ Error adding product:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ Update Product (admin only)
router.put("/:id", authAdmin, async (req, res) => {
  try {
    const {
      itemCode,
      name,
      category,
      subcategory,
      unitPrice,
      existingQuantity = 0,
      addNewQuantity = 0,
      variations,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newTotalQuantity =
      Number(product.quantity || 0) + Number(addNewQuantity || 0);

    product.itemCode = itemCode;
    product.name = name;
    product.category = category;
    product.subcategory = subcategory;
    product.unitPrice = unitPrice;
    product.quantity = newTotalQuantity;
    product.variations = variations || null;

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ Delete Product (admin only)
router.delete("/:id", authAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
