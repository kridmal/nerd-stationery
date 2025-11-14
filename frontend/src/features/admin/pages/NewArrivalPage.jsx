import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  AutoComplete,
  Table,
  Space,
  Popconfirm,
  message,
} from "antd";
import { getProducts } from "../../../services/api";
import { useNavigate } from "react-router-dom";

const storageKey = "newArrivals";

const toNumeric = (value) => {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const NewArrivalPage = () => {
  const [products, setProducts] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // index
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // load products and local arrivals
  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        message.error("Failed to fetch products");
      }
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const normalized = (Array.isArray(saved) ? saved : []).map((item) => ({
          ...item,
          finalPrice: toNumeric(item.finalPrice ?? item.unitPrice ?? 0),
          originalPrice: toNumeric(
            item.originalPrice ?? item.unitPrice ?? item.finalPrice ?? 0
          ),
        }));
        setArrivals(normalized);
      } catch {
        setArrivals([]);
      }
    })();
  }, []);

  const saveArrivals = (list) => {
    setArrivals(list);
    localStorage.setItem(storageKey, JSON.stringify(list));
  };

  const autoOptions = useMemo(
    () => (products || []).map((p) => ({ value: p.itemCode || p.productCode || "" })),
    [products]
  );

  const onItemCodeChange = (val) => {
    const code = (val || "").trim().toLowerCase();
    const p = (products || []).find(
      (x) => (x.itemCode || x.productCode || "").toLowerCase() === code
    );
    if (p) {
      const finalPrice = toNumeric(
        p.finalPrice ?? p.originalPrice ?? p.unitPrice ?? p.price ?? 0
      );
      const originalPrice = toNumeric(
        p.originalPrice ?? p.finalPrice ?? p.unitPrice ?? p.price ?? finalPrice
      );
      const discountStatus =
        p.discountType && p.discountType !== "none"
          ? p.discountType === "percentage"
            ? `${Number(p.discountValue || 0)}% OFF`
            : `Rs ${Number(p.discountValue || 0).toFixed(2)} OFF`
          : "No Discount";

      form.setFieldsValue({
        name: p.name || "",
        shortDescription: p.shortDescription || "",
        finalPrice,
        originalPrice,
        category: p.category || "",
        subcategory: p.subcategory || "",
        discountStatus,
        brand: p.variations?.brand || "",
        size: p.variations?.size || "",
        color: p.variations?.color || "",
      });
    }
  };

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (record, index) => {
    setEditing(index);
    setOpen(true);
    form.setFieldsValue({
      itemCode: record.itemCode,
      name: record.name,
      shortDescription: record.shortDescription,
      finalPrice: record.finalPrice,
      originalPrice: record.originalPrice,
      category: record.category,
      subcategory: record.subcategory,
      discountStatus: record.discountStatus,
      brand: record.brand,
      size: record.size,
      color: record.color,
    });
  };

  const handleSubmit = async (vals) => {
    try {
      setLoading(true);
      const entry = {
        itemCode: vals.itemCode,
        name: vals.name,
        shortDescription: vals.shortDescription || "",
        finalPrice: toNumeric(vals.finalPrice || 0),
        originalPrice: toNumeric(vals.originalPrice || vals.finalPrice || 0),
        unitPrice: toNumeric(vals.finalPrice || 0),
        category: vals.category,
        subcategory: vals.subcategory,
        discountStatus: vals.discountStatus || "No Discount",
        brand: vals.brand || "",
        size: vals.size || "",
        color: vals.color || "",
        id: editing != null ? arrivals[editing]?.id : `${Date.now()}-${vals.itemCode}`,
      };
      const next = [...arrivals];
      if (editing != null) next[editing] = entry;
      else next.unshift(entry);
      saveArrivals(next);
      setOpen(false);
      setEditing(null);
      form.resetFields();
      message.success("Saved new arrival");
    } catch (e) {
      message.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Item Code", dataIndex: "itemCode", key: "itemCode" },
    { title: "Product Name", dataIndex: "name", key: "name" },
    { title: "Short Description", dataIndex: "shortDescription", key: "shortDescription" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Subcategory", dataIndex: "subcategory", key: "subcategory" },
    {
      title: "Final Price",
      dataIndex: "finalPrice",
      key: "finalPrice",
      render: (value) => `Rs ${toNumeric(value).toFixed(2)}`,
    },
    {
      title: "Original Price",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (value) => `Rs ${toNumeric(value).toFixed(2)}`,
    },
    { title: "Discount", dataIndex: "discountStatus", key: "discountStatus" },
    {
      title: "Variation",
      key: "variation",
      render: (_, r) => (
        <span>
          {r.brand || r.size || r.color
            ? [r.brand, r.size, r.color].filter(Boolean).join(" / ")
            : "-"}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record, index) => (
        <Space size="small">
          <Button size="small" onClick={() => openEdit(record, index)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this new arrival?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => {
              const next = [...arrivals];
              next.splice(index, 1);
              saveArrivals(next);
            }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 30 }}>
      <h2>New Arrivals</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Button onClick={() => navigate("/admin/products")}>Back to Products</Button>
        <Button type="primary" onClick={openAdd}>Add New Arrival Product</Button>
      </div>

      <Table columns={columns} dataSource={arrivals} rowKey={(r) => r.id} pagination={{ pageSize: 8 }} />

      <Modal
        title={editing != null ? "Edit New Arrival" : "Add New Arrival"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item label="Item Code" name="itemCode" rules={[{ required: true, message: "Item code is required" }]}>
            <AutoComplete
              options={autoOptions}
              onChange={onItemCodeChange}
              onSelect={onItemCodeChange}
              placeholder="Type item code"
              disabled={editing != null}
              filterOption={(inputValue, option) =>
                (option?.value || "").toLowerCase().includes((inputValue || "").toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item label="Product Name" name="name" rules={[{ required: true, message: "Product name is required" }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Short Description" name="shortDescription">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            label="Final Price"
            name="finalPrice"
            rules={[{ required: true, message: "Final price is required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} disabled />
          </Form.Item>

          <Form.Item label="Original Price" name="originalPrice">
            <InputNumber min={0} style={{ width: "100%" }} disabled />
          </Form.Item>

          <Form.Item label="Category" name="category" rules={[{ required: true, message: "Category is required" }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Sub Category" name="subcategory" rules={[{ required: true, message: "Subcategory is required" }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Discount Status" name="discountStatus">
            <Input readOnly placeholder="Auto-filled from product discount" />
          </Form.Item>

          <Form.Item label="Brand" name="brand">
            <Input />
          </Form.Item>

          <Form.Item label="Size" name="size">
            <Input />
          </Form.Item>

          <Form.Item label="Color" name="color">
            <Input />
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button onClick={() => { setOpen(false); setEditing(null); form.resetFields(); }}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NewArrivalPage;
