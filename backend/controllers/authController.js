import User from "../models/User.js";
import jwt from "jsonwebtoken";
import {
  normalizeAdminRole,
  sanitizeUserForResponse,
  isAdminRole,
} from "../utils/roles.js";

// Generate JWT
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const invalidCredentials = (res) => res.status(400).json({ message: "Invalid credentials" });
const serverError = (res, err) => res.status(500).json({ error: err.message });
const isAdminPortalLogin = (req, role) =>
  req.originalUrl?.includes("/auth/login") && req.headers["x-admin-portal"] && !isAdminRole(role);

// Register user (supports admin role)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const normalizedRole = normalizeAdminRole(role || "customer");
    const user = await User.create({
      name,
      email,
      password,
      role: normalizedRole,
    });
    const token = generateToken(user._id, normalizedRole);

    res.status(201).json({ token, user: sanitizeUserForResponse(user) });
  } catch (err) {
    serverError(res, err);
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return invalidCredentials(res);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return invalidCredentials(res);

    const normalizedRole = normalizeAdminRole(user.role);
    const token = generateToken(user._id, normalizedRole);
    const responseUser = sanitizeUserForResponse({
      ...user.toObject(),
      role: normalizedRole,
    });

    // Prevent non-admins from using the admin portal
    if (isAdminPortalLogin(req, normalizedRole)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to access the admin portal." });
    }

    res.json({ token, user: responseUser });
  } catch (err) {
    serverError(res, err);
  }
};
