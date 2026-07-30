import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Tags, Package, Users, ShoppingCart, Ticket, Image as ImageIcon,
  Star, BarChart3, Settings, Shield, Bell, LogOut, Menu, X,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { getAdminNotifications, markAllNotificationsRead } from "../api/adminApi.js";

const navSections = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/categories", label: "Categories", icon: Tags, permission: "categories" },
  { to: "/admin/products", label: "Products", icon: Package, permission: "products" },
  { to: "/admin/customers", label: "Customers", icon: Users, permission: "customers" },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders" },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket, permission: "products" },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon, permission: "settings" },
  { to: "/admin/reviews", label: "Reviews", icon: Star, permission: "products" },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, permission: "reports" },
  { to: "/admin/settings", label: "Settings", icon: Settings, permission: "settings" },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/staff", label: "Staff & Roles", icon: Shield, superAdminOnly: true },
];

export default function AdminLayout() {
  const { admin, logout, can } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getAdminNotifications().then((res) => setNotifications(res.data || [])).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const visibleNav = navSections.filter((item) => {
    if (item.superAdminOnly) return admin?.role === "super_admin";
    if (item.permission) return can(item.permission);
    return true;
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block w-64 bg-maroon text-cream shrink-0 fixed lg:static inset-y-0 z-40`}>
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-full bg-rakhired flex items-center justify-center">❁</div>
          <div>
            <p className="font-display text-lg leading-none">Rakhi Admin</p>
            <p className="text-[10px] text-cream/60">Control Panel</p>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive ? "bg-white/15 text-white" : "text-cream/80 hover:bg-white/10"
                }`
              }
            >
              <item.icon size={17} /> {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="bg-white shadow-sm sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 py-3">
          <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen((s) => !s)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setNotifOpen((o) => !o)} className="relative text-gray-500 hover:text-rakhired">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rakhired text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 text-sm z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <span className="font-medium">Notifications</span>
                    <button
                      className="text-xs text-rakhired"
                      onClick={async () => {
                        await markAllNotificationsRead();
                        setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
                      }}
                    >
                      Mark all read
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-gray-400">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} className={`px-4 py-2 ${n.isRead ? "" : "bg-rakhired/5"}`}>
                        <p className="text-gray-700">{n.message}</p>
                        <p className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">{admin?.name}</p>
              <p className="text-[11px] text-gray-400 capitalize">{admin?.role?.replace("_", " ")}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
              className="text-gray-400 hover:text-rakhired"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
