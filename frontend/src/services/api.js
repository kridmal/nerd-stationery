import axios from "axios";

// Create an Axios instance
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// ✅ Automatically attach admin token (if exists)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Product APIs
export const getProducts = async () => {
  try {
    const res = await API.get("/products");
    return res.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const addProduct = async (productData) => {
  try {
    const res = await API.post("/products", productData);
    return res.data;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const res = await API.put(`/products/${id}`, productData);
    return res.data;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const res = await API.delete(`/products/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// ✅ Category APIs
export const getCategories = async () => {
  try {
    const res = await API.get("/categories");
    return res.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const addCategory = async (categoryData) => {
  try {
    const res = await API.post("/categories", categoryData);
    return res.data;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const res = await API.delete(`/categories/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

export const addSubcategory = async (categoryId, subcategoryName) => {
  try {
    const res = await API.post(`/categories/${categoryId}/subcategories`, {
      subcategory: subcategoryName,
    });
    return res.data;
  } catch (error) {
    console.error("Error adding subcategory:", error);
    throw error;
  }
};

// ✅ Subcategory APIs
export const addSubCategory = async (data) => {
  const res = await API.post("/categories/sub", data);
  return res.data;
};

export const updateSubCategory = async (data) => {
  const res = await API.put("/categories/sub", data);
  return res.data;
};

export const deleteSubCategory = async (categoryId, subcategoryId) => {
  const res = await API.delete(`/categories/${categoryId}/sub/${subcategoryId}`);
  return res.data;
};


export default API;
