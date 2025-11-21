import React, { useEffect, useState } from "react";
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
  Upload,
  Tag,
  Divider,
} from "antd";
import { UploadOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
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
  return ["none", "percentage", "fixed"].includes(type) ? type : "none";
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

const safeNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsed =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const deriveOriginalPrice = (product) => {
  if (Array.isArray(product?.variants) && product.variants.length) {
    const prices = product.variants
      .map((v) => safeNumber(v.price, null))
      .filter((n) => n != null);
    if (prices.length) return Math.min(...prices);
  }
  return safeNumber(
    product?.originalPrice ??
      product?.unitPrice ??
      product?.price ??
      product?.finalPrice ??
      0
  );
};

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

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [variantImageFiles, setVariantImageFiles] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const discountTypeWatch = normalizeDiscountType(Form.useWatch("discountType", form) || "none");
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      message.error("Failed to load products.");
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      message.error("Failed to load categories.");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    if (editingProduct) {
      const normalizedVariants =
        (editingProduct.variants && editingProduct.variants.length
          ? editingProduct.variants
          : [
              {
                brand: editingProduct.variations?.brand || "",
                size: editingProduct.variations?.size || "",
                color: editingProduct.variations?.color || "",
                sku: `${editingProduct.itemCode}-default`,
                price: deriveOriginalPrice(editingProduct),
                quantity: Number(editingProduct.quantity || 0),
                image: (editingProduct.images || [])[0] || "",
              },
            ]) || [];

      const cat = (categories || []).find(
        (c) => (c?.name || "").toLowerCase() === (editingProduct.category || "").toLowerCase()
      );
      setSubcategories(Array.isArray(cat?.subcategories) ? [...cat.subcategories] : []);

      form.setFieldsValue({
        itemCode: editingProduct.itemCode ?? editingProduct.productCode ?? "",
        name: editingProduct.name ?? "",
        category: editingProduct.category ?? "",
        subcategory: editingProduct.subcategory ?? "",
        shortDescription: editingProduct.shortDescription ?? "",
        discountType: normalizeDiscountType(editingProduct.discountType),
        discountValue: Number(editingProduct.discountValue ?? 0),
        variants: normalizedVariants,
      });
      setExistingImages(editingProduct.images || []);
      setNewImageFiles([]);
      setVariantImageFiles({});
    } else {
      form.resetFields();
      form.setFieldsValue({
        discountType: "none",
        discountValue: 0,
        variants: [
          { brand: "", size: "", color: "", sku: "", price: 0, quantity: 0, image: "" },
        ],
      });
      setSubcategories([]);
      setExistingImages([]);
      setNewImageFiles([]);
      setVariantImageFiles({});
    }
  }, [isModalOpen, editingProduct, categories, form]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!searchValue.trim()) {
        setFilteredProducts(products);
        setSuggestions([]);
      } else {
        const lower = searchValue.toLowerCase();
        const filtered = (products || []).filter((p) => {
          const name = p?.name?.toLowerCase() || "";
          const category = p?.category?.toLowerCase() || "";
          const code = (p?.itemCode ?? p?.productCode ?? "").toString().toLowerCase();
          return name.includes(lower) || category.includes(lower) || code.includes(lower);
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

  const buildFormData = (data, mainImageFiles = [], variantImageFilesMap = {}) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      if (value === null) {
        formData.append(key, "");
        return;
      }
      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
        return;
      }
      formData.append(key, value);
    });

    (mainImageFiles || []).forEach((file) => {
      const actualFile = file?.originFileObj || file;
      if (actualFile) {
        formData.append("images", actualFile);
      }
    });

    const variantIndexes = Object.keys(variantImageFilesMap)
      .map((k) => Number(k))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);

    variantIndexes.forEach((idx) => {
      const file = variantImageFilesMap[idx]?.[0]?.originFileObj || variantImageFilesMap[idx]?.[0];
      if (file) {
        formData.append("variantImages", file);
      }
    });

    return formData;
  };

  const handleAddOrUpdate = async (values) => {
    try {
      setLoading(true);
      const variantIndexes = Object.keys(variantImageFiles)
        .map((k) => Number(k))
        .filter((n) => !Number.isNaN(n))
        .sort((a, b) => a - b);

      const placeholderIndex = new Map();
      variantIndexes.forEach((fieldIdx, orderIdx) => {
        placeholderIndex.set(fieldIdx, orderIdx);
      });

      const variantPayload = (values.variants || []).map((variant, idx) => {
        const hasUpload = (variantImageFiles[idx] || []).length > 0;
        const placeholder = hasUpload
          ? `__variant_image__${placeholderIndex.get(idx) ?? 0}`
          : variant.image || "";

        return {
          _id: variant._id,
          brand: variant.brand || "",
          size: variant.size || "",
          color: variant.color || "",
          sku: variant.sku || `${values.itemCode}-${idx + 1}`,
          price: Number(variant.price || 0),
          quantity: Number(variant.quantity || 0),
          image: placeholder,
        };
      });

      const payload = {
        itemCode: values.itemCode,
        name: values.name,
        category: values.category,
        subcategory: values.subcategory,
        shortDescription: values.shortDescription || "",
        discountType: values.discountType || "none",
        discountValue: values.discountType === "none" ? 0 : Number(values.discountValue || 0),
        variants: variantPayload,
        existingImages,
      };

      const formData = buildFormData(payload, newImageFiles, variantImageFiles);

      if (editingProduct) {
        await updateProduct(editingProduct._id, formData);
        message.success("Product updated successfully!");
      } else {
        await addProduct(formData);
        message.success("Product added successfully!");
      }

      fetchProducts();
      setIsModalOpen(false);
      form.resetFields();
      setEditingProduct(null);
      setExistingImages([]);
      setNewImageFiles([]);
      setVariantImageFiles({});
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || "Failed to save product.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      message.success("Product deleted!");
      fetchProducts();
    } catch (error) {
      message.error("Failed to delete product.");
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const clearVariantImage = (idx) => {
    const variants = form.getFieldValue("variants") || [];
    const next = variants.map((v, i) => (i === idx ? { ...v, image: "" } : v));
    form.setFieldsValue({ variants: next });
  };

  const handleEdit = (record) => {
    const np = {
      ...record,
      itemCode: record.itemCode ?? record.productCode ?? "",
    };
    setEditingProduct(np);
    setIsModalOpen(true);
  };

  const openImagePreview = (url) => {
    if (url) setPreviewImage(url);
  };

  const columns = [
    { title: "Item Code", dataIndex: "itemCode", key: "itemCode" },
    { title: "Product Name", dataIndex: "name", key: "name" },
    {
      title: "Original Price",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (_, record) => formatCurrency(deriveOriginalPrice(record)),
    },
    {
      title: "Discount",
      key: "discount",
      render: (_, record) => formatDiscountLabel(record.discountType, record.discountValue),
    },
    {
      title: "Final Price",
      dataIndex: "finalPrice",
      key: "finalPrice",
      render: (_, record) => formatCurrency(deriveFinalPrice(record)),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (value, record) =>
        value ??
        (Array.isArray(record.variants)
          ? record.variants.reduce((sum, v) => sum + Number(v.quantity || 0), 0)
          : 0),
    },
    {
      title: "Variants",
      key: "variants",
      render: (_, record) =>
        Array.isArray(record.variants) && record.variants.length ? (
          <Space direction="vertical" size={0}>
            {record.variants.slice(0, 3).map((v) => (
              <span key={v._id || v.sku || `${v.brand}-${v.size}-${v.color}`}>
                {v.sku || "SKU"} • {v.color || "Color"} {v.size || ""} • Qty {v.quantity}
              </span>
            ))}
            {record.variants.length > 3 && <span>+{record.variants.length - 3} more</span>}
          </Space>
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

        <Button onClick={() => navigate("/admin/manage-quantity")}>Manage Quantity</Button>
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

      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
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

          <Divider orientation="left">Variants</Divider>
          <Form.List
            name="variants"
            rules={[
              {
                validator: async (_, variants) => {
                  if (!variants || variants.length < 1) {
                    return Promise.reject(new Error("At least one variant is required"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <div
                    key={key}
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <Space align="start" style={{ width: "100%" }} wrap>
                      <Form.Item
                        {...rest}
                        name={[name, "sku"]}
                        label="SKU"
                        rules={[{ required: true, message: "SKU required" }]}
                      >
                        <Input placeholder="SKU" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, "brand"]} label="Brand">
                        <Input placeholder="Brand" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, "size"]} label="Size">
                        <Input placeholder="Size" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, "color"]} label="Color">
                        <Input placeholder="Color" />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, "price"]}
                        label="Price"
                        rules={[{ required: true, message: "Price required" }]}
                      >
                        <InputNumber min={0} style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, "quantity"]}
                        label="Quantity"
                        rules={[{ required: true, message: "Quantity required" }]}
                      >
                        <InputNumber min={0} style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item label="Variant Image" style={{ minWidth: 220 }}>
                        <Upload
                          listType="text"
                          maxCount={1}
                          accept="image/*"
                          beforeUpload={() => false}
                          fileList={variantImageFiles[name] || []}
                          onChange={({ fileList }) =>
                            setVariantImageFiles((prev) => ({
                              ...prev,
                              [name]: fileList.slice(0, 1),
                            }))
                          }
                        >
                          <Button icon={<UploadOutlined />}>Select</Button>
                        </Upload>
                        <div style={{ fontSize: 12, color: "#888" }}>
                          Leave empty to keep existing (when editing).
                        </div>
                        {(() => {
                          const currentImage = form.getFieldValue(["variants", name, "image"]);
                          return currentImage ? (
                            <Space size="small" style={{ marginTop: 6 }}>
                              <Button size="small" onClick={() => openImagePreview(currentImage)}>
                                View current
                              </Button>
                              <Button
                                size="small"
                                danger
                                onClick={() => clearVariantImage(name)}
                              >
                                Remove current
                              </Button>
                            </Space>
                          ) : (
                            <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                              No existing variant image.
                            </div>
                          );
                        })()}
                      </Form.Item>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        disabled={fields.length === 1}
                      >
                        Delete Variant
                      </Button>
                    </Space>
                  </div>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
                  Add Variant
                </Button>
              </>
            )}
          </Form.List>

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
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          )}

          {existingImages.length > 0 && (
            <Form.Item label="Existing Images">
              <Space wrap size={[8, 8]}>
                {existingImages.map((url, idx) => (
                  <Tag
                    key={`${url}-${idx}`}
                    closable
                    onClose={(e) => {
                      e.preventDefault();
                      setExistingImages((prev) => prev.filter((img) => img !== url));
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <span onClick={() => openImagePreview(url)}>{`img ${idx + 1}`}</span>
                  </Tag>
                ))}
              </Space>
            </Form.Item>
          )}

          <Form.Item label="Upload Main Images">
            <Upload
              listType="text"
              multiple
              accept="image/*"
              maxCount={10}
              fileList={newImageFiles}
              beforeUpload={() => false}
              onChange={({ fileList }) => setNewImageFiles(fileList.slice(0, 10))}
            >
              <Button icon={<UploadOutlined />}>Select Images</Button>
            </Upload>
            <div style={{ fontSize: 12, color: "#888" }}>
              Upload up to 10 images (max 5MB each). New uploads are added on top of retained images.
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!previewImage}
        onCancel={() => setPreviewImage(null)}
        footer={null}
        centered
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            style={{ width: "100%", objectFit: "contain" }}
          />
        )}
      </Modal>
    </div>
  );
};

export default AdminProductsPage;
