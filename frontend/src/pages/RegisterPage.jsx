import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { validateRegisterForm } from "../utils/validation.js";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const nextFieldErrors = {};
    if (!form.name.trim()) nextFieldErrors.name = "Name is required";
    if (!form.email.trim()) nextFieldErrors.email = "Email is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextFieldErrors.email = "Enter a valid email";
    if (!form.password) nextFieldErrors.password = "Password is required";
    else if (form.password.length < 6) nextFieldErrors.password = "Password must be at least 6 characters";
    if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())) nextFieldErrors.phone = "Enter a valid phone number";
    setFieldErrors(nextFieldErrors);
    const validationError = validateRegisterForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim());
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h2 className="font-display text-2xl text-maroon mb-1">Create Account</h2>
      <p className="text-gray-500 text-sm mb-6">Join Rakhi — Thread of Love</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="text-sm font-medium mb-1 block">Full Name</label>
          <input
            required
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-invalid={Boolean(fieldErrors.name)}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired ${
              fieldErrors.name ? "border-rakhired" : "border-gray-300"
            }`}
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-rakhired">{fieldErrors.name}</p>}
        </div>
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
          <label className="text-sm font-medium mb-1 block">Phone</label>
          <input
            inputMode="tel"
            maxLength={20}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            aria-invalid={Boolean(fieldErrors.phone)}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired ${
              fieldErrors.phone ? "border-rakhired" : "border-gray-300"
            }`}
          />
          {fieldErrors.phone && <p className="mt-1 text-xs text-rakhired">{fieldErrors.phone}</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Password</label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
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
          {loading ? "Creating account..." : "Register"}
        </button>
        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-rakhired font-medium">Login</Link>
        </p>
      </form>
    </div>
  );
}
