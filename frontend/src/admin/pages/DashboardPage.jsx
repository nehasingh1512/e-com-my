import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, Tags, ShoppingCart, Users, Clock, Loader, CheckCircle2, XCircle,
  IndianRupee, AlertTriangle, TrendingUp,
} from "lucide-react";
import { getDashboard } from "../api/adminApi.js";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading dashboard...</p>;
  if (!data) return <p className="text-gray-500">Could not load dashboard data.</p>;

  const stats = [
    { icon: Package, label: "Total Products", value: data.totalProducts, color: "bg-rakhired" },
    { icon: Tags, label: "Total Categories", value: data.totalCategories, color: "bg-gold" },
    { icon: ShoppingCart, label: "Total Orders", value: data.totalOrders, color: "bg-maroon" },
    { icon: Users, label: "Total Customers", value: data.totalCustomers, color: "bg-blue-500" },
    { icon: Clock, label: "Pending Orders", value: data.pendingOrders, color: "bg-amber-500" },
    { icon: Loader, label: "Processing Orders", value: data.processingOrders, color: "bg-purple-500" },
    { icon: CheckCircle2, label: "Completed Orders", value: data.completedOrders, color: "bg-green-600" },
    { icon: XCircle, label: "Cancelled Orders", value: data.cancelledOrders, color: "bg-red-500" },
    { icon: IndianRupee, label: "Total Revenue", value: `₹${data.totalRevenue.toLocaleString("en-IN")}`, color: "bg-emerald-600" },
    { icon: AlertTriangle, label: "Low Stock Products", value: data.lowStockProducts.length, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-maroon">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">Recent Orders</h3>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((o) => (
                <Link
                  key={o._id}
                  to={`/admin/orders/${o._id}`}
                  className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0 hover:text-rakhired"
                >
                  <div>
                    <p className="font-medium">#{o._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{o.user?.name || o.guestEmail || "Guest"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{o.totalPrice}</p>
                    <p className="text-xs text-gray-400 capitalize">{o.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-rakhired" /> Best Selling Products
          </h3>
          {data.bestSellingProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No best sellers marked yet.</p>
          ) : (
            <div className="space-y-3">
              {data.bestSellingProducts.map((p) => (
                <div key={p._id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.emoji}</span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{p.price}</p>
                    <p className="text-xs text-gray-400">★ {p.rating} ({p.reviewCount})</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-600">
            <AlertTriangle size={16} /> Low Stock Alerts
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.lowStockProducts.map((p) => (
              <Link
                key={p._id}
                to={`/admin/products?search=${encodeURIComponent(p.name)}`}
                className="border border-orange-100 bg-orange-50 rounded-xl px-4 py-3 text-sm hover:border-orange-300"
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-orange-600 text-xs">Stock: {p.stock} (threshold {p.lowStockThreshold})</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
