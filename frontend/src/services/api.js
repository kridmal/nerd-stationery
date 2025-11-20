import axios from "axios";

// Create an Axios instance
const API = axios.create({
  baseURL: "http://54.179.149.89/api",
});

// âœ… Automatically attach admin token (if exists)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// âœ… Product APIs
const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const getProducts = async () => {
  try {
    const res = await API.get("/products");
    return normalizeListResponse(res.data);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const addProduct = async (productData) => {
  try {
    const isFormData =
      typeof FormData !== "undefined" && productData instanceof FormData;
    const config = isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined;
    const res = await API.post("/products", productData, config);
    return res.data;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const isFormData =
      typeof FormData !== "undefined" && productData instanceof FormData;
    const config = isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined;
    const res = await API.put(`/products/${id}`, productData, config);
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

export const getProductActivities = async (params = {}) => {
  try {
    const res = await API.get("/products/activity", { params });
    return res.data;
  } catch (error) {
    console.error("Error fetching product activities:", error);
    return [];
  }
};

// Â· Minimum Quantity API
export const updateProductMinQuantity = async (id, minQuantity) => {
  try {
    const res = await API.put(`/products/${id}/min-quantity`, { minQuantity });
    return res.data;
  } catch (error) {
    console.error("Error updating product min quantity:", error);
    throw error;
  }
};

// âœ… Category APIs
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

// âœ… Subcategory APIs
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


// Handle auth errors globally: clear token and redirect to admin login
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const msg = String(error?.response?.data?.message || "").toLowerCase();
    const isAuthError =
      status === 401 ||
      status === 403 ||
      msg.includes("invalid token") ||
      msg.includes("jwt");
    if (isAuthError) {
      try {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
      } catch (_) {}
      if (typeof window !== "undefined") {
        window.location.href = "/admin-login";
      }
    }
    return Promise.reject(error);
  }
);
