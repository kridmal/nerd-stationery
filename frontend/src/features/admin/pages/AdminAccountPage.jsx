import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Form, Input, Space, Tag, message } from "antd";
import AdminLayout from "../components/AdminLayout";
import useAdminSession from "../hooks/useAdminSession";
import { resetAdminPassword } from "../../../services/api";

const AdminAccountPage = () => {
  const { admin, roleLabel } = useAdminSession();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const adminId = useMemo(() => admin?._id || admin?.id, [admin]);

  const handlePasswordChange = async (values) => {
    if (!adminId) {
      return message.error("Missing admin id. Please re-login.");
    }
    if (values.newPassword !== values.confirmPassword) {
      return message.error("New passwords do not match.");
    }
    try {
      setLoading(true);
      await resetAdminPassword(adminId, values.newPassword);
      message.success("Password updated");
      form.resetFields();
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to update password";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Account Settings" subtitle="Manage your admin profile and credentials">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Profile</h3>
          <p>
            <strong>Name:</strong> {admin?.name || admin?.username || "Admin User"}
          </p>
          <p>
            <strong>Email:</strong> {admin?.email || "-"}
          </p>
          <p>
            <strong>Role:</strong>{" "}
            <Tag color={roleLabel.includes("Root") ? "magenta" : "blue"}>{roleLabel}</Tag>
          </p>
          <Alert
            type="info"
            showIcon
            message={
              roleLabel.includes("Root")
                ? "Root Admin can manage other admins and reset their passwords."
                : "Manager Admin can update only their own password."
            }
          />
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Change Password</h3>
          <Form layout="vertical" form={form} onFinish={handlePasswordChange}>
            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: "New password is required" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password placeholder="Enter new password" />
            </Form.Item>
            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[{ required: true, message: "Please confirm new password" }]}
            >
              <Input.Password placeholder="Re-enter new password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </AdminLayout>
  );
};

export default AdminAccountPage;
