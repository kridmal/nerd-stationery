import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
});

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    subcategories: [subCategorySchema],
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
