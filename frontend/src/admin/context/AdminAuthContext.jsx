import React, { createContext, useContext, useEffect, useState } from "react";
import { adminLogin, adminMe } from "../api/adminApi.js";

const AdminAuthContext = createContext(null);

const ADMIN_ROLES = ["super_admin", "admin", "store_manager", "order_manager"];

const ROLE_DEFAULTS = {
  super_admin: { products: true, categories: true, orders: true, customers: true, reports: true, settings: true },
  admin: { products: true, categories: true, orders: true, customers: true, reports: true, settings: true },
  store_manager: { products: true, categories: true, orders: false, customers: false, reports: true, settings: false },
  order_manager: { products: false, categories: false, orders: true, customers: true, reports: false, settings: false },
};

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("rakhi_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    adminMe()
      .then((res) => {
        if (ADMIN_ROLES.includes(res.data.role)) setAdmin(res.data);
        else localStorage.removeItem("rakhi_admin_token");
      })
      .catch(() => localStorage.removeItem("rakhi_admin_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await adminLogin({ email, password });
    if (!ADMIN_ROLES.includes(res.data.role)) {
      throw { response: { data: { message: "This account doesn't have admin access." } } };
    }
    localStorage.setItem("rakhi_admin_token", res.data.token);
    setAdmin(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("rakhi_admin_token");
    setAdmin(null);
  };

  const can = (section) => {
    if (!admin) return false;
    if (admin.role === "super_admin") return true;
    const hasCustom = admin.permissions && Object.values(admin.permissions).some((v) => v === true);
    if (hasCustom) return !!admin.permissions[section];
    return !!ROLE_DEFAULTS[admin.role]?.[section];
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, can }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
