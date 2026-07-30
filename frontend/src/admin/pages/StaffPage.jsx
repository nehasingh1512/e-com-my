import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import { getStaff, createStaff, updateStaff, deleteStaff, getActivityLog } from "../api/adminApi.js";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

const ROLES = ["admin", "store_manager", "order_manager", "super_admin"];
const emptyForm = { name: "", email: "", password: "", role: "store_manager" };

export default function StaffPage() {
  const { admin } = useAdminAuth();
  const [staff, setStaff] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("staff");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const loadStaff = () => getStaff().then((res) => setStaff(res.data || []));
  const loadLogs = () => getActivityLog().then((res) => setLogs(res.data || []));

  useEffect(() => { loadStaff(); }, []);
  useEffect(() => { if (tab === "logs") loadLogs(); }, [tab]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createStaff(form);
      setForm(emptyForm);
      setShowForm(false);
      loadStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create staff account.");
    }
  };

  const handleRoleChange = async (id, role) => {
    await updateStaff(id, { role });
    loadStaff();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-maroon">Staff & Roles</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 bg-rakhired text-white px-4 py-2 rounded-full text-sm hover:bg-maroon">
          <Plus size={14} /> Add Staff
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("staff")} className={`px-4 py-2 rounded-full text-sm border ${tab === "staff" ? "bg-rakhired text-white border-rakhired" : "border-gray-300 text-gray-600"}`}>Staff Accounts</button>
        <button onClick={() => setTab("logs")} className={`px-4 py-2 rounded-full text-sm border ${tab === "logs" ? "bg-rakhired text-white border-rakhired" : "border-gray-300 text-gray-600"}`}>Activity Log</button>
      </div>

      {tab === "staff" ? (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s._id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-gray-500">{s.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={s.role}
                      onChange={(e) => handleRoleChange(s._id, e.target.value)}
                      disabled={s._id === admin._id}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs capitalize"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3"><Badge color={s.isActive ? "green" : "gray"}>{s.isActive ? "Active" : "Disabled"}</Badge></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <button
                        disabled={s._id === admin._id}
                        onClick={async () => { if (confirm(`Remove ${s.name}?`)) { await deleteStaff(s._id); loadStaff(); } }}
                        className="text-gray-400 hover:text-rakhired disabled:opacity-30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-6 text-gray-400">No activity recorded yet.</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l._id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3">{l.admin?.name || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs">{l.action}</td>
                    <td className="px-5 py-3 text-gray-500">{l.details}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="Add Staff Account" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
            <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input required type="password" minLength={6} placeholder="Temporary Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm capitalize">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
            </select>
            <button type="submit" className="w-full bg-rakhired text-white py-2 rounded-full text-sm hover:bg-maroon">Create Account</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
