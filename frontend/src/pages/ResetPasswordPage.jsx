import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { resetPassword } from "../api/api.js";

const ADMIN_ROLES = ["super_admin", "admin", "store_manager", "order_manager"];

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAdminAccount, setIsAdminAccount] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      const isAdmin = ADMIN_ROLES.includes(res.data.role);

      // Customer and admin sessions live under different localStorage keys
      // (rakhi_token vs rakhi_admin_token) and different, independently
      // mounted auth contexts — log them straight into the right one.
      if (isAdmin) {
        localStorage.setItem("rakhi_admin_token", res.data.token);
      } else {
        localStorage.setItem("rakhi_token", res.data.token);
      }
      setIsAdminAccount(isAdmin);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto text-green-600 mb-4" size={56} />
        <h2 className="font-display text-2xl text-maroon mb-2">Password Updated</h2>
        <p className="text-gray-500 text-sm mb-6">You're all set — you've been logged in.</p>
        <a
          href={isAdminAccount ? "/admin" : "/"}
          className="bg-rakhired text-white px-6 py-3 rounded-full hover:bg-maroon transition-colors inline-block"
        >
          {isAdminAccount ? "Go to Admin Panel" : "Continue Shopping"}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h2 className="font-display text-2xl text-maroon mb-1">Set a New Password</h2>
      <p className="text-gray-500 text-sm mb-6">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="text-sm font-medium mb-1 block">New Password</label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rakhired text-white py-3 rounded-full hover:bg-maroon transition-colors disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
        <p className="text-sm text-center text-gray-500">
          <Link to="/forgot-password" className="text-rakhired font-medium">Request a new link</Link>
          {" · "}
          <Link to="/login" className="text-rakhired font-medium">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}
