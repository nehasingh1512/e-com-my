import React, { useEffect, useState } from "react";
import { Plus, Power, Trash2 } from "lucide-react";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import { getAdminCoupons, createAdminCoupon, toggleAdminCoupon, deleteAdminCoupon } from "../api/adminApi.js";

const emptyForm = { code: "", type: "percentage", value: "", startDate: "", endDate: "", usageLimit: "", minPurchase: "" };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = () => getAdminCoupons().then((res) => setCoupons(res.data || []));
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    const nextFieldErrors = {};
    if (!form.code.trim()) nextFieldErrors.code = "Coupon code is required";
    if (form.value === "" || Number(form.value) <= 0) nextFieldErrors.value = "Enter a valid discount value";
    if (form.startDate && form.endDate && form.endDate < form.startDate) nextFieldErrors.endDate = "End date must be after start date";
    if (form.usageLimit && Number(form.usageLimit) <= 0) nextFieldErrors.usageLimit = "Usage limit must be positive";
    if (form.minPurchase && Number(form.minPurchase) < 0) nextFieldErrors.minPurchase = "Minimum purchase cannot be negative";
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;
    try {
      await createAdminCoupon({
        ...form,
        value: Number(form.value),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        minPurchase: form.minPurchase ? Number(form.minPurchase) : 0,
      });
      setForm(emptyForm);
      setFieldErrors({});
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create coupon.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-maroon">Coupons & Discounts</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 bg-rakhired text-white px-4 py-2 rounded-full text-sm hover:bg-maroon">
          <Plus size={14} /> Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Discount</th>
              <th className="px-5 py-3">Min Purchase</th>
              <th className="px-5 py-3">Usage</th>
              <th className="px-5 py-3">Validity</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-6 text-gray-400">No coupons yet.</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c._id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-5 py-3">{c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="px-5 py-3 text-gray-500">₹{c.minPurchase || 0}</td>
                  <td className="px-5 py-3 text-gray-500">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {c.startDate ? new Date(c.startDate).toLocaleDateString("en-IN") : "—"} - {c.endDate ? new Date(c.endDate).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-5 py-3"><Badge color={c.isActive ? "green" : "gray"}>{c.isActive ? "Active" : "Disabled"}</Badge></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-gray-400">
                      <button onClick={() => toggleAdminCoupon(c._id).then(load)} className="hover:text-gold"><Power size={15} /></button>
                      <button onClick={async () => { if (confirm("Delete this coupon?")) { await deleteAdminCoupon(c._id); load(); } }} className="hover:text-rakhired"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Create Coupon" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <input required placeholder="Coupon Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
              {fieldErrors.code && <p className="mt-1 text-xs text-rakhired">{fieldErrors.code}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <div>
                <input required type="number" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
                {fieldErrors.value && <p className="mt-1 text-xs text-rakhired">{fieldErrors.value}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                {fieldErrors.endDate && <p className="mt-1 text-xs text-rakhired">{fieldErrors.endDate}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input type="number" placeholder="Usage Limit (blank = unlimited)" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
                {fieldErrors.usageLimit && <p className="mt-1 text-xs text-rakhired">{fieldErrors.usageLimit}</p>}
              </div>
              <div>
                <input type="number" placeholder="Min Purchase ₹" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
                {fieldErrors.minPurchase && <p className="mt-1 text-xs text-rakhired">{fieldErrors.minPurchase}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400">Category/product-specific targeting can be added after creation via the API (`categories`/`products` fields).</p>
            <button type="submit" className="w-full bg-rakhired text-white py-2 rounded-full text-sm hover:bg-maroon">Create Coupon</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
