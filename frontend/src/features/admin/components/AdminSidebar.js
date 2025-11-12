import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin-login");
  };

  return (
    <div className="admin-sidebar">
      <h2 className="sidebar-title">Nerd Stationery Admin</h2>

      <ul className="sidebar-menu">
        <li
          className={location.pathname === "/admin-dashboard" ? "active" : ""}
          onClick={() => navigate("/admin-dashboard")}
        >
          Dashboard
        </li>

        <li
          className={location.pathname === "/admin/products" ? "active" : ""}
          onClick={() => navigate("/admin/products")}
        >
          Manage Products
        </li>

        <li className="disabled">Manage Orders (Coming Soon)</li>
        <li className="disabled">Manage Users (Coming Soon)</li>
        <li className="disabled">Reports (Coming Soon)</li>
      </ul>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default AdminSidebar;

