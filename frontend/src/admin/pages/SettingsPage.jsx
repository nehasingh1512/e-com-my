import React, { useEffect, useState } from "react";
import { getAdminSettings, updateAdminSettings, uploadImage } from "../api/adminApi.js";

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminSettings().then((res) => setForm(res.data)).catch(() => setError("Could not load settings."));
  }, []);

  const handleUpload = async (field, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    const res = await uploadImage(formData);
    setForm((f) => ({ ...f, [field]: res.data.url }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await updateAdminSettings(form);
      setForm(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-gray-500">{error || "Loading settings..."}</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-display text-2xl text-maroon">Website Settings</h2>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <p className="text-xs font-semibold text-gray-500">Store Information</p>
        <input placeholder="Store Name" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Contact Email" value={form.storeEmail} onChange={(e) => setForm({ ...form, storeEmail: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Contact Phone" value={form.storePhone} onChange={(e) => setForm({ ...form, storePhone: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <textarea placeholder="Store Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} />

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Logo</label>
            <input type="file" accept="image/*" onChange={(e) => handleUpload("logoUrl", e.target.files[0])} className="text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Favicon</label>
            <input type="file" accept="image/*" onChange={(e) => handleUpload("faviconUrl", e.target.files[0])} className="text-sm" />
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-500 pt-2">Social Media Links</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Facebook URL" value={form.socialLinks?.facebook || ""} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, facebook: e.target.value } })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Instagram URL" value={form.socialLinks?.instagram || ""} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, instagram: e.target.value } })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="YouTube URL" value={form.socialLinks?.youtube || ""} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, youtube: e.target.value } })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Pinterest URL" value={form.socialLinks?.pinterest || ""} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, pinterest: e.target.value } })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <p className="text-xs font-semibold text-gray-500 pt-2">Footer & Policies</p>
        <textarea placeholder="Footer Text" value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} />
        <textarea placeholder="Terms & Conditions" value={form.termsAndConditions} onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
        <textarea placeholder="Privacy Policy" value={form.privacyPolicy} onChange={(e) => setForm({ ...form, privacyPolicy: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
        <textarea placeholder="Shipping Policy" value={form.shippingPolicy} onChange={(e) => setForm({ ...form, shippingPolicy: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
        <textarea placeholder="Return Policy" value={form.returnPolicy} onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="bg-rakhired text-white px-6 py-2 rounded-full text-sm hover:bg-maroon disabled:opacity-60">
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </form>
    </div>
  );
}
