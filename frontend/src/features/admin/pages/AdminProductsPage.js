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
  Popconfirm,
} from "antd";
import { Radio, Tooltip } from "antd";
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
  const [showDiscount, setShowDiscount] = useState(false);
  const [basePrice, setBasePrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const discountTypeWatch = Form.useWatch("discountType", form);
  const discountValueWatch = Form.useWatch("discountValue", form);
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
        discountType: editingProduct?.discountType ?? undefined,
        discountValue: editingProduct?.discountValue ?? undefined,
      });
      setShowDiscount(false);
      setBasePrice(Number(np.unitPrice ?? 0));
    } else {
      form.setFieldsValue({ existingQuantity: 0, addNewQuantity: 0 });
      setSubcategories([]);
      setBasePrice(Number(form.getFieldValue("unitPrice") ?? 0));
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
        const filtered = products.filter((p) => { const name = p?.name?.toLowerCase() || ""; const category = p?.category?.toLowerCase() || ""; const code = (p?.itemCode ?? p?.productCode ?? "").toString().toLowerCase(); return name.includes(lower) || category.includes(lower) || code.includes(lower); });

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

  // Live update Unit Price when discount changes
  useEffect(() => {
    if (!isModalOpen || !showDiscount) return;
    const bp = Number(basePrice ?? form.getFieldValue("unitPrice") ?? 0);
    const dv = Number(discountValueWatch ?? 0);
    const dt = discountTypeWatch;
    if (!dt || isNaN(bp)) return;
    let next = bp;
    if (dt === "percentage") {
      const pct = Math.min(Math.max(dv, 0), 90);
      next = Number((bp * (1 - pct / 100)).toFixed(2));
    } else if (dt === "value") {
      next = Number((isNaN(dv) ? 0 : dv).toFixed(2));
    }
    const current = Number(form.getFieldValue("unitPrice") ?? 0);
    if (!Number.isNaN(next) && current !== next) {
      form.setFieldsValue({ unitPrice: next });
    }
  }, [isModalOpen, showDiscount, discountTypeWatch, discountValueWatch, basePrice]);

  // ✅ Add or Update
  const handleAddOrUpdate = async (values) => {
    try {
      setLoading(true);

      const enteredDiscount = Number(values.discountValue ?? 0);
      const base = {
        name: values.name,
        category: values.category,
        subcategory: values.subcategory,
        unitPrice: values.unitPrice,
        shortDescription: values.shortDescription || "",
        variations: showVariation
          ? {
              brand: values.brand || "",
              size: values.size || "",
              color: values.color || "",
            }
          : null,
        discountType: showDiscount ? values.discountType ?? null : null,
        // For percentage: store percent; For fixed value: store original/base price for tooltip
        discountValue: showDiscount
          ? (values.discountType === "percentage"
              ? enteredDiscount
              : Number(basePrice ?? values.unitPrice ?? 0))
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
      itemCode: record.itemCode ?? record.productCode ?? "",
      name: record.name ?? "",
      category: record.category ?? "",
      subcategory: record.subcategory ?? "",
      unitPrice: record.unitPrice ?? record.price ?? 0,
      quantity: Number(record.quantity ?? 0),
      variations: record.variations ?? null,
      shortDescription: record.shortDescription ?? "",
      discountType: record.discountType ?? null,
      discountValue: record.discountValue ?? null,
      _id: record._id,
    };
    setEditingProduct(np);
    setShowVariation(!!np.variations);
    setShowDiscount(false);
    setBasePrice(Number(np.unitPrice ?? 0));
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
        shortDescription: np.shortDescription,
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
    { title: "Short Description", dataIndex: "shortDescription", key: "shortDescription" },
    {
      title: "Discount",
      key: "discount",
      render: (_, record) => {
        const type = record.discountType;
        const val = record.discountValue;
        if (!type || val == null) return <span style={{ color: "#888" }}>No Discount</span>;
        // Show the value exactly as the admin entered:
        // - percentage => stored in discountValue
        // - fixed value => admin entered the fixed Rs price, which is the current unitPrice
        const label =
          type === "percentage"
            ? `${val}%`
            : `Rs ${Number(record.unitPrice ?? 0).toFixed(2)}`;
        return (
          <Tooltip title={label}>
            <span>Discount Available</span>
          </Tooltip>
        );
      },
    },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Subcategory", dataIndex: "subcategory", key: "subcategory" },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (value, record) => {
        const type = record.discountType;
        const val = Number(record.discountValue);
        let original = null;
        if (type === "percentage" && !Number.isNaN(val) && val > 0 && val < 90) {
          const denom = 1 - val / 100;
          if (denom > 0) original = (Number(value) / denom).toFixed(2);
        } else if (type === "value" && !Number.isNaN(val) && val > 0) {
          // For fixed discount, we stored the original price as discountValue
          original = Number(val).toFixed(2);
        }
        const display = Number(value).toFixed(2);
        return original ? (
          <Tooltip title={`Original price: Rs ${original}`}>
            <span>Rs {display}</span>
          </Tooltip>
        ) : (
          <span>Rs {display}</span>
        );
      },
    },
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
          <Popconfirm
            title="Delete this product?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
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
        <Button onClick={() => navigate("/admin-dashboard")}>Back to Dashboard</Button>

        <Button type="primary" onClick={handleAddProduct}>
          ➕ Add Product
        </Button>

        <Button onClick={fetchProducts}>Refresh</Button>

        <Button type="dashed" onClick={() => navigate("/admin/categories")}>
          🗂️ Manage Categories
        </Button>

        <Button onClick={() => navigate("/admin/manage-quantity")}>📊 Manage Quantity</Button> <Button onClick={() => navigate("/admin/new-arrivals")}>New Arrivals</Button>

        <div style={{ marginLeft: "auto", minWidth: "250px" }}>
          <AutoComplete
            style={{ width: "100%" }}
            options={suggestions}
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search by item code, name or category..."
            onSelect={(value) => {
              const v = String(value || "").toLowerCase();
              const matched = products.filter((p) => {
                const name = (p?.name || "").toLowerCase();
                const category = (p?.category || "").toLowerCase();
                const code = (p?.itemCode ?? p?.productCode ?? "").toString().toLowerCase();
                return name === v || category === v || code === v;
              });
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

          <Form.Item name="shortDescription" label="Short Description">
            <Input.TextArea rows={2} placeholder="Optional short description" />
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
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              onChange={(val) => {
                if (showDiscount) {
                  setBasePrice(Number(val || 0));
                }
              }}
            />
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

          {/* Discount */}
          <Form.Item label="Add Discount?">
            <Button
              type={showDiscount ? "primary" : "default"}
              onClick={() => {
                const next = !showDiscount;
                if (next) {
                  const current = Number(form.getFieldValue("unitPrice") || 0);
                  setBasePrice(current);
                } else {
                  const bp = Number(basePrice ?? (form.getFieldValue("unitPrice") ?? 0));
                  form.setFieldsValue({ discountType: undefined, discountValue: undefined, unitPrice: bp });
                  setBasePrice(null);
                }
                setShowDiscount(next);
              }}
            >
              {showDiscount ? "Discount Enabled" : "Add Discount"}
            </Button>
          </Form.Item>

          {showDiscount && (
            <>
              <Form.Item name="discountType" label="Discount Type">
                <Radio.Group>
                  <Radio value="percentage">Percentage (%)</Radio>
                  <Radio value="value">Fixed Value (Rs)</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="discountValue"
                label="Discount Value"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, v) {
                      if (!showDiscount) return Promise.resolve();
                      const t = getFieldValue("discountType");
                      const n = Number(v ?? 0);
                      if (t === "percentage") {
                        if (n < 0 || n > 90) {
                          return Promise.reject("Percentage cannot exceed 90%.");
                        }
                      }
                      if (t === "value") {
                        const bp = Number(basePrice ?? getFieldValue("unitPrice") ?? 0);
                        if (n > bp) {
                          return Promise.reject("Fixed value cannot be greater than original price.");
                        }
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(v) => {
                    if (v == null || v === "") return "";
                    if (discountTypeWatch === "percentage") return `${v}%`;
                    if (discountTypeWatch === "value") return `Rs ${v}`;
                    return `${v}`;
                  }}
                  parser={(v) => (v || "").replace(/[^0-9.]/g, "")}
                />
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








