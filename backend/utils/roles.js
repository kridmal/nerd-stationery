const ADMIN_ROLES = ["root_admin", "manager_admin", "admin"];

export const normalizeAdminRole = (role) => {
  const normalized = String(role || "").toLowerCase();
  if (["root", "root_admin", "owner", "admin-root"].includes(normalized)) {
    return "root_admin";
  }
  if (["manager", "manager_admin", "admin", "admin-manager"].includes(normalized)) {
    return "manager_admin";
  }
  return role || "customer";
};

export const isAdminRole = (role) => ADMIN_ROLES.includes(normalizeAdminRole(role));

export const isRootAdminRole = (role) => normalizeAdminRole(role) === "root_admin";

export const sanitizeUserForResponse = (userDoc) => {
  if (!userDoc) return null;
  const plain = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  delete plain.password;
  return {
    ...plain,
    role: normalizeAdminRole(plain.role),
  };
};
