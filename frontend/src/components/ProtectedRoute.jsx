import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
}
