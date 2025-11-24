import React from "react";
import { Table, Tag } from "antd";
import AdminLayout from "../components/AdminLayout";
import "./AdminDashboardPage.css";

const customerStatusColor = {
  Active: "green",
  "At Risk": "orange",
  Inactive: "red",
};

const customers = [
  {
    id: "CUST-001",
    name: "Janani Perera",
    email: "janani@nerdmail.com",
    since: "2023-04-12",
    totalOrders: 14,
    lifetimeValue: "Rs 82,450",
    status: "Active",
  },
  {
    id: "CUST-002",
    name: "Kasun Jayawardena",
    email: "kasun@jaywardena.lk",
    since: "2024-01-07",
    totalOrders: 6,
    lifetimeValue: "Rs 18,900",
    status: "At Risk",
  },
  {
    id: "CUST-003",
    name: "Nadeesha Weerasinghe",
    email: "nadeesha@weera.io",
    since: "2022-10-20",
    totalOrders: 27,
    lifetimeValue: "Rs 124,700",
    status: "Active",
  },
  {
    id: "CUST-004",
    name: "Maya Fernando",
    email: "maya@fernando.com",
    since: "2023-07-04",
    totalOrders: 9,
    lifetimeValue: "Rs 43,520",
    status: "Active",
  },
  {
    id: "CUST-005",
    name: "Aidan Mathews",
    email: "aidan@mathews.cc",
    since: "2023-11-18",
    totalOrders: 3,
    lifetimeValue: "Rs 8,250",
    status: "Inactive",
  },
];

const columns = [
  { title: "Customer ID", dataIndex: "id", key: "id" },
  { title: "Name", dataIndex: "name", key: "name" },
  { title: "Email", dataIndex: "email", key: "email" },
  {
    title: "Joined On",
    dataIndex: "since",
    key: "since",
    render: (value) => new Date(value).toLocaleDateString(),
  },
  { title: "Orders", dataIndex: "totalOrders", key: "totalOrders" },
  { title: "Lifetime Value", dataIndex: "lifetimeValue", key: "lifetimeValue" },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (value) => <Tag color={customerStatusColor[value] || "default"}>{value}</Tag>,
  },
];

const ManageCustomersPage = () => {
  return (
    <AdminLayout title="Manage Customers" subtitle="CRM snapshot">
      <section className="dashboard-reports">
        <h2>Customer Directory</h2>
        <Table columns={columns} dataSource={customers} rowKey="id" pagination={{ pageSize: 5 }} />
      </section>
    </AdminLayout>
  );
};

export default ManageCustomersPage;
