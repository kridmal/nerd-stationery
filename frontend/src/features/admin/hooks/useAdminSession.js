import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const parseAdminInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("adminInfo")) || {};
  } catch (error) {
    return {};
  }
};

const roleLabel = (role) => {
  if (role === "root_admin") return "Admin-Root";
  if (role === "manager_admin" || role === "admin") return "Admin-Manager";
  return "Admin";
};

const useAdminSession = () => {
  const navigate = useNavigate();
  const adminInfo = useMemo(() => parseAdminInfo(), []);
  const token = useMemo(() => localStorage.getItem("adminToken"), []);

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
    }
  }, [navigate, token]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin-login");
  };

  return {
    admin: adminInfo,
    roleLabel: roleLabel(adminInfo?.role),
    isRootAdmin: adminInfo?.role === "root_admin",
    isManagerAdmin: adminInfo?.role === "manager_admin" || adminInfo?.role === "admin",
    logout,
  };
};

export default useAdminSession;
