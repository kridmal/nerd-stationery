﻿import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  AutoComplete,
  Space,
} from "antd";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from "../../../services/api";
import { useNavigate } from "react-router-dom";

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]); // ✅ new state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showVariation, setShowVariation] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch products
  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      message.error("Failed to load products.");
    }
  };

  // ✅ Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      message.error("Failed to load categories.");
    }
  };

  // Subcategories are derived from the selected category

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Ensure form fields reflect correct quantities when modal opens
  useEffect(() => {
    if (!isModalOpen) return;
    if (editingProduct) {
      // Sync subcategories list to the editing product's category
      const np = {
        itemCode: editingProduct.itemCode ?? editingProduct.productCode ?? "",
        name: editingProduct.name ?? "",
        category: editingProduct.category ?? "",
        subcategory: editingProduct.subcategory ?? "",
        unitPrice: editingProduct.unitPrice ?? editingProduct.price ?? 0,
        quantity: Number(editingProduct.quantity ?? 0),
        variations: editingProduct.variations ?? null,
      };
      const cat = (categories || []).find(
        (c) => (c?.name || "").toLowerCase() === (np.category || "").toLowerCase()
      );
      let list = Array.isArray(cat?.subcategories) ? [...cat.subcategories] : [];
      if (
        np.subcategory &&
        !list.find((s) => (s?.name || "").toLowerCase() === np.subcategory.toLowerCase())
      ) {
        list.unshift({ _id: "__current__", name: np.subcategory });
      }
      setSubcategories(list);
      form.setFieldsValue({
        itemCode: np.itemCode,
        name: np.name,
        category: np.category,
        subcategory: np.subcategory,
        unitPrice: np.unitPrice,
        existingQuantity: np.quantity,
        addNewQuantity: null,
        brand: np.variations?.brand || "",
        size: np.variations?.size || "",
        color: np.variations?.color || "",
      });
    } else {
      form.setFieldsValue({ existingQuantity: 0, addNewQuantity: 0 });
      setSubcategories([]);
    }
  }, [isModalOpen, editingProduct, categories, form]);

  // ✅ Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!searchValue.trim()) {
        setFilteredProducts(products);
        setSuggestions([]);
      } else {
        const lower = searchValue.toLowerCase();
        const filtered = products.filter((p) => {
          const name = p?.name?.toLowerCase() || "";
          const category = p?.category?.toLowerCase() || "";
          return name.includes(lower) || category.includes(lower);
        });

        setFilteredProducts(filtered);
        setSuggestions(
          filtered.slice(0, 5).map((p) => ({
            value: p?.name || "(Unnamed Product)",
          }))
        );
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchValue, products]);

  // ✅ Add or Update
  const handleAddOrUpdate = async (values) => {
    try {
      setLoading(true);

      const base = {
        name: values.name,
        category: values.category,
        subcategory: values.subcategory,
        unitPrice: values.unitPrice,
        variations: showVariation
          ? {
              brand: values.brand || "",
              size: values.size || "",
              color: values.color || "",
            }
          : null,
      };

      if (editingProduct) {
        const productData = {
          ...base,
          itemCode: editingProduct.itemCode,
          addNewQuantity: Number(values.addNewQuantity || 0),
        };
        await updateProduct(editingProduct._id, productData);
        message.success("Product updated successfully!");
      } else {
        const productData = {
          ...base,
          itemCode: values.itemCode,
          existingQuantity: 0, // default existing quantity stays 0 for add
          addNewQuantity: Number(values.addNewQuantity || 0),
        };
        await addProduct(productData);
        message.success("Product added successfully!");
      }

      fetchProducts();
      setIsModalOpen(false);
      form.resetFields();
      setEditingProduct(null);
      setShowVariation(false);
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || "Failed to save product.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      message.success("Product deleted!");
      fetchProducts();
    } catch (error) {
      message.error("Failed to delete product.");
    }
  };

  // ✅ Add Product Button
  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ existingQuantity: 0, addNewQuantity: 0 });
    setIsModalOpen(true);
  };

  // ✅ Edit Product
  const handleEdit = (record) => {
    const np = {
      _id: record._id,
      itemCode: record.itemCode ?? record.productCode ?? "",
      name: record.name ?? "",
      category: record.category ?? "",
      subcategory: record.subcategory ?? "",
      unitPrice: record.unitPrice ?? record.price ?? 0,
      quantity: Number(record.quantity ?? 0),
      variations: record.variations ?? null,
    };
    setEditingProduct(np);
    setShowVariation(!!np.variations);
    setIsModalOpen(true);
    // Defer filling until after modal+form mount to avoid timing issues
    setTimeout(() => {
      // Ensure subcategories reflect the product's category
      const cat = (categories || []).find(
        (c) => (c?.name || "").toLowerCase() === (np.category || "").toLowerCase()
      );
      setSubcategories(cat?.subcategories || []);

      form.setFieldsValue({
        itemCode: np.itemCode,
        name: np.name,
        category: np.category,
        subcategory: np.subcategory,
        unitPrice: np.unitPrice,
        existingQuantity: np.quantity,
        addNewQuantity: null,
        brand: np.variations?.brand || "",
        size: np.variations?.size || "",
        color: np.variations?.color || "",
      });
    }, 0);
  };

  // ✅ Table Columns
  const columns = [
    { title: "Item Code", dataIndex: "itemCode", key: "itemCode" },
    { title: "Product Name", dataIndex: "name", key: "name" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Subcategory", dataIndex: "subcategory", key: "subcategory" },
    { title: "Unit Price", dataIndex: "unitPrice", key: "unitPrice" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Variation",
      key: "variation",
      render: (_, record) =>
        record.variations ? (
          <>
            <div>Brand: {record.variations.brand}</div>
            <div>Size: {record.variations.size}</div>
            <div>Color: {record.variations.color}</div>
          </>
        ) : (
          "-"
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "30px" }}>
      <h2>📦 Manage Products</h2>

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Button type="primary" onClick={handleAddProduct}>
          ➕ Add Product
        </Button>

        <Button onClick={fetchProducts}>🔄 Refresh</Button>

        <Button type="dashed" onClick={() => navigate("/admin/categories")}>
          🗂️ Manage Categories
        </Button>

        <Button onClick={() => navigate("/admin/manage-quantity")}>📊 Manage Quantity</Button>

        <div style={{ marginLeft: "auto", minWidth: "250px" }}>
          <AutoComplete
            style={{ width: "100%" }}
            options={suggestions}
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search by name or category..."
            onSelect={(value) => {
              const matched = products.filter(
                (p) => (p?.name || "").toLowerCase() === value.toLowerCase()
              );
              setFilteredProducts(matched);
            }}
            allowClear
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="_id"
        pagination={{ pageSize: 6 }}
      />

      {/* ✅ Modal */}
      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
          form.resetFields();
          setShowVariation(false);
        }}
        footer={null}
        destroyOnClose
        maskClosable={false}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddOrUpdate}
          autoComplete="off"
        >
          <Form.Item
            name="itemCode"
            label="Item Code"
            rules={[{ required: true, message: "Please enter item code" }]}
          >
            <Input placeholder="Enter item code" disabled={!!editingProduct} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: "Please enter product name" }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select category" }]}
          >
            <Select
              placeholder="Select category"
              onChange={(val) => {
                const cat = (categories || []).find(
                  (c) => (c?.name || "") === val
                );
                setSubcategories(cat?.subcategories || []);
                // reset subcategory when category changes
                form.setFieldsValue({ subcategory: undefined });
              }}
            >
              {categories.map((cat) => (
                <Select.Option key={cat._id} value={cat.name}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="subcategory"
            label="Subcategory"
            rules={[{ required: true, message: "Please select subcategory" }]}
          >
            <Select placeholder="Select subcategory">
              {subcategories.map((sub) => (
                <Select.Option key={sub._id} value={sub.name}>
                  {sub.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="unitPrice"
            label="Unit Price"
            rules={[{ required: true, message: "Please enter unit price" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item name="existingQuantity" label="Existing Quantity">
            <InputNumber style={{ width: "100%" }} disabled min={0} />
          </Form.Item>

          <Form.Item name="addNewQuantity" label="Add New Quantity">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          {/* ✅ Variations */}
          <Form.Item label="Add Variation?">
            <Button
              type={showVariation ? "primary" : "default"}
              onClick={() => setShowVariation(!showVariation)}
            >
              {showVariation ? "Variation Enabled" : "Add Variation"}
            </Button>
          </Form.Item>

          {showVariation && (
            <>
              <Form.Item name="brand" label="Brand">
                <Input placeholder="Enter brand name" />
              </Form.Item>

              <Form.Item name="size" label="Size">
                <Input placeholder="Enter size (e.g. Medium, Large)" />
              </Form.Item>

              <Form.Item name="color" label="Color">
                <Input placeholder="Enter color" />
              </Form.Item>
            </>
          )}

          <Form.Item shouldUpdate={(prev, cur) =>
              prev.addNewQuantity !== cur.addNewQuantity ||
              prev.existingQuantity !== cur.existingQuantity
            }>
            {({ getFieldValue }) => {
              const existing = Number(getFieldValue("existingQuantity") || 0);
              const addNew = Number(getFieldValue("addNewQuantity") || 0);
              const total = existing + addNew;
              return (
                <div style={{ textAlign: "right", color: "#555", marginTop: 8 }}>
                  New Total Quantity: <strong>{total}</strong>
                </div>
              );
            }}
          </Form.Item>

          <Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminProductsPage;




