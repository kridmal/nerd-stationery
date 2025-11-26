import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isAdminRole, isRootAdminRole, normalizeAdminRole } from "../utils/roles.js";

const errorResponse = (res, status, message) => res.status(status).json({ message });
const extractToken = (req) => req.header("Authorization")?.replace("Bearer ", "");

const authAdmin = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return errorResponse(res, 401, "Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.id).select("-password");

    if (!admin || !isAdminRole(admin.role)) return errorResponse(res, 403, "Admin privileges required");

    const normalizedRole = normalizeAdminRole(admin.role);
    req.admin = {
      ...admin.toObject(),
      role: normalizedRole,
    };
    req.adminRole = normalizedRole;
    req.adminId = String(admin._id);

    next();
  } catch (error) {
    errorResponse(res, 400, "Invalid token");
  }
};

export const requireRootAdmin = (req, res, next) => {
  if (!req.adminRole || !isRootAdminRole(req.adminRole)) {
    return errorResponse(res, 403, "Root admin access required");
  }
  next();
};

export default authAdmin;
