import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Select,
  Switch,
  Table,
  Upload,
  Tag,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { Modal as AntdModal } from "antd";
import AdminLayout from "../components/AdminLayout";
import {
  getProducts,
  getPackages as getPackagesApi,
  createPackage as createPackageApi,
  updatePackage as updatePackageApi,
  deletePackage as deletePackageApi,
} from "../../../services/api";
import {
  computePackageLineTotal,
  computePackageOriginalValue,
  formatCurrency,
  normalizePackageLineItems,
  toNumber,
} from "../../../utils/productUtils";

const { Dragger } = Upload;
let tempCounter = 0;
const createTempId = () => `pkg-line-${Date.now()}-${tempCounter++}`;

const createEmptyLine = () => ({
  tempId: createTempId(),
  itemCode: "",
  productId: "",
  productName: "",
  shortDescription: "",
  originalPrice: 0,
  quantity: 1,
  sku: "",
  brand: "",
  size: "",
  color: "",
  hasVariants: false,
});

const toUploadFile = (url, prefix = "img") =>
  url
    ? {
        uid: `${prefix}-${url}`,
        url,
        status: "done",
        name: url.split("/").pop() || "image",
      }
    : null;

const productHasVariants = (product) =>
  Array.isArray(product?.variants) && product.variants.length > 0;

const findVariantBySku = (product, sku) => {
  if (!sku || !productHasVariants(product)) return null;
  const lower = sku.toLowerCase();
  return (
    product.variants.find(
      (variant) => (variant?.sku || "").toLowerCase() === lower
    ) || null
  );
};

const variantLabel = (variant) => {
  const parts = [variant?.brand, variant?.size, variant?.color]
    .filter(Boolean)
    .join(" / ");
  return parts ? `${variant?.sku} - ${parts}` : variant?.sku || "SKU";
};

const deriveOriginalPrice = (product) => {
  if (productHasVariants(product)) {
    const prices = product.variants
      .map((v) => toNumber(v?.price, null))
      .filter((n) => n != null);
    if (prices.length) return Math.min(...prices);
  }
  return toNumber(
    product?.originalPrice ??
      product?.unitPrice ??
      product?.price ??
      product?.finalPrice,
    0
  );
};

const syncLineWithProduct = (line, product) => {
  if (!product) return line;
  const hasVariants = productHasVariants(product);
  const matchedVariant = hasVariants
    ? findVariantBySku(product, line.sku) || product.variants[0]
    : null;

  const variantPrice =
    matchedVariant != null ? toNumber(matchedVariant.price, 0) : null;

  return {
    ...line,
    productId: product._id,
    productName: product.name || line.productName,
    shortDescription:
      product.shortDescription || product.description || line.shortDescription,
    originalPrice: variantPrice ?? deriveOriginalPrice(product),
    brand: hasVariants
      ? matchedVariant?.brand ?? product.variations?.brand ?? line.brand
      : "",
    size: hasVariants
      ? matchedVariant?.size ?? product.variations?.size ?? line.size
      : "",
    color: hasVariants
      ? matchedVariant?.color ?? product.variations?.color ?? line.color
      : "",
    sku: hasVariants ? matchedVariant?.sku || line.sku : "",
    hasVariants,
  };
};

const mapPackageToForm = (pkg) => {
  const lineItems = normalizePackageLineItems(pkg)
    .filter(Boolean)
    .map((item) => ({
      tempId: item.tempId || createTempId(),
      itemCode: item.itemCode || item.code || "",
      productId: item.productId,
      productName: item.productName || item.name || "",
      shortDescription: item.shortDescription || "",
      originalPrice: toNumber(item.originalPrice ?? item.price, 0),
      quantity: toNumber(item.quantity, 0) || 1,
      brand: item.brand || "",
      size: item.size || "",
      color: item.color || "",
      sku: item.sku || "",
      hasVariants:
        item.hasVariants || Boolean(item.sku || item.brand || item.size || item.color),
    }));

  return {
    packageCode: pkg?.packageCode || pkg?.code || "",
    name: pkg?.name || "",
    shortDescription: pkg?.shortDescription || pkg?.description || "",
    packagePrice: toNumber(pkg?.packagePrice ?? pkg?.price, 0),
    isActive: pkg?.isActive !== false,
    lineItems: lineItems.length ? lineItems : [createEmptyLine()],
  };
};

