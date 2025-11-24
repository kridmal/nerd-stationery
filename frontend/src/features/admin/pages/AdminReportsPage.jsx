import React from "react";
import { Card, Col, Row, Table, Tag } from "antd";
import AdminLayout from "../components/AdminLayout";
import "./AdminDashboardPage.css";

const kpis = [
  { label: "Monthly Revenue", value: "Rs 1,245,000", trend: "+12% vs last month" },
  { label: "Average Order Value", value: "Rs 4,350", trend: "+4% vs last month" },
  { label: "Returning Customers", value: "62%", trend: "+8% YoY" },
  { label: "Low Stock Items", value: "18 SKUs", trend: "Need restock soon" },
];

const reportColumns = [
  { title: "Report", dataIndex: "report", key: "report" },
  { title: "Status", dataIndex: "status", key: "status", render: (status) => <Tag color={status === "On Track" ? "green" : status === "Attention" ? "gold" : "red"}>{status}</Tag> },
  { title: "Last Updated", dataIndex: "updated", key: "updated" },
  { title: "Owner", dataIndex: "owner", key: "owner" },
];

const reportRows = [
  { key: "sales", report: "Sales Summary", status: "On Track", updated: "15 Nov 2025", owner: "Sales Ops" },
  { key: "inventory", report: "Inventory Aging", status: "Attention", updated: "14 Nov 2025", owner: "Warehouse" },
  { key: "customers", report: "Customer Cohorts", status: "On Track", updated: "13 Nov 2025", owner: "CRM" },
  { key: "returns", report: "Returns & Exchanges", status: "Review", updated: "11 Nov 2025", owner: "Support" },
];

const AdminReportsPage = () => {
  return (
    <AdminLayout title="Reports" subtitle="Auto-generated nightly">
      <section className="dashboard-overview" style={{ marginTop: 24 }}>
        {kpis.map((item) => (
          <Card key={item.label} bordered={false} style={{ borderRadius: 12 }}>
            <p style={{ color: "#94a3b8", marginBottom: 4 }}>{item.label}</p>
            <h2 style={{ margin: 0 }}>{item.value}</h2>
            <small style={{ color: "#16a34a" }}>{item.trend}</small>
          </Card>
        ))}
      </section>

      <section className="dashboard-reports">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <h2>Scheduled Reports</h2>
            <Table columns={reportColumns} dataSource={reportRows} pagination={false} />
          </Col>
        </Row>
      </section>
    </AdminLayout>
  );
};

export default AdminReportsPage;
