import React, { useEffect, useState } from "react";
import { Search, Power, Eye } from "lucide-react";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import { getAdminCustomers, getAdminCustomer, toggleAdminCustomer } from "../api/adminApi.js";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    getAdminCustomers({ search, page, limit: 15 })
      .then((res) => {
        setCustomers(res.data.customers || []);
        setPages(res.data.pages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, page]);

  const openDetail = async (id) => {
    const res = await getAdminCustomer(id);
    setDetail(res.data);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-maroon">Customers</h2>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="w-full border border-gray-300 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-6 text-gray-400">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-6 text-gray-400">No customers found.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c._id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-gray-500">{c.email}</td>
                  <td className="px-5 py-3 text-gray-500">{c.phone || "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-3">
                    <Badge color={c.isActive ? "green" : "red"}>{c.isActive ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-gray-400">
                      <button onClick={() => openDetail(c._id)} className="hover:text-rakhired"><Eye size={15} /></button>
                      <button onClick={() => toggleAdminCustomer(c._id).then(load)} title="Enable/Disable" className="hover:text-gold"><Power size={15} /></button>
                    </div>
                  </td>
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

      {detail && (
        <Modal title={detail.customer.name} onClose={() => setDetail(null)} wide>
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <p><span className="text-gray-400">Email:</span> {detail.customer.email}</p>
              <p><span className="text-gray-400">Phone:</span> {detail.customer.phone || "—"}</p>
              <p><span className="text-gray-400">Joined:</span> {new Date(detail.customer.createdAt).toLocaleDateString("en-IN")}</p>
              <p><span className="text-gray-400">Status:</span> {detail.customer.isActive ? "Active" : "Disabled"}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-sm">Addresses ({detail.addresses.length})</h4>
              {detail.addresses.length === 0 ? (
                <p className="text-xs text-gray-400">No saved addresses.</p>
              ) : (
                <div className="space-y-2">
                  {detail.addresses.map((a) => (
                    <div key={a._id} className="text-xs bg-gray-50 rounded-lg p-3">
                      {a.fullName}, {a.line1}, {a.city}, {a.state} - {a.pincode}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2 text-sm">Order History ({detail.orders.length})</h4>
              {detail.orders.length === 0 ? (
                <p className="text-xs text-gray-400">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {detail.orders.map((o) => (
                    <div key={o._id} className="flex justify-between text-xs bg-gray-50 rounded-lg p-3">
                      <span>#{o._id.slice(-8).toUpperCase()} · {o.status}</span>
                      <span className="font-medium">₹{o.totalPrice}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
