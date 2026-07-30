import React, { useState } from "react";
import { Search, PackageSearch } from "lucide-react";
import { trackGuestOrder } from "../api/api.js";
import OrderSummaryDetail from "../components/OrderSummaryDetail.jsx";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOrder(null);

    const trimmedId = orderId.trim();
    if (!trimmedId || !email.trim()) {
      setError("Please enter both your Order ID and the email used at checkout.");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await trackGuestOrder(trimmedId, email.trim());
      setOrder(res.data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "We couldn't find an order with that ID."
          : err.response?.data?.message || "We couldn't verify this order. Please check the order ID and email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {!order && (
        <div className="text-center mb-8">
          <PackageSearch className="mx-auto text-rakhired mb-3" size={40} />
          <h2 className="font-display text-2xl text-maroon mb-1">Track Your Order</h2>
          <p className="text-gray-500 text-sm">
            Enter your Order ID and the email you used at checkout. You can find your Order
            ID in the confirmation email we sent you.
          </p>
        </div>
      )}

      {!order && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4 max-w-md mx-auto">
          {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="text-sm font-medium mb-1 block">Order ID</label>
            <input
              placeholder="e.g. 66f1a2b3c4d5e6f789012345"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rakhired"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email used at checkout</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rakhired text-white py-3 rounded-full flex items-center justify-center gap-2 hover:bg-maroon transition-colors disabled:opacity-60"
          >
            <Search size={16} /> {loading ? "Searching..." : "Track Order"}
          </button>
          {searched && !order && !loading && (
            <p className="text-xs text-gray-400 text-center">
              Have an account? <a href="/login" className="text-rakhired">Log in</a> to see all your orders in one place.
            </p>
          )}
        </form>
      )}

      {order && (
        <div>
          <button
            onClick={() => {
              setOrder(null);
              setSearched(false);
            }}
            className="text-sm text-gray-500 hover:text-rakhired mb-4"
          >
            ← Track a different order
          </button>
          <OrderSummaryDetail order={order} />
        </div>
      )}
    </div>
  );
}
