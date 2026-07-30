import React, { useEffect, useState } from "react";
import { MapPin, Trash2, Star, Plus } from "lucide-react";
import { getAddresses, createAddress, deleteAddress, updateAddress } from "../api/api.js";
import { validateAddressForm } from "../utils/validation.js";

const emptyAddress = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", label: "Home" };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = () => {
    setLoading(true);
    getAddresses()
      .then((res) => setAddresses(res.data || []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    const nextFieldErrors = {};
    if (!form.fullName.trim()) nextFieldErrors.fullName = "Full name is required";
    if (!form.phone.trim()) nextFieldErrors.phone = "Phone number is required";
    else if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())) nextFieldErrors.phone = "Enter a valid phone number";
    if (!form.line1.trim()) nextFieldErrors.line1 = "Address line 1 is required";
    if (!form.city.trim()) nextFieldErrors.city = "City is required";
    if (!form.state.trim()) nextFieldErrors.state = "State is required";
    if (!/^[0-9]{6}$/.test(String(form.pincode).trim())) nextFieldErrors.pincode = "Pincode must be 6 digits";
    setFieldErrors(nextFieldErrors);
    const validationError = validateAddressForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      await createAddress({
        ...form,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: String(form.pincode).trim(),
      });
      setForm(emptyAddress);
      setFieldErrors({});
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save address.");
    }
  };

  const handleDelete = async (id) => {
    await deleteAddress(id);
    load();
  };

  const handleSetDefault = async (id) => {
    await updateAddress(id, { isDefault: true });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-maroon">My Addresses</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1 bg-rakhired text-white px-4 py-2 rounded-full text-sm hover:bg-maroon transition-colors"
        >
          <Plus size={14} /> Add Address
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm p-5 mb-6 grid sm:grid-cols-2 gap-3">
          {error && <p className="text-sm text-rakhired sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <input required placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} aria-invalid={Boolean(fieldErrors.fullName)} className={`w-full border rounded-lg px-3 py-2 text-sm ${fieldErrors.fullName ? "border-rakhired" : "border-gray-300"}`} />
            {fieldErrors.fullName && <p className="mt-1 text-xs text-rakhired">{fieldErrors.fullName}</p>}
          </div>
          <div className="sm:col-span-2">
            <input required inputMode="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-invalid={Boolean(fieldErrors.phone)} className={`w-full border rounded-lg px-3 py-2 text-sm ${fieldErrors.phone ? "border-rakhired" : "border-gray-300"}`} />
            {fieldErrors.phone && <p className="mt-1 text-xs text-rakhired">{fieldErrors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <input required placeholder="Address Line 1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} aria-invalid={Boolean(fieldErrors.line1)} className={`w-full border rounded-lg px-3 py-2 text-sm ${fieldErrors.line1 ? "border-rakhired" : "border-gray-300"}`} />
            {fieldErrors.line1 && <p className="mt-1 text-xs text-rakhired">{fieldErrors.line1}</p>}
          </div>
          <div className="sm:col-span-2">
            <input placeholder="Address Line 2 (optional)" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} aria-invalid={Boolean(fieldErrors.city)} className={`w-full border rounded-lg px-3 py-2 text-sm ${fieldErrors.city ? "border-rakhired" : "border-gray-300"}`} />
            {fieldErrors.city && <p className="mt-1 text-xs text-rakhired">{fieldErrors.city}</p>}
          </div>
          <div>
            <input required placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} aria-invalid={Boolean(fieldErrors.state)} className={`w-full border rounded-lg px-3 py-2 text-sm ${fieldErrors.state ? "border-rakhired" : "border-gray-300"}`} />
            {fieldErrors.state && <p className="mt-1 text-xs text-rakhired">{fieldErrors.state}</p>}
          </div>
          <div>
            <input required inputMode="numeric" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} aria-invalid={Boolean(fieldErrors.pincode)} className={`w-full border rounded-lg px-3 py-2 text-sm ${fieldErrors.pincode ? "border-rakhired" : "border-gray-300"}`} />
            {fieldErrors.pincode && <p className="mt-1 text-xs text-rakhired">{fieldErrors.pincode}</p>}
          </div>
          <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
          <button type="submit" className="sm:col-span-2 bg-rakhired text-white py-2 rounded-full text-sm hover:bg-maroon transition-colors">
            Save Address
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="mx-auto text-gray-300 mb-4" size={56} />
          <p className="text-gray-500">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a._id} className="bg-white rounded-2xl shadow-sm p-4 flex items-start justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium flex items-center gap-2">
                  {a.fullName} <span className="text-xs text-gray-400 font-normal">· {a.label}</span>
                  {a.isDefault && <span className="text-xs bg-rakhired/10 text-rakhired px-2 py-0.5 rounded-full">Default</span>}
                </p>
                <p className="text-gray-500">{a.line1}, {a.line2 ? `${a.line2}, ` : ""}{a.city}, {a.state} - {a.pincode}</p>
                <p className="text-gray-500">{a.phone}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {!a.isDefault && (
                  <button onClick={() => handleSetDefault(a._id)} title="Set as default" className="text-gray-400 hover:text-gold">
                    <Star size={16} />
                  </button>
                )}
                <button onClick={() => handleDelete(a._id)} className="text-gray-400 hover:text-rakhired">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
