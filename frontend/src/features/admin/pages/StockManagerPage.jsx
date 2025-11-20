import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, message, Space, Table, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { getProducts } from "../../../services/api";
import "./AdminDashboardPage.css";

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;
const getItemCode = (product) => product?.itemCode || product?.productCode || product?.code || "-";
const getOriginalPrice = (product) =>
  Number(product?.originalPrice ?? product?.unitPrice ?? product?.price ?? 0);

const StockManagerPage = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error("Unable to load stock data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const dataSource = useMemo(
    () =>
      products.map((product) => {
        const quantity = Number(product?.quantity ?? 0);
        const minQuantity = Number(product?.minQuantity ?? 0);
        return {
          key: product?._id || getItemCode(product),
          itemCode: getItemCode(product),
          name: product?.name || "Unnamed Product",
          originalPrice: getOriginalPrice(product),
          category: product?.category || "Uncategorized",
          subcategory: product?.subcategory || "-",
          quantity,
          minQuantity,
          belowMinimum: minQuantity > 0 && quantity < minQuantity,
        };
      }),
    [products]
  );

  const columns = [
    { title: "Item Code", dataIndex: "itemCode", key: "itemCode", fixed: "left" },
    { title: "Product Name", dataIndex: "name", key: "name" },
    {
      title: "Original Price",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (value) => formatCurrency(value),
    },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Subcategory", dataIndex: "subcategory", key: "subcategory" },
    { title: "Current Qty", dataIndex: "quantity", key: "quantity" },
    { title: "Min Qty Level", dataIndex: "minQuantity", key: "minQuantity" },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={record.belowMinimum ? "red" : "green"}>
          {record.belowMinimum ? "Below Minimum" : "OK"}
        </Tag>
      ),
    },
  ];

  const lowStock = useMemo(
    () => dataSource.filter((item) => item.belowMinimum).length,
    [dataSource]
  );

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Stock Manager</h1>
          <div className="admin-profile" style={{ gap: 16 }}>
            <div>
              <strong>{dataSource.length}</strong> SKUs tracked
            </div>
            <div style={{ color: lowStock ? "#ef4444" : "#22c55e" }}>
              {lowStock} low stock
            </div>
          </div>
        </header>

        <section className="dashboard-reports">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <p style={{ margin: 0, color: "#475569" }}>
              Review inventory levels. Inventory adjustments remain managed within the product form to keep this view read-only.
            </p>
            <Space wrap>
              <Button onClick={() => navigate("/admin/manage-quantity")}>
                Min Qty Settings
              </Button>
              <Button onClick={() => navigate("/admin/products")}>Add Inventory</Button>
              <Button type="primary" onClick={fetchProducts} loading={loading}>
                Refresh
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
          />
        </section>
      </div>
    </div>
  );
};

export default StockManagerPage;
