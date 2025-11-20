import React from "react";
import { Button, Divider, Form, Input, message, Switch } from "antd";
import AdminSidebar from "../components/AdminSidebar";
import "./AdminDashboardPage.css";

const AdminSettingsPage = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    console.table(values);
    message.success("Settings saved locally.");
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Admin Settings</h1>
          <div className="admin-profile">
            <span>Workspace wide</span>
          </div>
        </header>

        <section className="dashboard-reports">
          <Form
            layout="vertical"
            form={form}
            initialValues={{
              notifyLowStock: true,
              notifyNewOrder: true,
              enableTwoFactor: false,
            }}
            onFinish={handleSubmit}
          >
            <h2>Notifications</h2>
            <Form.Item
              label="Low stock alerts"
              name="notifyLowStock"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="New order email"
              name="notifyNewOrder"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Divider />

            <h2>Security</h2>
            <Form.Item
              label="Enable two factor authentication"
              name="enableTwoFactor"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="Support contact email"
              name="supportEmail"
              rules={[{ required: true, message: "Please provide a support email" }]}
            >
              <Input type="email" placeholder="support@nerdstationery.com" />
            </Form.Item>
            <Form.Item
              label="Backup contact number"
              name="supportPhone"
              rules={[{ required: true, message: "Phone number required" }]}
            >
              <Input placeholder="+94 71 234 5678" />
            </Form.Item>

            <Form.Item>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <Button onClick={() => form.resetFields()}>Reset</Button>
                <Button type="primary" htmlType="submit">
                  Save Settings
                </Button>
              </div>
            </Form.Item>
          </Form>
        </section>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
