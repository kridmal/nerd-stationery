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

    // Calculate updated total quantity
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
