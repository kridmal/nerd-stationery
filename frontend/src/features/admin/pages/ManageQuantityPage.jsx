import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, Form, Input, InputNumber, AutoComplete, message, Table, Tag, Space, Popconfirm } from "antd";
import { getProducts, updateProductMinQuantity } from "../../../services/api";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";

const ManageQuantityPage = () => {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const reloadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      message.error("Failed to load products");
    }
  };

  useEffect(() => {
    reloadProducts();
  }, []);

  const autoOptions = useMemo(() => {
    return products.map((p) => ({ value: p.itemCode || p.productCode || p.code || "" }));
  }, [products]);

  const handleItemCodeChange = (value) => {
    const code = (value || "").trim();
    const match = products.find(
      (p) => (p.itemCode || p.productCode || p.code || "").toLowerCase() === code.toLowerCase()
    );
    if (match) {
      form.setFieldsValue({ productName: match.name || "" });
    }
  };

  const handleSubmit = async (vals) => {
    try {
      const code = (vals.itemCode || "").trim();
      const minQty = Number(vals.minQuantity);
      if (!code) return message.warning("Please enter an item code");
      if (!Number.isFinite(minQty) || minQty < 0) {
        return message.warning("Please enter a valid minimum quantity");
      }

      const product = products.find(
        (p) => (p.itemCode || p.productCode || p.code || "").toLowerCase() === code.toLowerCase()
      );
      if (!product) return message.error("Product not found for the provided item code");

      setLoading(true);
      await updateProductMinQuantity(product._id, minQty);
      await reloadProducts();
      message.success("Minimum quantity level updated");
      setOpen(false);
      form.resetFields();
    } catch (e) {
      message.error("Failed to update minimum quantity");
    } finally {
      setLoading(false);
    }
  };

  const dataWithMin = useMemo(() => {
    return (products || []).filter((p) => Number(p.minQuantity) > 0);
  }, [products]);

  const columns = [
    {
      title: "Item Code",
      dataIndex: "itemCode",
      key: "itemCode",
      render: (_, record) => record.itemCode || record.productCode || record.code || "-",
    },
    { title: "Product Name", dataIndex: "name", key: "name" },
    { title: "Current Qty", dataIndex: "quantity", key: "quantity" },
    {
      title: "Min Qty Level",
      dataIndex: "minQuantity",
      key: "minQuantity",
      render: (val) => val ?? 0,
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const min = Number(record.minQuantity || 0);
        const qty = Number(record.quantity || 0);
        const below = qty < min;
        return (
          <Tag color={below ? "red" : "green"}>{below ? "Below Minimum" : "OK"}</Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => {
              setEditing(true);
              setOpen(true);
              const code = record.itemCode || record.productCode || record.code || "";
              form.setFieldsValue({
                itemCode: code,
                productName: record.name || "",
                minQuantity: Number(record.minQuantity || 0),
              });
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Remove minimum quantity?"
            okText="Yes"
            cancelText="No"
            onConfirm={async () => {
              try {
                setLoading(true);
                await updateProductMinQuantity(record._id, 0);
                await reloadProducts();
                message.success("Minimum quantity removed");
              } catch (e) {
                message.error("Failed to remove minimum quantity");
              } finally {
                setLoading(false);
              }
            }}
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout title="Manage Quantity Level" subtitle="Set minimum stock thresholds">
      <div style={{ padding: 10 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/admin/products")}>Back to Products</Button>
          <Button
            type="primary"
            onClick={() => {
              setEditing(false);
              form.resetFields();
              setOpen(true);
            }}
          >
            Set Quantity Level
          </Button>
        </div>

        <Table
          style={{ marginTop: 16 }}
          columns={columns}
          dataSource={dataWithMin}
          rowKey="_id"
          pagination={{ pageSize: 8 }}
        />

        <Modal
          title="Set Minimum Quantity Level"
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          destroyOnClose
          centered
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
            <Form.Item label="Item Code" name="itemCode" rules={[{ required: true, message: "Item code is required" }]}>
              {editing ? (
                <Input readOnly />
              ) : (
                <AutoComplete
                  options={autoOptions}
                  onChange={handleItemCodeChange}
                  onSelect={handleItemCodeChange}
                  placeholder="Type item code"
                  filterOption={(inputValue, option) =>
                    (option?.value || "").toLowerCase().includes((inputValue || "").toLowerCase())
                  }
                />
              )}
            </Form.Item>

            <Form.Item label="Product Name" name="productName">
              <Input readOnly placeholder="Auto-filled by item code" />
            </Form.Item>

            <Form.Item
              label="Minimum Quantity Level"
              name="minQuantity"
              rules={[{ required: true, message: "Minimum quantity is required" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Save
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default ManageQuantityPage;


