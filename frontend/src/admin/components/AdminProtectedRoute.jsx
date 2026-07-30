import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

export default function AdminProtectedRoute({ children, permission, superAdminOnly }) {
  const { admin, loading, can } = useAdminAuth();

  if (loading) return <div className="p-10 text-gray-500">Loading...</div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  if (superAdminOnly && admin.role !== "super_admin") {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">Only Super Admins can access this section.</p>
      </div>
    );
  }
  if (permission && !can(permission)) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">You don't have permission to access this section.</p>
      </div>
    );
  }
  return children;
}
