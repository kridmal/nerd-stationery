import React, { useEffect, useMemo, useState } from "react";
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
import { Tooltip } from "antd";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from "../../../services/api";
import { useNavigate } from "react-router-dom";

const clamp = (value, min = 0, max = Number.POSITIVE_INFINITY) => {
  const num = Number(value);
  if (Number.isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

const normalizeDiscountType = (type) => {
  if (!type) return "none";
  return type === "value" ? "fixed" : type;
};

const calculateFinalPrice = (originalPrice, discountType, discountValue) => {
  const base = Number(originalPrice) || 0;
  const type = normalizeDiscountType(discountType);
  const value = Number(discountValue) || 0;

  if (type === "percentage") {
    const pct = clamp(value, 0, 100);
    return Number(Math.max(0, base - base * (pct / 100)).toFixed(2));
  }

  if (type === "fixed") {
    const fixed = clamp(value, 0, base);
    return Number(Math.max(0, base - fixed).toFixed(2));
  }

  return Number(base.toFixed(2));
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const formatDiscountLabel = (type, value) => {
  const normalizedType = normalizeDiscountType(type);
  const numericValue = safeNumber(value, 0);
  if (normalizedType === "percentage") {
    return `${numericValue}% OFF`;
  }
  if (normalizedType === "fixed") {
    return `Rs ${numericValue.toFixed(2)} OFF`;
  }
  return "No Discount";
};

const safeNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsed =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const deriveOriginalPrice = (product) =>
  safeNumber(
    product?.originalPrice ??
      product?.unitPrice ??
      product?.price ??
      product?.finalPrice ??
      0
  );

const deriveFinalPrice = (product) => {
  if (product?.finalPrice != null) return safeNumber(product.finalPrice, 0);
  const original = deriveOriginalPrice(product);
  const type = normalizeDiscountType(product?.discountType);
  const value = safeNumber(product?.discountValue, 0);
  if (type === "none" || value === 0) {
    return safeNumber(
      product?.unitPrice ?? product?.price ?? product?.originalPrice ?? original,
      original
    );
  }
  return calculateFinalPrice(original, type, value);
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]); // ? new state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showVariation, setShowVariation] = useState(false);
  const [loading, setLoading] = useState(false);
  const discountTypeWatch = normalizeDiscountType(Form.useWatch("discountType", form) || "none");
  const discountValueWatch = Form.useWatch("discountValue", form) || 0;
  const originalPriceWatch = Form.useWatch("originalPrice", form) || 0;
  const finalPricePreview = useMemo(
    () => calculateFinalPrice(originalPriceWatch, discountTypeWatch, discountValueWatch),
    [originalPriceWatch, discountTypeWatch, discountValueWatch]
  );
  const navigate = useNavigate();

  // ? Fetch products
  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      message.error("Failed to load products.");
    }
  };

  // ? Fetch categories
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
      const np = {
        itemCode: editingProduct.itemCode ?? editingProduct.productCode ?? "",
        name: editingProduct.name ?? "",
        category: editingProduct.category ?? "",
        subcategory: editingProduct.subcategory ?? "",
        originalPrice: deriveOriginalPrice(editingProduct),
        quantity: Number(editingProduct.quantity ?? 0),
        variations: editingProduct.variations ?? null,
        shortDescription: editingProduct.shortDescription ?? "",
        discountType: normalizeDiscountType(editingProduct.discountType),
        discountValue: Number(editingProduct.discountValue ?? 0),
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
        originalPrice: np.originalPrice,
        existingQuantity: np.quantity,
        addNewQuantity: null,
        shortDescription: np.shortDescription,
        brand: np.variations?.brand || "",
        size: np.variations?.size || "",
        color: np.variations?.color || "",
        discountType: np.discountType || "none",
        discountValue: np.discountType === "none" ? 0 : np.discountValue,
      });
    } else {
      form.setFieldsValue({
        existingQuantity: 0,
        addNewQuantity: 0,
        discountType: "none",
        discountValue: 0,
      });
      setSubcategories([]);
    }
  }, [isModalOpen, editingProduct, categories, form]);

  // ? Debounced search
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

  // ? Add or Update
  const handleAddOrUpdate = async (values) => {
    try {
      setLoading(true);

      const normalizedDiscountType = normalizeDiscountType(values.discountType || "none");
      const normalizedDiscountValue =
        normalizedDiscountType === "none" ? 0 : Number(values.discountValue || 0);

      const base = {
        name: values.name,
        category: values.category,
        subcategory: values.subcategory,
        originalPrice: Number(values.originalPrice || 0),
        shortDescription: values.shortDescription || "",
        variations: showVariation
          ? {
              brand: values.brand || "",
              size: values.size || "",
              color: values.color || "",
            }
          : null,
        discountType: normalizedDiscountType,
        discountValue: normalizedDiscountValue,
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
          existingQuantity: 0,
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

  // ? Delete
  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      message.success("Product deleted!");
      fetchProducts();
    } catch (error) {
      message.error("Failed to delete product.");
    }
  };

  // ? Add Product Button
  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      existingQuantity: 0,
      addNewQuantity: 0,
      discountType: "none",
      discountValue: 0,
    });
    setShowVariation(false);
    setSubcategories([]);
    setIsModalOpen(true);
  };

  // ? Edit Product
  const handleEdit = (record) => {
    const np = {
      itemCode: record.itemCode ?? record.productCode ?? "",
      name: record.name ?? "",
      category: record.category ?? "",
      subcategory: record.subcategory ?? "",
      originalPrice: deriveOriginalPrice(record),
      quantity: Number(record.quantity ?? 0),
      variations: record.variations ?? null,
      shortDescription: record.shortDescription ?? "",
      discountType: normalizeDiscountType(record.discountType),
      discountValue: Number(record.discountValue ?? 0),
      _id: record._id,
    };
    setEditingProduct(np);
    setShowVariation(!!np.variations);
    setIsModalOpen(true);
  };

  // ? Table Columns
  const columns = [
    { title: "Item Code", dataIndex: "itemCode", key: "itemCode" },
    { title: "Product Name", dataIndex: "name", key: "name" },
    {
      title: "Short Description",
      dataIndex: "shortDescription",
      key: "shortDescription",
      render: (text) => text || "-",
    },
    {
      title: "Original Price",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (_, record) => formatCurrency(deriveOriginalPrice(record)),
    },
    {
      title: "Discount Type",
      dataIndex: "discountType",
      key: "discountType",
      render: (value) => normalizeDiscountType(value || "none"),
    },
    {
      title: "Discount Value",
      key: "discountValue",
      render: (_, record) => {
        const type = normalizeDiscountType(record.discountType) || "none";
        if (type === "none") {
          return <span style={{ color: "#888" }}>No Discount</span>;
        }
        const label = formatDiscountLabel(type, record.discountValue);
        return (
          <Tooltip title={label}>
            <span>{label}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "Final Price (Auto)",
      dataIndex: "finalPrice",
      key: "finalPrice",
      render: (value, record) => {
        const finalValue =
          value != null && value !== ""
            ? safeNumber(value, deriveFinalPrice(record))
            : deriveFinalPrice(record);
        const originalValue = deriveOriginalPrice(record);
        const normalizedType = normalizeDiscountType(record.discountType);
        const hasDiscount =
          normalizedType !== "none" &&
          Number(record.discountValue) > 0 &&
          originalValue > finalValue;
        const label = hasDiscount
          ? formatDiscountLabel(normalizedType, record.discountValue)
          : "No Discount";

        return (
          <Tooltip
            title={
              hasDiscount ? (
                <div>
                  <div style={{ textDecoration: "line-through", color: "#ff4d4f" }}>
                    {formatCurrency(originalValue)}
                  </div>
                  <div>{label}</div>
                </div>
              ) : (
                "No Discount Applied"
              )
            }
          >
            <span>{formatCurrency(finalValue)}</span>
          </Tooltip>
        );
      },
    },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Subcategory", dataIndex: "subcategory", key: "subcategory" },
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
      <h2>Manage Products</h2>

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
          Add Product
        </Button>

        <Button onClick={fetchProducts}>Refresh</Button>

        <Button type="dashed" onClick={() => navigate("/admin/categories")}>
          Manage Categories
        </Button>

        <Button onClick={() => navigate("/admin/manage-quantity")}>Manage Quantity</Button>{" "}
        <Button onClick={() => navigate("/admin/new-arrivals")}>New Arrivals</Button>
        <Button onClick={() => navigate("/admin/products/activity")}>
          Activity Table
        </Button>

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

      {/* ? Modal */}
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
            name="originalPrice"
            label="Original Price"
            rules={[{ required: true, message: "Please enter original price" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item name="existingQuantity" label="Existing Quantity">
            <InputNumber style={{ width: "100%" }} disabled min={0} />
          </Form.Item>

          <Form.Item name="addNewQuantity" label="Add New Quantity">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          {/* ? Variations */}
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

          <Form.Item
            name="discountType"
            label="Apply Discount?"
            initialValue="none"
            tooltip="Choose how the discount should be applied"
          >
            <Select>
              <Select.Option value="none">None</Select.Option>
              <Select.Option value="percentage">Percentage (%)</Select.Option>
              <Select.Option value="fixed">Fixed Value (Rs)</Select.Option>
            </Select>
          </Form.Item>

          {discountTypeWatch !== "none" && (
            <Form.Item
              name="discountValue"
              label="Discount Value"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, v) {
                    const t = getFieldValue("discountType");
                    const n = Number(v ?? 0);
                    if (t === "percentage") {
                      if (n < 0 || n > 100) {
                        return Promise.reject("Percentage must be between 0 and 100.");
                      }
                    }
                    if (t === "fixed") {
                      const base = Number(getFieldValue("originalPrice") ?? 0);
                      if (n > base) {
                        return Promise.reject("Fixed discount cannot exceed original price.");
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
                  if (discountTypeWatch === "fixed") return `Rs ${v}`;
                  return `${v}`;
                }}
                parser={(v) => (v || "").replace(/[^0-9.]/g, "")}
              />
            </Form.Item>
          )}

          <Form.Item label="Final Price (auto)">
            <Tooltip
              title={
                discountTypeWatch !== "none" && Number(discountValueWatch) > 0 ? (
                  <div>
                    <div style={{ textDecoration: "line-through" }}>
                      {formatCurrency(originalPriceWatch)}
                    </div>
                    <div>{formatDiscountLabel(discountTypeWatch, discountValueWatch)}</div>
                  </div>
                ) : (
                  "No Discount Applied"
                )
              }
            >
              <div
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d9d9d9",
                  borderRadius: 6,
                  background: "#fafafa",
                  fontWeight: 600,
                }}
              >
                {formatCurrency(finalPricePreview)}
              </div>
            </Tooltip>
          </Form.Item>

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










