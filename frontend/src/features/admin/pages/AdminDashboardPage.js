// frontend/src/pages/AdminDashboardPage.js
import React from "react";
import AdminSidebar from "../components/AdminSidebar";
import "./AdminDashboardPage.css";

const AdminDashboardPage = () => {
  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="admin-profile">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt="Admin"
            />
            <span>Admin User</span>
          </div>
        </header>

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
      </div>
    </div>
  );
};

export default AdminDashboardPage;

