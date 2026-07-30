import React, { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead } from "../api/adminApi.js";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminNotifications();
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl text-maroon">Notifications</h2>
          <p className="text-sm text-gray-500">Track store events like orders, stock alerts, and returns.</p>
        </div>
        <button
          onClick={handleReadAll}
          className="inline-flex items-center gap-2 bg-rakhired text-white px-4 py-2 rounded-full text-sm hover:bg-maroon"
        >
          <CheckCheck size={14} /> Mark All Read
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {loading ? (
          <p className="px-5 py-6 text-gray-500">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            <Bell className="mx-auto mb-3" size={34} />
            <p>No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className={`px-5 py-4 flex items-start justify-between gap-4 ${n.isRead ? "" : "bg-rakhired/5"}`}>
              <div>
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => handleRead(n._id)}
                  className="text-xs text-rakhired font-medium hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
