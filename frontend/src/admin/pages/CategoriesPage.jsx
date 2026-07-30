import React, { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Power, CornerDownRight } from "lucide-react";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Badge from "../components/Badge.jsx";
import {
  getAdminCategories, createAdminCategory, updateAdminCategory,
  toggleAdminCategory, deleteAdminCategory,
} from "../api/adminApi.js";

const emptyForm = {
  name: "", slug: "", parent: "", emoji: "🎀", image: "", description: "",
  displayOrder: 0, seo: { title: "", metaDescription: "" },
};

// Sorts a flat category list into a display order where each parent is
// immediately followed by its children, for the indented tree table.
const sortAsTree = (categories) => {
  const byParent = {};
  categories.forEach((c) => {
    const key = c.parent?._id || c.parent || "root";
    byParent[key] = byParent[key] || [];
    byParent[key].push(c);
  });
  const ordered = [];
  const walk = (parentKey, depth) => {
    (byParent[parentKey] || []).forEach((c) => {
      ordered.push({ ...c, depth });
      walk(c._id, depth + 1);
    });
  };
  walk("root", 0);
  return ordered;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // category object or "new"
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    getAdminCategories().then((res) => setCategories(res.data || [])).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const treeRows = useMemo(() => sortAsTree(categories), [categories]);

  // Categories that are valid "parent" choices for the one being edited:
  // top-level only (no nesting past 2 levels), excluding itself.
  const parentOptions = useMemo(
    () => categories.filter((c) => !c.parent && (editing === "new" || c._id !== editing?._id)),
    [categories, editing]
  );

  const openNew = (parentId = "") => {
    setForm({ ...emptyForm, parent: parentId });
    setEditing("new");
  };

  const openEdit = (cat) => {
    setForm({
      name: cat.name, slug: cat.slug, parent: cat.parent?._id || cat.parent || "",
      emoji: cat.emoji, image: cat.image || "",
      description: cat.description || "", displayOrder: cat.displayOrder || 0,
      seo: cat.seo || { title: "", metaDescription: "" },
    });
    setEditing(cat);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    const nextFieldErrors = {};
    if (!form.name.trim()) nextFieldErrors.name = "Category name is required";
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;
    try {
      const payload = { ...form, parent: form.parent || null };
      if (editing === "new") await createAdminCategory(payload);
      else await updateAdminCategory(editing._id, payload);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save category.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-maroon">Categories</h2>
          <p className="text-xs text-gray-400 mt-1">
            Add top-level categories (e.g. Jewellery, Kids Wear) and nest subcategories underneath them —
            they'll appear as a submenu on the storefront.
          </p>
        </div>
        <button onClick={() => openNew()} className="flex items-center gap-1 bg-rakhired text-white px-4 py-2 rounded-full text-sm hover:bg-maroon shrink-0">
          <Plus size={14} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-6 text-gray-400">Loading...</td></tr>
            ) : treeRows.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-6 text-gray-400">No categories yet.</td></tr>
            ) : (
              treeRows.map((c) => (
                <tr key={c._id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: c.depth * 24 }}>
                      {c.depth > 0 && <CornerDownRight size={13} className="text-gray-300 shrink-0" />}
                      <span className="text-xl">{c.emoji}</span>
                      <span className={c.depth === 0 ? "font-medium" : ""}>{c.name}</span>
                      {c.depth === 0 && (
                        <button
                          onClick={() => openNew(c._id)}
                          title={`Add subcategory under ${c.name}`}
                          className="text-[10px] text-rakhired border border-rakhired/30 rounded-full px-2 py-0.5 hover:bg-rakhired/10 ml-1"
                        >
                          + Sub
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{c.slug}</td>
                  <td className="px-5 py-3 text-gray-500">{c.displayOrder}</td>
                  <td className="px-5 py-3">
                    <Badge color={c.isActive ? "green" : "gray"}>{c.isActive ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-gray-400">
                      <button onClick={() => toggleAdminCategory(c._id).then(load)} title="Enable/Disable" className="hover:text-gold">
                        <Power size={15} />
                      </button>
                      <button onClick={() => openEdit(c)} className="hover:text-rakhired">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="hover:text-rakhired">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === "new" ? "Add Category" : "Edit Category"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}

            <div>
              <label className="text-xs text-gray-500 block mb-1">Parent Category</label>
              <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— None (top-level category) —</option>
                {parentOptions.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Leave as "None" for a main menu item (e.g. Jewellery). Choose a parent to make this a submenu
                item under it (e.g. Earrings under Jewellery).
              </p>
            </div>

            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            {fieldErrors.name && <p className="text-xs text-rakhired">{fieldErrors.name}</p>}
            <input placeholder="Slug (auto-generated if blank)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Emoji / icon" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Image URL (optional)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
            <input type="number" placeholder="Display Order" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />

            <p className="text-xs font-semibold text-gray-500 pt-2">SEO</p>
            <input placeholder="SEO Title" value={form.seo.title} onChange={(e) => setForm({ ...form, seo: { ...form.seo, title: e.target.value } })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Meta Description" value={form.seo.metaDescription} onChange={(e) => setForm({ ...form, seo: { ...form.seo, metaDescription: e.target.value } })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} />

            <button type="submit" className="w-full bg-rakhired text-white py-2 rounded-full text-sm hover:bg-maroon mt-2">
              Save Category
            </button>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete category "${deleteTarget.name}"? This cannot be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              await deleteAdminCategory(deleteTarget._id);
            } catch (err) {
              setError(err.response?.data?.message || "Could not delete category.");
            }
            setDeleteTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
