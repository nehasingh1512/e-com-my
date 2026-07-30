import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "../api/api.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      // The backend always returns this same generic response whether or not
      // the account exists — that's deliberate (prevents email enumeration),
      // so we show the same success state either way here too.
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto text-green-600 mb-4" size={56} />
        <h2 className="font-display text-2xl text-maroon mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm mb-6">
          If an account exists for <strong>{email}</strong>, we've sent a link to reset your
          password. It expires in 1 hour.
        </p>
        <Link to="/login" className="text-rakhired font-medium text-sm">Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h2 className="font-display text-2xl text-maroon mb-1">Forgot Password</h2>
      <p className="text-gray-500 text-sm mb-6">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rakhired text-white py-3 rounded-full hover:bg-maroon transition-colors disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        <p className="text-sm text-center text-gray-500">
          Remembered your password?{" "}
          <Link to="/login" className="text-rakhired font-medium">Login</Link>
        </p>
      </form>
    </div>
  );
}
