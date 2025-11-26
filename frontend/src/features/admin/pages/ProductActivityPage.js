import React, { useCallback, useEffect, useState } from "react";
import { Table, Button, message, Space, Tag, DatePicker } from "antd";
import { useNavigate } from "react-router-dom";
import { getProductActivities } from "../../../services/api";
import AdminLayout from "../components/AdminLayout";
import useAdminSession from "../hooks/useAdminSession";
import "./AdminDashboardPage.css";
import dayjs from "dayjs";

  const { RangePicker } = DatePicker;

const isDataUriImage = (value) => typeof value === "string" && value.startsWith("data:image/");
const isLikelyImageUrl = (value) => {
  if (typeof value !== "string") return false;
  const normalized = value.split("?")[0] || value;
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(normalized);
};

const extractImageName = (value) => {
  if (!value || typeof value !== "string") return "image";
  if (isDataUriImage(value)) {
    const match = value.match(/^data:image\/([a-zA-Z0-9.+-]+);/);
    const rawExt = match?.[1] || "png";
    const ext = rawExt.replace("jpeg", "jpg");
    return `image.${ext}`;
  }
  const normalized = value.split("?")[0] || value;
  const parts = normalized.split("/");
  return parts.pop() || "image";
};

const isImageLinkObject = (value) =>
  value && typeof value === "object" && typeof value.url === "string" && typeof value.name === "string";

const renderValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";

  if (isImageLinkObject(value)) {
    return (
      <a href={value.url} target="_blank" rel="noreferrer">
        {value.name || extractImageName(value.url)}
      </a>
    );
  }

  if (typeof value === "string") {
    if (isDataUriImage(value) || isLikelyImageUrl(value)) {
      return (
        <a href={value} target="_blank" rel="noreferrer">
          {extractImageName(value)}
        </a>
      );
    }
    if (value.length > 120) {
      return (
        <span title={value}>
          {value.slice(0, 80)}...{value.slice(-10)}
        </span>
      );
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {value.map((entry, idx) => (
          <div key={idx} style={{ display: "flex", gap: 6 }}>
            <span style={{ color: "#999" }}>[{idx + 1}]</span>
            <span>{renderValue(entry)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return "{}";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {entries.map(([key, val]) => (
          <div key={key} style={{ display: "flex", gap: 6 }}>
            <strong>{key}:</strong>
            <span>{renderValue(val)}</span>
          </div>
        ))}
      </div>
    );
  }

  return String(value);
};

const renderChangedFields = (changes) => {
  if (!changes || Object.keys(changes).length === 0) {
    return <span style={{ color: "#888" }}>N/A</span>;
  }

  return (
    <div style={{ maxHeight: 160, overflowY: "auto" }}>
      {Object.entries(changes).map(([field, change]) => (
        <div key={field} style={{ marginBottom: 8 }}>
          <strong>{field}</strong>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: "#999" }}>old:</span> {renderValue(change?.old)}
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: "#999" }}>new:</span> {renderValue(change?.new)}
          </div>
        </div>
      ))}
    </div>
  );
};

const renderSnapshot = (snapshot) => {
  const content = snapshot ?? {};
  return (
    <div
      style={{
        maxHeight: 220,
        overflow: "auto",
        background: "#f7f7f7",
        padding: "8px",
        borderRadius: "4px",
      }}
    >
      {renderValue(content)}
    </div>
  );
};

const ProductActivityPage = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const { isRootAdmin } = useAdminSession();

  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 150 };
      if (Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        params.startDate = dayjs(dateRange[0]).startOf("day").toISOString();
        params.endDate = dayjs(dateRange[1]).endOf("day").toISOString();
      }
      const data = await getProductActivities(params);
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      const fallback = error?.message || "Failed to load activity logs.";
      message.error(fallback);
      if (fallback.toLowerCase().includes("root")) {
        navigate("/admin-dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, dateRange]);

  useEffect(() => {
    if (isRootAdmin) {
      fetchActivityLogs();
    } else {
      message.warning("Activity logs are only visible to root admins.");
      navigate("/admin-dashboard");
    }
  }, [fetchActivityLogs, isRootAdmin, navigate]);

  const clearFilters = () => {
    setDateRange([]);
  };

  const exportToCsv = () => {
    if (!activities.length) {
      message.info("No activity data to export.");
      return;
    }

    const headers = [
      "Date/Time",
      "Operation",
      "Admin Username",
      "Product ID",
      "Item Code",
      "Product Name",
      "Changed Fields",
      "Snapshot",
    ];

    const sanitize = (val) => {
      if (val == null) return "";
      if (typeof val === "string") return val.replace(/"/g, '""');
      if (typeof val === "object") return sanitize(JSON.stringify(val));
      return String(val);
    };

    const rows = activities.map((record) => {
      const changedFields = record.changedFields ? JSON.stringify(record.changedFields) : "";
      const snapshot = record.snapshot ? JSON.stringify(record.snapshot) : "";
      return [
        record.timestamp ? new Date(record.timestamp).toLocaleString() : "",
        record.operation || "",
        record.adminUsername || record.adminEmail || "Unknown",
        record.productId || "",
        record.productItemCode || "",
        record.productName || "",
        changedFields,
        snapshot,
      ].map((cell) => `"${sanitize(cell)}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateSuffix =
      Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]
        ? `${dayjs(dateRange[0]).format("YYYYMMDD")}-${dayjs(dateRange[1]).format("YYYYMMDD")}`
        : "all";
    link.href = url;
    link.setAttribute("download", `activity-logs-${dateSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: "Date/Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
    {
      title: "Operation",
      dataIndex: "operation",
      key: "operation",
      render: (op) => (
        <Tag color={op?.includes("DELETE") ? "red" : op?.includes("UPDATE") ? "blue" : "green"}>
          {op || "-"}
        </Tag>
      ),
    },
    {
      title: "Admin Username",
      dataIndex: "adminUsername",
      key: "adminUsername",
      render: (value, record) => value || record?.adminEmail || "Unknown",
    },
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <div>
          <div>
            <strong>ID:</strong> {record.productId || "N/A"}
          </div>
          <div>
            <strong>Item Code:</strong> {record.productItemCode || "N/A"}
          </div>
          <div>
            <strong>Name:</strong> {record.productName || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Changed Fields",
      dataIndex: "changedFields",
      key: "changedFields",
      render: (changes) => renderChangedFields(changes),
    },
    {
      title: "Snapshot",
      dataIndex: "snapshot",
      key: "snapshot",
      render: (snapshot) => renderSnapshot(snapshot),
    },
  ];

  return (
    <AdminLayout title="Activity Logs" subtitle="Product audit trail">
      <section className="dashboard-reports">
        <Space
          style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button type="primary" onClick={fetchActivityLogs} loading={loading} disabled={!isRootAdmin}>
              Refresh
            </Button>
            <Button onClick={exportToCsv} disabled={!activities.length}>
              Download Excel
            </Button>
          </div>
        </Space>
        <Space
          style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <RangePicker
              value={dateRange}
              onChange={(range) => setDateRange(range || [])}
              style={{ minWidth: 260 }}
              allowClear
              disabled={!isRootAdmin}
            />
            <Button onClick={fetchActivityLogs} type="default" disabled={!isRootAdmin}>
              Apply Filters
            </Button>
            <Button onClick={clearFilters} disabled={!isRootAdmin}>
              Clear
            </Button>
          </div>
        </Space>
        <Table
          columns={columns}
          dataSource={activities}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </section>
    </AdminLayout>
  );
};

export default ProductActivityPage;
