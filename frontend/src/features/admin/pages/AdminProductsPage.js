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

  // ✅ Temporary subcategory data (can later fetch from backend)
  useEffect(() => {
    setSubcategories([
      { _id: "1", name: "Engine Parts" },
      { _id: "2", name: "Electrical Items" },
      { _id: "3", name: "Body Accessories" },
      { _id: "4", name: "Interior Parts" },
    ]);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

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

      const productData = {
        ...values,
        variations: showVariation
          ? {
              brand: values.brand || "",
              size: values.size || "",
              color: values.color || "",
            }
          : null,
      };

      if (editingProduct) {
        await updateProduct(editingProduct._id, productData);
        message.success("Product updated successfully!");
      } else {
        await addProduct(productData);
        message.success("Product added successfully!");
      }

      fetchProducts();
      setIsModalOpen(false);
      form.resetFields();
      setEditingProduct(null);
      setShowVariation(false);
    } catch (error) {
      message.error("Failed to save product.");
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
    form.setFieldsValue({ existingQuantity: 0 });
    setIsModalOpen(true);
  };

  // ✅ Edit Product
  const handleEdit = (record) => {
    setEditingProduct(record);
    setIsModalOpen(true);
    setShowVariation(!!record.variations);

    form.setFieldsValue({
      itemCode: record.itemCode,
      name: record.name,
      category: record.category,
      subcategory: record.subcategory,
      unitPrice: record.unitPrice,
      existingQuantity: record.quantity,
      addNewQuantity: null,
      brand: record.variations?.brand || "",
      size: record.variations?.size || "",
      color: record.variations?.color || "",
    });
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
          preserve={false}
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
            <Select placeholder="Select category">
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
            <InputNumber style={{ width: "100%" }} readOnly min={0} />
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
              {showVariation ? "✅ Variation Enabled" : "➕ Add Variation"}
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
