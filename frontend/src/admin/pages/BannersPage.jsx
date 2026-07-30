import React, { useEffect, useState } from "react";
import { Plus, Power, Trash2 } from "lucide-react";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import { getAdminBanners, createAdminBanner, toggleAdminBanner, deleteAdminBanner, uploadImage } from "../api/adminApi.js";

const emptyForm = { title: "", subtitle: "", type: "promo", desktopImage: "", mobileImage: "", linkUrl: "", displayOrder: 0 };

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = () => getAdminBanners().then((res) => setBanners(res.data || []));
  useEffect(() => { load(); }, []);

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await uploadImage(formData);
      setForm((f) => ({ ...f, [field]: res.data.url }));
    } catch (err) {
      setError("Image upload failed (is the backend running?)");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    const nextFieldErrors = {};
    if (!form.title.trim()) nextFieldErrors.title = "Banner title is required";
    if (!form.desktopImage.trim()) nextFieldErrors.desktopImage = "Desktop image is required";
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;
    try {
      await createAdminBanner(form);
      setForm(emptyForm);
      setFieldErrors({});
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save banner.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-maroon">Banner Management</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 bg-rakhired text-white px-4 py-2 rounded-full text-sm hover:bg-maroon">
          <Plus size={14} /> Add Banner
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.length === 0 ? (
          <p className="text-gray-400 text-sm">No banners yet.</p>
        ) : (
          banners.map((b) => (
            <div key={b._id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="h-28 bg-gradient-to-br from-[#f3e3cd] to-[#efd9c4] flex items-center justify-center text-4xl">
                {b.desktopImage ? <img src={b.desktopImage} alt="" className="w-full h-full object-cover" /> : "🖼️"}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{b.title}</p>
                  <Badge color={b.isActive ? "green" : "gray"}>{b.isActive ? "Active" : "Off"}</Badge>
                </div>
                <p className="text-xs text-gray-500 mb-3 capitalize">{b.type.replace("_", " ")} · order {b.displayOrder}</p>
                <div className="flex items-center gap-3 text-gray-400">
                  <button onClick={() => toggleAdminBanner(b._id).then(load)} className="hover:text-gold"><Power size={15} /></button>
                  <button onClick={async () => { if (confirm("Delete this banner?")) { await deleteAdminBanner(b._id); load(); } }} className="hover:text-rakhired"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <Modal title="Add Banner" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              {fieldErrors.title && <p className="mt-1 text-xs text-rakhired">{fieldErrors.title}</p>}
            </div>
            <input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="hero_slider">Homepage Hero Slider</option>
              <option value="promo">Promotional Banner</option>
              <option value="homepage">Homepage Banner</option>
            </select>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Desktop Image</label>
              <input type="file" accept="image/*" onChange={(e) => handleUpload("desktopImage", e.target.files[0])} className="text-sm" />
              {fieldErrors.desktopImage && <p className="mt-1 text-xs text-rakhired">{fieldErrors.desktopImage}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Mobile Image</label>
              <input type="file" accept="image/*" onChange={(e) => handleUpload("mobileImage", e.target.files[0])} className="text-sm" />
            </div>
            {uploading && <p className="text-xs text-gray-400">Uploading...</p>}
            <input placeholder="Link URL (optional)" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Display Order" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button type="submit" className="w-full bg-rakhired text-white py-2 rounded-full text-sm hover:bg-maroon">Save Banner</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
