import Category from "../models/Category.js";

const serverError = (res) => res.status(500).json({ message: "Server error" });
const badRequest = (res, message) => res.status(400).json({ message });

// ✅ Get all categories (with subcategories)
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    serverError(res);
  }
};

// ✅ Add category
export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return badRequest(res, "Name is required");

    const existing = await Category.findOne({ name });
    if (existing) return badRequest(res, "Category already exists");

    const category = new Category({ name, subcategories: [] });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    serverError(res);
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
    serverError(res);
  }
};

// ✅ Delete category
export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (error) {
    serverError(res);
  }
};

// ✅ Add subcategory
export const addSubCategory = async (req, res) => {
  try {
    const { categoryId, name } = req.body;
    if (!name) return badRequest(res, "Subcategory name is required");

    const category = await Category.findById(categoryId);
    category.subcategories.push({ name });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    serverError(res);
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
    serverError(res);
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
    serverError(res);
  }
};
