import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { validateLoginForm } from "../utils/validation.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const nextFieldErrors = {};
    if (!form.email.trim()) nextFieldErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextFieldErrors.email = "Enter a valid email";
    if (!form.password.trim()) nextFieldErrors.password = "Password is required";
    setFieldErrors(nextFieldErrors);
    const validationError = validateLoginForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h2 className="font-display text-2xl text-maroon mb-1">Welcome Back</h2>
      <p className="text-gray-500 text-sm mb-6">Login to your Rakhi account</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            aria-invalid={Boolean(fieldErrors.email)}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired ${
              fieldErrors.email ? "border-rakhired" : "border-gray-300"
            }`}
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-rakhired">{fieldErrors.email}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium block">Password</label>
            <Link to="/forgot-password" className="text-xs text-rakhired hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            aria-invalid={Boolean(fieldErrors.password)}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired ${
              fieldErrors.password ? "border-rakhired" : "border-gray-300"
            }`}
          />
          {fieldErrors.password && <p className="mt-1 text-xs text-rakhired">{fieldErrors.password}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rakhired text-white py-3 rounded-full hover:bg-maroon transition-colors disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-sm text-center text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-rakhired font-medium">Register</Link>
        </p>
        <button
          type="button"
          onClick={() => navigate("/checkout")}
          className="w-full text-center text-xs text-gray-400 hover:text-rakhired"
        >
          Continue as guest instead
        </button>
      </form>
    </div>
  );
}
