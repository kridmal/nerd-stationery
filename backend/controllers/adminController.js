import User from "../models/User.js";
import {
  isAdminRole,
  isRootAdminRole,
  normalizeAdminRole,
  sanitizeUserForResponse,
} from "../utils/roles.js";

const ADMIN_ROLES = ["root_admin", "manager_admin", "admin"];
const badRequest = (res, message) => res.status(400).json({ message });
const sanitizeAdmin = (admin) => sanitizeUserForResponse(admin);

const ensureAdminTarget = (user) => {
  if (!user || !isAdminRole(user.role)) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }
};

const findAdminByIdOrThrow = async (id) => {
  const admin = await User.findById(id);
  ensureAdminTarget(admin);
  return admin;
};

export const getCurrentAdmin = async (req, res) => {
  return res.json({ admin: sanitizeAdmin(req.admin) });
};

export const listAdmins = async (_req, res) => {
  const admins = await User.find({ role: { $in: ADMIN_ROLES } })
    .select("-password")
    .sort({ createdAt: 1 });

  res.json({
    admins: admins.map((admin) => sanitizeAdmin(admin)),
  });
};

export const createAdmin = async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return badRequest(res, "Name, email and password are required");
  }

  const normalizedRole = normalizeAdminRole(role || "manager_admin");
  if (!isAdminRole(normalizedRole)) {
    return badRequest(res, "Invalid admin role");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return badRequest(res, "Admin with this email already exists");
  }

  const admin = await User.create({ name, email, password, role: normalizedRole });
  return res.status(201).json({ admin: sanitizeAdmin(admin) });
};

export const resetAdminPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body || {};

  if (!newPassword || String(newPassword).length < 6) {
    return badRequest(res, "New password must be at least 6 characters long");
  }

  const admin = await findAdminByIdOrThrow(id);

  const isSelf = req.adminId === String(admin._id);
  if (!isSelf && !isRootAdminRole(req.adminRole)) {
    return res
      .status(403)
      .json({ message: "Only root admins can reset passwords for other admins" });
  }

  admin.password = newPassword;
  await admin.save();

  return res.json({
    message: isSelf ? "Password updated" : "Admin password reset",
    admin: sanitizeAdmin(admin),
  });
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const admin = await findAdminByIdOrThrow(id);

  const normalizedTargetRole = normalizeAdminRole(admin.role);
  if (isRootAdminRole(normalizedTargetRole)) {
    return res.status(400).json({ message: "Root admin accounts cannot be deleted" });
  }

  await admin.deleteOne();
  return res.json({ message: "Admin removed" });
};
