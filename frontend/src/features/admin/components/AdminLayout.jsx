import React from "react";
import AdminSidebar from "./AdminSidebar";
import useAdminSession from "../hooks/useAdminSession";
import "../pages/AdminDashboardPage.css";

const AdminLayout = ({ title, subtitle, actions, children }) => {
  const { admin, roleLabel, logout } = useAdminSession();
  const displayName = admin?.name || admin?.username || admin?.email || "Admin User";

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-title-block">
            <h1>{title}</h1>
            {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
          </div>
          <div className="admin-profile rich">
            <div className="admin-meta">
              <span className="admin-role">Logging as {roleLabel}</span>
              <span className="admin-name">{displayName}</span>
              {admin?.email && <span className="admin-email">{admin.email}</span>}
            </div>
            <button className="logout-btn inline" onClick={logout}>
              Logout
            </button>
          </div>
        </header>
        {actions ? <div className="dashboard-actions">{actions}</div> : null}
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
