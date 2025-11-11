import express from "express";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", addCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

// Subcategory routes
router.post("/sub", addSubCategory);
router.put("/sub", updateSubCategory);
router.delete("/:categoryId/sub/:subcategoryId", deleteSubCategory);

export default router;
