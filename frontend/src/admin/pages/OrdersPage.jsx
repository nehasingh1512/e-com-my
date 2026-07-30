import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import Badge from "../components/Badge.jsx";
import { getAdminOrders } from "../api/adminApi.js";

const STATUS_COLORS = {
  pending: "amber", confirmed: "blue", processing: "blue", packed: "purple",
  shipped: "purple", out_for_delivery: "purple", delivered: "green",
  cancelled: "red", returned: "red", refunded: "gray",
};

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned", "refunded"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [customer, setCustomer] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getAdminOrders({ status, customer, page, limit: 15 })
      .then((res) => {
        setOrders(res.data.orders || []);
        setPages(res.data.pages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, customer, page]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-maroon">Orders</h2>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={customer}
            onChange={(e) => { setCustomer(e.target.value); setPage(1); }}
            placeholder="Search by customer..."
            className="border border-gray-300 rounded-full pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-rakhired"
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-gray-300 rounded-full px-4 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Items</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-6 text-gray-400">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-6 text-gray-400">No orders found.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link to={`/admin/orders/${o._id}`} className="font-medium text-rakhired hover:underline">
                      #{o._id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{o.user?.name || o.guestEmail || "Guest"}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-3 text-gray-500">{o.items.length}</td>
                  <td className="px-5 py-3 font-medium">₹{o.totalPrice}</td>
                  <td className="px-5 py-3"><Badge color={STATUS_COLORS[o.status]}>{o.status.replace(/_/g, " ")}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-full text-sm border ${p === page ? "bg-rakhired text-white border-rakhired" : "border-gray-300 text-gray-600"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
