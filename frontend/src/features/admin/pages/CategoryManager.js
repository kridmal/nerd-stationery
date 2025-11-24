import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Collapse,
} from "antd";
import {
  getCategories,
  addCategory,
  deleteCategory,
  addSubCategory,
  deleteSubCategory,
} from "../../../services/api";
import AdminLayout from "../components/AdminLayout";

const { Panel } = Collapse;

const CategoryManager = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form] = Form.useForm();
  const [subForm] = Form.useForm();

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      message.error("Failed to load categories.");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (values) => {
    try {
      await addCategory(values);
      message.success("Category added successfully!");
      setIsModalOpen(false);
      form.resetFields();
      fetchCategories();
    } catch {
      message.error("Error adding category.");
    }
  };

  const handleAddSubCategory = async (values) => {
    try {
      await addSubCategory({ ...values, categoryId: selectedCategory._id });
      message.success("Subcategory added successfully!");
      setIsSubModalOpen(false);
      subForm.resetFields();
      fetchCategories();
    } catch {
      message.error("Error adding subcategory.");
    }
  };

  const handleDeleteCategory = async (id) => {
    await deleteCategory(id);
    message.success("Category deleted");
    fetchCategories();
  };

  const handleDeleteSubCategory = async (categoryId, subcategoryId) => {
    await deleteSubCategory(categoryId, subcategoryId);
    message.success("Subcategory deleted");
    fetchCategories();
  };

  return (
    <AdminLayout title="Manage Categories" subtitle="Organize your catalog taxonomy">
      <div style={{ padding: "10px 0" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/admin/products")}>Back to Products</Button>
          <Button type="primary" onClick={() => setIsModalOpen(true)}>
            Add Category
          </Button>
        </div>

        <Collapse accordion>
          {categories.map((cat) => (
            <Panel
              header={
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{cat.name}</span>
                  <div>
                    <Button
                      type="link"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsSubModalOpen(true);
                      }}
                    >
                      Add Subcategory
                    </Button>
                    <Popconfirm
                      title="Delete this category?"
                      onConfirm={() => handleDeleteCategory(cat._id)}
                    >
                      <Button danger type="link">
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              }
              key={cat._id}
            >
              <Table
                dataSource={cat.subcategories || []}
                columns={[
                  { title: "Subcategory Name", dataIndex: "name" },
                  {
                    title: "Action",
                    render: (_, sub) => (
                      <Popconfirm
                        title="Delete subcategory?"
                        onConfirm={() => handleDeleteSubCategory(cat._id, sub._id)}
                      >
                        <Button danger size="small">
                          Delete
                        </Button>
                      </Popconfirm>
                    ),
                  },
                ]}
                rowKey="_id"
                pagination={false}
              />
            </Panel>
          ))}
        </Collapse>

        {/* Add Category Modal */}
        <Modal
          title="Add Category"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleAddCategory}>
            <Form.Item
              label="Category Name"
              name="name"
              rules={[{ required: true, message: "Category name is required" }]}
            >
              <Input placeholder="e.g. Stationery, Electronics..." />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              Save Category
            </Button>
          </Form>
        </Modal>

        {/* Add Subcategory Modal */}
        <Modal
          title={`Add Subcategory to ${selectedCategory?.name}`}
          open={isSubModalOpen}
          onCancel={() => setIsSubModalOpen(false)}
          footer={null}
        >
          <Form form={subForm} layout="vertical" onFinish={handleAddSubCategory}>
            <Form.Item
              label="Subcategory Name"
              name="name"
              rules={[{ required: true, message: "Subcategory name is required" }]}
            >
              <Input placeholder="e.g. Pens, Notebooks, Paper..." />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              Save Subcategory
            </Button>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default CategoryManager;

