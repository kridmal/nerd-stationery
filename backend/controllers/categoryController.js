import Category from "../models/Category.js";

// ✅ Get all categories (with subcategories)
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Add category
export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    const category = new Category({ name, subcategories: [] });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Edit category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await Category.findByIdAndUpdate(id, { name }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete category
export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Add subcategory
export const addSubCategory = async (req, res) => {
  try {
    const { categoryId, name } = req.body;
    if (!name) return res.status(400).json({ message: "Subcategory name is required" });

    const category = await Category.findById(categoryId);
    category.subcategories.push({ name });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Edit subcategory
export const updateSubCategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId, name } = req.body;

    const category = await Category.findById(categoryId);
    const subcategory = category.subcategories.id(subcategoryId);
    subcategory.name = name;
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete subcategory
export const deleteSubCategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const category = await Category.findById(categoryId);
    category.subcategories = category.subcategories.filter(
      (sub) => sub._id.toString() !== subcategoryId
    );
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
