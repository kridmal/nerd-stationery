import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import AdminLayout from "../components/AdminLayout";
import useAdminSession from "../hooks/useAdminSession";
import {
  createAdminAccount,
  deleteAdminAccount,
  listAdmins,
  resetAdminPassword,
} from "../../../services/api";

const roleLabel = (role) => {
  if (role === "root_admin") return "Root Admin";
  if (role === "manager_admin" || role === "admin") return "Manager Admin";
  return role || "Unknown";
};

const AdminUsersPage = () => {
  const { admin: currentAdmin, isRootAdmin } = useAdminSession();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [passwordModal, setPasswordModal] = useState({ open: false, adminId: null, name: "" });
  const [createForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await listAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error?.response?.status === 403 && currentAdmin) {
        setAdmins([currentAdmin]);
      } else {
        message.error(error?.response?.data?.message || "Failed to load admin users");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRootAdmin]);

  const handleCreate = async (values) => {
    try {
      const payload = { ...values, role: values.role || "manager_admin" };
      await createAdminAccount(payload);
      message.success("Admin created");
      setCreateModalOpen(false);
      createForm.resetFields();
      loadAdmins();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to create admin");
    }
  };

  const handleResetPassword = async (values) => {
    try {
      await resetAdminPassword(passwordModal.adminId, values.newPassword);
      message.success("Password updated");
      setPasswordModal({ open: false, adminId: null, name: "" });
      passwordForm.resetFields();
      loadAdmins();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to reset password");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdminAccount(id);
      message.success("Admin removed");
      loadAdmins();
    } catch (error) {
      message.error(error?.response?.data?.message || "Unable to delete admin");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (value) => <Tag color={value === "root_admin" ? "magenta" : "blue"}>{roleLabel(value)}</Tag>,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const canReset =
          isRootAdmin || (currentAdmin && String(currentAdmin?._id) === String(record._id));
        const canDelete = isRootAdmin && record.role !== "root_admin";

        return (
          <Space size="small">
            <Button
              size="small"
              onClick={() =>
                setPasswordModal({
                  open: true,
                  adminId: record._id,
                  name: record.name || record.email,
                })
              }
              disabled={!canReset}
            >
              Reset Password
            </Button>
            <Popconfirm
              title="Remove this admin?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => handleDelete(record._id)}
              disabled={!canDelete}
            >
              <Button size="small" danger disabled={!canDelete}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <AdminLayout
      title="Admin Users"
      subtitle="Root admin can create/remove admins. Managers can change their own passwords."
      actions={
        isRootAdmin ? (
          <Button type="primary" onClick={() => setCreateModalOpen(true)}>
            Add Admin
          </Button>
        ) : null
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          showIcon
          type="info"
          message="Root Admin (Owner) can create and remove admins and reset all passwords. Manager Admins cannot view activity logs or create admins."
        />
      </div>

      <Table
        columns={columns}
        dataSource={admins}
        loading={loading}
        rowKey={(row) => row._id}
        pagination={{ pageSize: 6 }}
      />

      <Modal
        title="Create Admin"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={createForm} onFinish={handleCreate} initialValues={{ role: "manager_admin" }}>
          <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="Enter name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Temporary password" />
          </Form.Item>
          <Form.Item label="Role" name="role">
            <Select>
              <Select.Option value="manager_admin">Manager Admin</Select.Option>
              <Select.Option value="root_admin">Root Admin</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
              <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Admin
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Reset Password${passwordModal.name ? ` for ${passwordModal.name}` : ""}`}
        open={passwordModal.open}
        onCancel={() => {
          setPasswordModal({ open: false, adminId: null, name: "" });
          passwordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={passwordForm} onFinish={handleResetPassword}>
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Password is required" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item>
            <Space style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
              <Button
                onClick={() => {
                  setPasswordModal({ open: false, adminId: null, name: "" });
                  passwordForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Password
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminUsersPage;