const PackageManagerPage = () => {
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [primaryImageFileList, setPrimaryImageFileList] = useState([]);
  const [secondaryImageFileList, setSecondaryImageFileList] = useState([]);
  const [form] = Form.useForm();

  const productMap = useMemo(() => {
    const map = new Map();
    (products || []).forEach((product) => {
      const code = (product.itemCode || product.productCode || "").toLowerCase();
      if (code) map.set(code, product);
    });
    return map;
  }, [products]);

  const itemCodeOptions = useMemo(
    () => {
      const seen = new Set();
      return (products || []).reduce((acc, p) => {
        const code = p?.itemCode ?? p?.productCode ?? "";
        if (!code || seen.has(code)) return acc;
        seen.add(code);
        acc.push({
          value: code,
          key: code,
          label: p?.name ? `${code} - ${p.name}` : code,
        });
        return acc;
      }, []);
    },
    [products]
  );

  const preparedRows = useMemo(
    () =>
      (packages || []).map((pkg) => {
        const lineItems = normalizePackageLineItems(pkg);
        return {
          key: pkg._id || pkg.id || pkg.packageCode || pkg.code || pkg.name,
          packageCode: pkg.packageCode || pkg.code || "",
          name: pkg.name,
          packagePrice: toNumber(pkg.packagePrice ?? pkg.price, 0),
          totalOriginal:
            pkg.totalOriginal != null
              ? toNumber(pkg.totalOriginal, 0)
              : computePackageOriginalValue(lineItems),
          isActive: pkg.isActive !== false,
          raw: pkg,
        };
      }),
    [packages]
  );

  const lineItemsWatch = Form.useWatch("lineItems", form);
  const safeLineItems = useMemo(() => lineItemsWatch || [], [lineItemsWatch]);
  const packageOriginalValue = useMemo(
    () => computePackageOriginalValue(safeLineItems),
    [safeLineItems]
  );

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error("Unable to load products for package builder.");
    }
  };

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await getPackagesApi();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error("Unable to load packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadPackages();
  }, []);

  const resetForm = () => {
    form.setFieldsValue({
      packageCode: "",
      name: "",
      shortDescription: "",
      packagePrice: "",
      isActive: true,
      lineItems: [createEmptyLine()],
    });
    setEditingId(null);
    setValidationError("");
    setPrimaryImageFileList([]);
    setSecondaryImageFileList([]);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (pkg) => {
    form.setFieldsValue(mapPackageToForm(pkg));
    setEditingId(pkg._id || pkg.id);
    setValidationError("");
    setPrimaryImageFileList(
      pkg.primaryImage ? [toUploadFile(pkg.primaryImage, "primary")] : []
    );
    setSecondaryImageFileList(
      Array.isArray(pkg.secondaryImages)
        ? pkg.secondaryImages.map((img) => toUploadFile(img, "secondary")).filter(Boolean)
        : []
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setValidationError("");
  };

  const findProduct = (itemCode) => {
    if (!itemCode) return null;
    const key = String(itemCode).toLowerCase();
    return productMap.get(key) || null;
  };

  const syncLineAtIndex = (index, updater) => {
    const current = form.getFieldValue("lineItems") || [];
    const line = current[index] || {};
    const updatedLine = typeof updater === "function" ? updater(line) : updater;
    const next = current.map((l, idx) => (idx === index ? updatedLine : l));
    form.setFieldsValue({ lineItems: next });
  };

  const handleItemCodeChange = (index, value) => {
    const trimmed = (value || "").trim();
    const product = findProduct(trimmed);
    setValidationError("");
    syncLineAtIndex(index, (line) => {
      const updatedLine = { ...line, itemCode: trimmed };
      return product ? syncLineWithProduct(updatedLine, product) : updatedLine;
    });
  };

  const handleSkuChange = (index, value) => {
    const sku = (value || "").trim();
    syncLineAtIndex(index, (line) => {
      const product = findProduct(line.itemCode);
      const updatedLine = { ...line, sku };
      return product ? syncLineWithProduct(updatedLine, product) : updatedLine;
    });
  };

  const validateForm = () => {
    const values = form.getFieldsValue();
    const errors = [];
    if (!values.packageCode?.trim()) errors.push("Package code is required.");
    if (!values.name?.trim()) errors.push("Package name is required.");
    if (!values.packagePrice || Number(values.packagePrice) <= 0) {
      errors.push("Package price must be greater than zero.");
    }
    const lineItems = values.lineItems || [];
    if (!lineItems.length) errors.push("Add at least one product to the package.");
    lineItems.forEach((line, idx) => {
      if (!line?.itemCode?.trim()) {
        errors.push(`Line ${idx + 1}: item code is required.`);
      }
      if (!line?.quantity || Number(line.quantity) <= 0) {
        errors.push(`Line ${idx + 1}: quantity must be greater than zero.`);
      }
      if (!line?.originalPrice || Number(line.originalPrice) <= 0) {
        errors.push(`Line ${idx + 1}: original price is required.`);
      }
    });
    return errors;
  };

  const handleSave = async () => {
    try {
      await form.validateFields();
    } catch (_err) {
      return;
    }
    const errors = validateForm();
    if (errors.length) {
      setValidationError(errors[0]);
      message.warning(errors[0]);
      return;
    }
    const values = form.getFieldsValue();
    const itemsPayload = (values.lineItems || []).map((line) => ({
      productId: line.productId,
      itemCode: line.itemCode,
      productName: line.productName,
      shortDescription: line.shortDescription,
      quantity: Number(line.quantity) || 0,
      originalPrice: toNumber(line.originalPrice, 0),
      sku: line.sku,
      brand: line.brand,
      size: line.size,
      color: line.color,
    }));

    const basePayload = {
      packageCode: values.packageCode.trim(),
      name: values.name.trim(),
      shortDescription: (values.shortDescription || "").trim(),
      packagePrice: Number(values.packagePrice),
      isActive: values.isActive,
      totalOriginal: packageOriginalValue,
      items: itemsPayload,
      primaryImage: primaryImageFileList[0]?.url || "",
      existingSecondaryImages: secondaryImageFileList
        .filter((f) => f?.url)
        .map((f) => f.url),
    };

    const hasNewPrimary = Boolean(primaryImageFileList[0]?.originFileObj);
    const hasNewSecondary = secondaryImageFileList.some((f) => f?.originFileObj);
    const shouldSendFormData = hasNewPrimary || hasNewSecondary;

    const payload = shouldSendFormData ? new FormData() : basePayload;

    if (shouldSendFormData) {
      Object.entries(basePayload).forEach(([key, value]) => {
        if (value === undefined) return;
        if (key === "items" || key === "existingSecondaryImages") {
          payload.append(key, JSON.stringify(value));
        } else {
          payload.append(key, value);
        }
      });

      if (hasNewPrimary && primaryImageFileList[0]?.originFileObj) {
        payload.append("primaryImage", primaryImageFileList[0].originFileObj);
      }

      (secondaryImageFileList || []).forEach((file) => {
        if (file.originFileObj) {
          payload.append("secondaryImages", file.originFileObj);
        }
      });
    }

    try {
      setSaving(true);
      if (editingId) {
        await updatePackageApi(editingId, payload);
        message.success("Package updated.");
      } else {
        await createPackageApi(payload);
        message.success("Package created.");
      }
      await loadPackages();
      closeModal();
      resetForm();
    } catch (error) {
      const msg =
        error?.response?.data?.message || error?.message || "Unable to save package.";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    AntdModal.confirm({
      title: "Delete this package?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setSaving(true);
          await deletePackageApi(id);
          message.success("Package deleted.");
          await loadPackages();
        } catch (error) {
          const msg =
            error?.response?.data?.message || error?.message || "Unable to delete package.";
          message.error(msg);
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const columns = [
    { title: "Package Code", dataIndex: "packageCode", key: "packageCode" },
    { title: "Package Name", dataIndex: "name", key: "name" },
    {
      title: "Total Original Value",
      dataIndex: "totalOriginal",
      key: "totalOriginal",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Package Price",
      dataIndex: "packagePrice",
      key: "packagePrice",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (active) => (
        <Tag color={active ? "green" : "default"}>{active ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record.raw)}>
            Edit
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            loading={saving}
            onClick={() => handleDelete(record.key)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const actionsBar = (
    <Space wrap>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
        Create New Package
      </Button>
      <Button icon={<ReloadOutlined />} onClick={loadPackages} disabled={loading}>
        Refresh
      </Button>
      <Tag color="blue">{packages.length} packages</Tag>
    </Space>
  );

  return (
    <AdminLayout
      title="Package Manager"
      subtitle="Bundle products into curated packages with manual pricing."
      actions={actionsBar}
    >
      <Card variant="borderless">
        <p style={{ marginBottom: 16, color: "#64748b" }}>
          Define curated packages, attach products by item code or SKU, and keep track of the
          original value versus your chosen package price.
        </p>
        <Table
          columns={columns}
          dataSource={preparedRows}
          loading={loading}
          rowKey="key"
          pagination={{ pageSize: 6 }}
        />
      </Card>

      <Modal
        title={editingId ? "Edit Package" : "Create New Package"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{ lineItems: [createEmptyLine()], isActive: true }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <Form.Item
              name="packageCode"
              label="Package Code"
              rules={[{ required: true, message: "Package code is required" }]}
            >
              <Input placeholder="Unique code" />
            </Form.Item>
            <Form.Item
              name="name"
              label="Package Name"
              rules={[{ required: true, message: "Package name is required" }]}
            >
              <Input placeholder="Package display name" />
            </Form.Item>
            <Form.Item name="isActive" label="Status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </div>
          <Form.Item name="shortDescription" label="Short Description">
            <Input.TextArea
              rows={2}
              placeholder="Optional short blurb shown to admins and customers."
            />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            <Form.Item label="Primary Image">
              <Dragger
                accept="image/*"
                multiple={false}
                beforeUpload={() => false}
                fileList={primaryImageFileList}
                maxCount={1}
                onChange={({ fileList }) => setPrimaryImageFileList(fileList.slice(-1))}
              >
                <p className="ant-upload-drag-icon">
                  <PlusOutlined />
                </p>
                <p className="ant-upload-text">Add primary image</p>
                <p className="ant-upload-hint">Shown on package cards and listings</p>
              </Dragger>
            </Form.Item>

            <Form.Item label="Secondary Images">
              <Dragger
                accept="image/*"
                multiple
                beforeUpload={() => false}
                fileList={secondaryImageFileList}
                listType="picture-card"
                onChange={({ fileList }) => setSecondaryImageFileList(fileList)}
              >
                <p className="ant-upload-drag-icon">
                  <PlusOutlined />
                </p>
                <p className="ant-upload-text">Add supporting images</p>
                <p className="ant-upload-hint">Shown in quick view and details</p>
              </Dragger>
            </Form.Item>
          </div>

          <Divider />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Products in this package</h3>
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => {
              const current = form.getFieldValue("lineItems") || [];
              form.setFieldsValue({ lineItems: [...current, createEmptyLine()] });
            }}>
              Add Product to Package
            </Button>
          </div>

          <Form.List name="lineItems">
            {(fields, { remove }) => (
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                {fields.map(({ key, name, ...restField }, idx) => {
                  const line = safeLineItems[idx] || {};
                  const product = findProduct(line.itemCode);
                  const lineTotal = computePackageLineTotal(line);
                  return (
                    <Card
                      key={key}
                      variant="borderless"
                      type="inner"
                      title={`Package Item ${idx + 1}`}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => {
                            if (fields.length === 1) return;
                            remove(idx);
                          }}
                        >
                          Remove
                        </Button>
                      }
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                        <Form.Item
                          {...restField}
                          name={[name, "itemCode"]}
                          label="Item Code"
                          rules={[{ required: true, message: "Item code is required" }]}
                        >
                          <AutoComplete
                            options={itemCodeOptions}
                            placeholder="Enter or select item code"
                            onChange={(val) => handleItemCodeChange(idx, val)}
                            filterOption={(inputValue, option) =>
                              `${option?.value || ""} ${option?.label || ""}`
                                .toUpperCase()
                                .includes((inputValue || "").toUpperCase())
                            }
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "productName"]}
                          label="Product Name"
                        >
                          <Input
                            placeholder="Auto-filled after selecting item code"
                            onChange={(e) =>
                              syncLineAtIndex(idx, { ...line, productName: e.target.value })
                            }
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "shortDescription"]}
                          label="Short Description"
                        >
                          <Input
                            placeholder="Optional note"
                            onChange={(e) =>
                              syncLineAtIndex(idx, { ...line, shortDescription: e.target.value })
                            }
                          />
                        </Form.Item>
                        {line?.hasVariants ? (
                          <>
                        <Form.Item {...restField} name={[name, "sku"]} label="SKU">
                          {product && Array.isArray(product.variants) ? (
                            <Select
                              showSearch
                              placeholder="Select SKU"
                              options={(Array.isArray(product?.variants) ? product.variants : [])
                                .filter(Boolean)
                                .map((variant, variantIdx) => ({
                                  label: variantLabel(variant),
                                  value: variant?.sku,
                                  key: variant?.sku || `variant-${variantIdx}`,
                                }))}
                              optionFilterProp="label"
                              onChange={(val) => handleSkuChange(idx, val)}
                              value={line?.sku}
                            />
                          ) : (
                            <Input
                              placeholder="Match variant SKU"
                              onChange={(e) => handleSkuChange(idx, e.target.value)}
                            />
                          )}
                        </Form.Item>
                            <Form.Item {...restField} name={[name, "brand"]} label="Brand">
                              <Input />
                            </Form.Item>
                            <Form.Item {...restField} name={[name, "size"]} label="Size">
                              <Input />
                            </Form.Item>
                            <Form.Item {...restField} name={[name, "color"]} label="Color">
                              <Input />
                            </Form.Item>
                          </>
                        ) : (
                          <div style={{ gridColumn: "1 / -1", color: "#64748b", fontSize: 13 }}>
                            {product
                              ? "Variations not required for this product."
                              : "Enter an item code to sync product details."}
                          </div>
                        )}
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          label="Quantity"
                          rules={[{ required: true, message: "Quantity is required" }]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            onChange={(val) =>
                              syncLineAtIndex(idx, { ...line, quantity: Math.max(0, toNumber(val, 0)) })
                            }
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "originalPrice"]}
                          label="Original Price"
                          rules={[{ required: true, message: "Original price is required" }]}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            style={{ width: "100%" }}
                            onChange={(val) =>
                              syncLineAtIndex(idx, { ...line, originalPrice: toNumber(val, 0) })
                            }
                          />
                        </Form.Item>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          padding: "10px 12px",
                          marginTop: 8,
                        }}
                      >
                        <span style={{ color: "#475569" }}>Line Total</span>
                        <strong>{formatCurrency(lineTotal)}</strong>
                        {product ? (
                          <Tag color="blue">{product.name}</Tag>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>No product linked</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </Space>
            )}
          </Form.List>

          <Divider />

          <Card
            size="small"
            variant="borderless"
            style={{ background: "#f8fafc", borderColor: "#cbd5e1", marginBottom: 16 }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div style={{ color: "#64748b", fontSize: 12 }}>Total Original Value</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {formatCurrency(packageOriginalValue)}
                </div>
              </div>
              <Form.Item
                name="packagePrice"
                label="Package Price"
                rules={[{ required: true, message: "Package price is required" }]}
                style={{ margin: 0, minWidth: 220 }}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: "100%" }}
                  placeholder="Enter package price"
                />
              </Form.Item>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>
                Package price is set manually. No automatic discounts are applied here.
              </span>
            </div>
          </Card>

          {validationError ? (
            <Alert type="warning" message={validationError} showIcon style={{ marginBottom: 12 }} />
          ) : null}

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" onClick={handleSave} loading={saving}>
              {editingId ? "Save Changes" : "Create Package"}
            </Button>
          </Space>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default PackageManagerPage;
