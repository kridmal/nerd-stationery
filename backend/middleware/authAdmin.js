import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isAdminRole, isRootAdminRole, normalizeAdminRole } from "../utils/roles.js";

const authAdmin = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.id).select("-password");

    if (!admin || !isAdminRole(admin.role)) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    const normalizedRole = normalizeAdminRole(admin.role);
    req.admin = {
      ...admin.toObject(),
      role: normalizedRole,
    };
    req.adminRole = normalizedRole;
    req.adminId = String(admin._id);

    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

export const requireRootAdmin = (req, res, next) => {
  if (!req.adminRole || !isRootAdminRole(req.adminRole)) {
    return res.status(403).json({ message: "Root admin access required" });
  }
  next();
};

export default authAdmin;
