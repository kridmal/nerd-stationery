import React, { useState, useEffect } from "react";
import API from "../../../services/api";
import "./AdminProductsPage.css";

function ProductForm({ onSave, editingProduct, clearEditing }) {
  const [form, setForm] = useState({
    productCode: "",
    name: "",
    category: "",
    price: "",
    quantity: "",
    reorderLevel: 10,
    description: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const categories = [
    "Pens & Pencils",
    "Notebooks & Papers",
    "Art Supplies",
    "Office Accessories",
    "Files & Folders",
    "School Items",
    "Other",
  ];

  useEffect(() => {
    if (editingProduct) setForm(editingProduct);
  }, [editingProduct]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "ml_default");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dqxxcowol/image/upload",
        { method: "POST", body: data }
      );
      const uploadData = await res.json();

      if (uploadData.secure_url) {
        setForm((prev) => ({ ...prev, imageUrl: uploadData.secure_url }));
      } else {
        alert("Upload failed. Check Cloudinary settings.");
      }
    } catch (error) {
      console.error(error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.category || !form.price || !form.quantity) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return alert("Unauthorized: Please login again.");

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingProduct?._id) {
        await API.put(`/products/${editingProduct._id}`, form, config);
        alert("Product updated successfully!");
      } else {
        await API.post("/products", form, config);
        alert("Product added successfully!");
      }

      setForm({
        productCode: "",
        name: "",
        category: "",
        price: "",
        quantity: "",
        reorderLevel: 10,
        description: "",
        imageUrl: "",
      });
      setImageFile(null);
      clearEditing();
      onSave();
    } catch (error) {
      console.error(error);
      alert("Error saving product.");
    }
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
      <div className="form-grid">
        <input
          type="text"
          name="productCode"
          placeholder="Product Code"
          value={form.productCode}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="price"
          placeholder="Price (Rs)"
          value={form.price}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="reorderLevel"
          placeholder="Reorder Level"
          value={form.reorderLevel}
          onChange={handleChange}
        />
      </div>

      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
      ></textarea>

      <div className="image-upload-section">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {uploading ? (
          <p>Uploading...</p>
        ) : form.imageUrl ? (
          <img src={form.imageUrl} alt="preview" className="preview-image" />
        ) : null}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit">
          {editingProduct ? "Update Product" : "Add Product"}
        </button>
        {editingProduct && (
          <button type="button" className="btn-cancel" onClick={clearEditing}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ProductForm;

