import React from "react";
import { Table, Tag } from "antd";
import AdminLayout from "../components/AdminLayout";
import "./AdminDashboardPage.css";

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const orderStatusColors = {
  Processing: "geekblue",
  Shipped: "gold",
  Delivered: "green",
  Cancelled: "red",
};

const sampleOrders = [
  {
    orderId: "ORD-1001",
    itemCode: "NS-001",
    productName: "Executive Notebook",
    originalPrice: 1299,
    category: "Notebooks",
    subcategory: "Premium",
    quantity: 3,
    status: "Processing",
    orderDate: "2025-11-15",
    customer: "Janani Perera",
  },
  {
    orderId: "ORD-1002",
    itemCode: "NS-034",
    productName: "Graphite Pencil Set",
    originalPrice: 499,
    category: "Writing",
    subcategory: "Pencils",
    quantity: 6,
    status: "Delivered",
    orderDate: "2025-11-14",
    customer: "Aidan Mathews",
  },
  {
    orderId: "ORD-1003",
    itemCode: "NS-067",
    productName: "Dual Tip Highlighters",
    originalPrice: 799,
    category: "Writing",
    subcategory: "Highlighters",
    quantity: 2,
    status: "Shipped",
    orderDate: "2025-11-13",
    customer: "Maya Fernando",
  },
  {
    orderId: "ORD-1004",
    itemCode: "NS-011",
    productName: "Marble Desk Organiser",
    originalPrice: 2599,
    category: "Desk",
    subcategory: "Organisation",
    quantity: 1,
    status: "Processing",
    orderDate: "2025-11-12",
    customer: "Kasun Jayawardena",
  },
  {
    orderId: "ORD-1005",
    itemCode: "NS-089",
    productName: "Velvet Sketchbook",
    originalPrice: 1899,
    category: "Sketch",
    subcategory: "Artist Series",
    quantity: 4,
    status: "Cancelled",
    orderDate: "2025-11-10",
    customer: "Nadeesha Weerasinghe",
  },
];

const columns = [
  {
    title: "Order ID",
    dataIndex: "orderId",
    key: "orderId",
    fixed: "left",
  },
  {
    title: "Item Code",
    dataIndex: "itemCode",
    key: "itemCode",
  },
  {
    title: "Product Name",
    dataIndex: "productName",
    key: "productName",
  },
  {
    title: "Original Price",
    dataIndex: "originalPrice",
    key: "originalPrice",
    render: (value) => formatCurrency(value),
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
  },
  {
    title: "Subcategory",
    dataIndex: "subcategory",
    key: "subcategory",
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    key: "quantity",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => (
      <Tag color={orderStatusColors[status] || "default"}>{status}</Tag>
    ),
  },
  {
    title: "Ordered On",
    dataIndex: "orderDate",
    key: "orderDate",
    render: (value) => new Date(value).toLocaleDateString(),
  },
  {
    title: "Customer",
    dataIndex: "customer",
    key: "customer",
  },
];

const ManageOrdersPage = () => {
  return (
    <AdminLayout title="Manage Orders" subtitle="Track every order along with the associated product line items.">
      <section className="dashboard-reports">
        <Table
          columns={columns}
          dataSource={sampleOrders}
          rowKey="orderId"
          pagination={{ pageSize: 5 }}
          scroll={{ x: 900 }}
        />
      </section>
    </AdminLayout>
  );
};

export default ManageOrdersPage;
