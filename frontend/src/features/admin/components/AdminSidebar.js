import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAdminSession from "../hooks/useAdminSession";
import "./AdminSidebar.css";

const menuItems = [
  { label: "Dashboard", path: "/admin-dashboard" },
  { label: "Account Settings", path: "/admin/account" },
  { label: "Admin Users", path: "/admin/users", requiresRoot: true },
  { label: "Manage Products", path: "/admin/products" },
  { label: "Packages", path: "/admin/packages" },
  { label: "New Arrivals", path: "/admin/new-arrivals" },
  { label: "Manage Orders", path: "/admin/orders" },
  { label: "Manage Customers", path: "/admin/customers" },
  { label: "Stock Manager", path: "/admin/stock-manager" },
  { label: "Report", path: "/admin/reports", requiresRoot: true },
  {
    label: "Activity Logs",
    path: "/admin/activity-logs",
    matchPaths: ["/admin/activity-logs", "/admin/products/activity"],
    requiresRoot: true,
  },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, roleLabel, isRootAdmin, logout } = useAdminSession();

  const isActive = (matchPaths, path) => {
    if (Array.isArray(matchPaths) && matchPaths.length > 0) {
      return matchPaths.some((candidate) => location.pathname.startsWith(candidate));
    }
    return location.pathname === path;
  };

  return (
    <div className="admin-sidebar">
      <div>
        <div className="sidebar-brand" onClick={() => navigate("/admin-dashboard")}>
          <img src="/images/logo.png" alt="Nerd Stationery" className="sidebar-logo" />
          <div>
            <p className="brand-label">Nerd Stationery</p>
            <p className="brand-subtitle">Admin Console</p>
          </div>
        </div>

        <div className="sidebar-user">
          <p className="sidebar-user-name">{admin?.name || admin?.email || "Admin User"}</p>
          <p className="sidebar-user-role">{roleLabel}</p>
        </div>

        <ul className="sidebar-menu">
          {menuItems
            .filter((item) => !item.requiresRoot || isRootAdmin)
            .map((item) => (
              <li
                key={item.label}
                className={`sidebar-link ${isActive(item.matchPaths, item.path) ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </li>
            ))}
        </ul>
      </div>

      <button className="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default AdminSidebar;
