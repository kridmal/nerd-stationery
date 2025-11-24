// frontend/src/pages/AdminDashboardPage.js
import React from "react";
import AdminLayout from "../components/AdminLayout";
import "./AdminDashboardPage.css";

const AdminDashboardPage = () => {
  return (
    <AdminLayout title="Admin Dashboard" subtitle="Operational snapshot and quick actions">
      <section className="dashboard-overview">
        <div className="card">
          <h3>Total Products</h3>
          <p>120</p>
        </div>
        <div className="card">
          <h3>Total Orders</h3>
          <p>86</p>
        </div>
        <div className="card">
          <h3>Customers</h3>
          <p>45</p>
        </div>
        <div className="card">
          <h3>Revenue</h3>
          <p>$12,450</p>
        </div>
      </section>

      <section className="dashboard-reports">
        <h2>Recent Activities</h2>
        <ul>
          <li>New order from John Doe</li>
          <li>Product "Notebook Set" restocked</li>
          <li>New customer registered</li>
        </ul>
      </section>
    </AdminLayout>
  );
};

export default AdminDashboardPage;

