// src/components/AdminHeader.js
import React from "react";
import "./AdminHeader.css";

const AdminHeader = () => {
  return (
    <div className="admin-header">
      <h1>Admin Dashboard</h1>
      <div className="admin-profile">
        <span className="admin-name">Kaveen (Admin)</span>
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          alt="profile"
          className="admin-avatar"
        />
      </div>
    </div>
  );
};

export default AdminHeader;
