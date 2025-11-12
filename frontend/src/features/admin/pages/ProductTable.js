import React, { useState, useEffect } from "react";
import API from "../../../services/api";
import "./AdminProductsPage.css";

function ProductTable({ products, onEdit, onDelete }) {
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

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
    let temp = products;

    if (searchTerm) {
      temp = temp.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      temp = temp.filter((p) => p.category === selectedCategory);
    }

    setFilteredProducts(temp);
  }, [products, searchTerm, selectedCategory]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await API.delete(`/products/${id}`);
        onDelete();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const getStockColor = (qty, reorderLevel = 10) => {
    if (qty === 0) return "#ff4d4d"; // Red
    if (qty < reorderLevel) return "#ffc107"; // Yellow
    return "#4caf50"; // Green
  };

  return (
    <div className="product-table">
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          className="btn-clear"
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("");
          }}
        >
          Clear
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price (Rs)</th>
            <th>Qty</th>
            <th>Image</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <tr key={p._id}>
                <td>{p.productCode}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.price}</td>
                <td style={{ color: getStockColor(p.quantity), fontWeight: "bold" }}>
                  {p.quantity}
                </td>
                <td>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="table-img" />}
                </td>
                <td>{p.description}</td>
                <td>
                  <button className="edit-btn" onClick={() => onEdit(p)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(p._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;

