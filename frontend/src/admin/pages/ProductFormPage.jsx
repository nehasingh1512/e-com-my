import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Star, History } from "lucide-react";
import {
  getAdminProduct, createAdminProduct, updateAdminProduct, getAdminCategories,
  uploadImages, adjustStock, getStockHistory,
} from "../api/adminApi.js";

const emptyProduct = {
  name: "", slug: "", sku: "", barcode: "", brand: "", category: "",
  emoji: "🪢", images: [],
  shortDescription: "", description: "",
  price: "", mrp: "", discountPercent: 0, tax: 0,
  stock: 0, lowStockThreshold: 10,
  isActive: true, bestSeller: false, featured: false, newArrival: false,
  variants: [], sizes: [],
  display: { showQuantitySelector: true, showSizeDropdown: false, showColorDropdown: false },
};

const TABS = ["Basic", "Pricing", "Inventory", "Images", "Variants", "Display"];

export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [product, setProduct] = useState(emptyProduct);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState("Basic");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stockAdjust, setStockAdjust] = useState({ change: "", reason: "" });
  const [stockHistory, setStockHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getAdminCategories().then((res) => setCategories(res.data || [])).catch(() => {});
    if (!isNew) {
      getAdminProduct(id).then((res) => {
        const p = res.data;
        setProduct({ ...emptyProduct, ...p, category: p.category?._id || "" });
      });
    }
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    const nextFieldErrors = {};
    if (!product.name.trim()) nextFieldErrors.name = "Product name is required";
    if (product.price === "" || Number(product.price) < 0) nextFieldErrors.price = "Valid sale price is required";
    if (product.mrp === "" || Number(product.mrp) < 0) nextFieldErrors.mrp = "Valid MRP is required";
    if (product.category === "") nextFieldErrors.category = "Select a category";
    if (Number(product.price) > Number(product.mrp)) nextFieldErrors.price = "Sale price cannot exceed MRP";
    if (product.images.length === 0) nextFieldErrors.images = "Upload at least one product image";
    product.variants.forEach((v, idx) => {
      if ((v.size || v.color || v.material || v.price || v.stock) && !v.size && !v.color && !v.material && !String(v.price || "").trim() && String(v.stock ?? "").trim() === "") {
        return;
      }
      if ((v.size || v.color || v.material || v.price || v.stock) && !v.size && !v.color && !v.material) {
        nextFieldErrors[`variant_${idx}`] = "Add at least one variant value or remove the row";
      }
    });
    product.sizes.forEach((s, idx) => {
      if ((s.label || s.stock !== 0) && !s.label) {
        nextFieldErrors[`size_${idx}`] = "Size label is required";
      }
    });
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;
    setSaving(true);
    try {
      const payload = { ...product, price: Number(product.price), mrp: Number(product.mrp) };
      if (isNew) {
        const res = await createAdminProduct(payload);
        navigate(`/admin/products/${res.data._id}`);
      } else {
        await updateAdminProduct(id, payload);
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("images", f));
      const res = await uploadImages(formData);
      const newImages = res.data.urls.map((url, i) => ({
        url, isFeatured: product.images.length === 0 && i === 0, order: product.images.length + i,
      }));
      setProduct((p) => ({ ...p, images: [...p.images, ...newImages] }));
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed. (Is the backend running?)");
    } finally {
      setUploading(false);
    }
  };

  const setFeaturedImage = (idx) => {
    setProduct((p) => ({ ...p, images: p.images.map((img, i) => ({ ...img, isFeatured: i === idx })) }));
  };

  const removeImage = (idx) => {
    setProduct((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
  };

  const moveImage = (idx, dir) => {
    setProduct((p) => {
      const imgs = [...p.images];
      const target = idx + dir;
      if (target < 0 || target >= imgs.length) return p;
      [imgs[idx], imgs[target]] = [imgs[target], imgs[idx]];
      return { ...p, images: imgs };
    });
  };

  const addVariant = () => {
    setProduct((p) => ({ ...p, variants: [...p.variants, { size: "", color: "", material: "", stock: 0, price: "", sku: "" }] }));
  };
  const updateVariant = (idx, field, value) => {
    setProduct((p) => ({ ...p, variants: p.variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v)) }));
  };
  const removeVariant = (idx) => {
    setProduct((p) => ({ ...p, variants: p.variants.filter((_, i) => i !== idx) }));
  };

  const addSize = () => {
    setProduct((p) => ({ ...p, sizes: [...p.sizes, { label: "", stock: 0 }] }));
  };
  const updateSize = (idx, field, value) => {
    setProduct((p) => ({ ...p, sizes: p.sizes.map((s, i) => (i === idx ? { ...s, [field]: value } : s)) }));
  };
  const removeSize = (idx) => {
    setProduct((p) => ({ ...p, sizes: p.sizes.filter((_, i) => i !== idx) }));
  };

  const handleStockAdjust = async () => {
    if (!stockAdjust.change) return;
    const res = await adjustStock(id, { change: Number(stockAdjust.change), reason: stockAdjust.reason });
    setProduct((p) => ({ ...p, stock: res.data.stock }));
    setStockAdjust({ change: "", reason: "" });
  };

  const loadHistory = async () => {
    const res = await getStockHistory(id);
    setStockHistory(res.data || []);
    setShowHistory(true);
  };

  return (
    <div className="max-w-4xl">
      <Link to="/admin/products" className="flex items-center gap-1 text-sm text-gray-500 hover:text-rakhired mb-4">
        <ArrowLeft size={14} /> Back to Products
      </Link>

      <h2 className="font-display text-2xl text-maroon mb-6">{isNew ? "Add Product" : "Edit Product"}</h2>

      {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === t ? "border-rakhired text-rakhired" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {tab === "Basic" && (
          <>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={product.isActive} onChange={(e) => setProduct({ ...product, isActive: e.target.checked })} /> Active</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={product.featured} onChange={(e) => setProduct({ ...product, featured: e.target.checked })} /> Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={product.newArrival} onChange={(e) => setProduct({ ...product, newArrival: e.target.checked })} /> New Arrival</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={product.bestSeller} onChange={(e) => setProduct({ ...product, bestSeller: e.target.checked })} /> Best Seller</label>
            </div>
            <input required placeholder="Product Name" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            {fieldErrors.name && <p className="text-xs text-rakhired">{fieldErrors.name}</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Slug (auto if blank)" value={product.slug} onChange={(e) => setProduct({ ...product, slug: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="SKU" value={product.sku} onChange={(e) => setProduct({ ...product, sku: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Brand" value={product.brand} onChange={(e) => setProduct({ ...product, brand: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <select value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Category</option>
                {categories.filter((c) => !c.parent).map((parent) => (
                  <optgroup key={parent._id} label={`${parent.emoji} ${parent.name}`}>
                    <option value={parent._id}>{parent.name} (all)</option>
                    {categories
                      .filter((c) => (c.parent?._id || c.parent) === parent._id)
                      .map((sub) => (
                        <option key={sub._id} value={sub._id}>&nbsp;&nbsp;↳ {sub.name}</option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {fieldErrors.category && <p className="text-xs text-rakhired">{fieldErrors.category}</p>}
            <input placeholder="Emoji / placeholder icon" value={product.emoji} onChange={(e) => setProduct({ ...product, emoji: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Short Description" value={product.shortDescription} onChange={(e) => setProduct({ ...product, shortDescription: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} />
            <textarea placeholder="Full Description" value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={4} />
          </>
        )}

        {tab === "Pricing" && (
          <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Regular Price (MRP)</label>
                <input required type="number" value={product.mrp} onChange={(e) => setProduct({ ...product, mrp: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                {fieldErrors.mrp && <p className="mt-1 text-xs text-rakhired">{fieldErrors.mrp}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sale Price</label>
                <input required type="number" value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                {fieldErrors.price && <p className="mt-1 text-xs text-rakhired">{fieldErrors.price}</p>}
              </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Discount %</label>
              <input type="number" value={product.discountPercent} onChange={(e) => setProduct({ ...product, discountPercent: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tax % (optional)</label>
              <input type="number" value={product.tax} onChange={(e) => setProduct({ ...product, tax: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {tab === "Inventory" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Current Stock</label>
                <input type="number" value={product.stock} onChange={(e) => setProduct({ ...product, stock: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Low Stock Alert Threshold</label>
                <input type="number" value={product.lowStockThreshold} onChange={(e) => setProduct({ ...product, lowStockThreshold: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <input placeholder="Barcode (optional)" value={product.barcode} onChange={(e) => setProduct({ ...product, barcode: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
            </div>

            {!isNew && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium mb-2">Quick Stock Adjustment</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <input type="number" placeholder="+10 or -5" value={stockAdjust.change} onChange={(e) => setStockAdjust({ ...stockAdjust, change: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32" />
                  <input placeholder="Reason (e.g. restock)" value={stockAdjust.reason} onChange={(e) => setStockAdjust({ ...stockAdjust, reason: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]" />
                  <button type="button" onClick={handleStockAdjust} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">Apply</button>
                  <button type="button" onClick={loadHistory} className="flex items-center gap-1 text-sm text-gray-500 hover:text-rakhired">
                    <History size={14} /> View History
                  </button>
                </div>
                {showHistory && (
                  <div className="mt-3 max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                    {stockHistory.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3">No stock changes recorded yet.</p>
                    ) : (
                      stockHistory.map((h) => (
                        <div key={h._id} className="p-3 text-xs flex justify-between">
                          <span>{h.reason} {h.admin?.name ? `by ${h.admin.name}` : ""}</span>
                          <span className={h.change >= 0 ? "text-green-600" : "text-red-600"}>
                            {h.change >= 0 ? "+" : ""}{h.change} ({h.previousStock} → {h.newStock})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "Images" && (
          <div className="space-y-4">
            {fieldErrors.images && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{fieldErrors.images}</p>}
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="text-sm" />
            {uploading && <p className="text-xs text-gray-400">Uploading...</p>}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <div key={idx} className="relative border border-gray-200 rounded-xl overflow-hidden group">
                  <img src={img.url} alt="" className="w-full h-24 object-cover" />
                  {img.isFeatured && <span className="absolute top-1 left-1 bg-rakhired text-white text-[9px] px-1.5 py-0.5 rounded">Featured</span>}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button type="button" onClick={() => setFeaturedImage(idx)} title="Set featured" className="bg-white rounded-full p-1"><Star size={12} /></button>
                    <button type="button" onClick={() => moveImage(idx, -1)} title="Move left" className="bg-white rounded-full p-1 text-xs">←</button>
                    <button type="button" onClick={() => moveImage(idx, 1)} title="Move right" className="bg-white rounded-full p-1 text-xs">→</button>
                    <button type="button" onClick={() => removeImage(idx)} title="Remove" className="bg-white rounded-full p-1"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            {product.images.length === 0 && <p className="text-xs text-gray-400">No images uploaded — the storefront will fall back to the emoji placeholder.</p>}
          </div>
        )}

        {tab === "Variants" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Variants (Size / Color / Material)</p>
                <button type="button" onClick={addVariant} className="flex items-center gap-1 text-xs text-rakhired"><Plus size={12} /> Add Variant</button>
              </div>
              {product.variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-2 items-center">
                  <input placeholder="Size" value={v.size || ""} onChange={(e) => updateVariant(idx, "size", e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                  <input placeholder="Color" value={v.color || ""} onChange={(e) => updateVariant(idx, "color", e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                  <input placeholder="Material" value={v.material || ""} onChange={(e) => updateVariant(idx, "material", e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                  <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => updateVariant(idx, "stock", Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                  <input type="number" placeholder="Price (optional)" value={v.price || ""} onChange={(e) => updateVariant(idx, "price", e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => removeVariant(idx)} className="text-gray-400 hover:text-rakhired justify-self-start"><Trash2 size={14} /></button>
                  {fieldErrors[`variant_${idx}`] && <p className="col-span-6 text-xs text-rakhired">{fieldErrors[`variant_${idx}`]}</p>}
                </div>
              ))}
              {product.variants.length === 0 && <p className="text-xs text-gray-400">No variants added.</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Sizes (with per-size stock)</p>
                <button type="button" onClick={addSize} className="flex items-center gap-1 text-xs text-rakhired"><Plus size={12} /> Add Size</button>
              </div>
              {product.sizes.map((s, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 mb-2 items-center">
                  <input placeholder="Label (S, M, L...)" value={s.label} onChange={(e) => updateSize(idx, "label", e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                  <input type="number" placeholder="Stock" value={s.stock} onChange={(e) => updateSize(idx, "stock", Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => removeSize(idx)} className="text-gray-400 hover:text-rakhired justify-self-start"><Trash2 size={14} /></button>
                  {fieldErrors[`size_${idx}`] && <p className="col-span-3 text-xs text-rakhired">{fieldErrors[`size_${idx}`]}</p>}
                </div>
              ))}
              {product.sizes.length === 0 && <p className="text-xs text-gray-400">No sizes added. Enable "Show Size Dropdown" in Display settings to use these on the storefront.</p>}
            </div>
          </div>
        )}

        {tab === "Display" && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={product.display.showQuantitySelector} onChange={(e) => setProduct({ ...product, display: { ...product.display, showQuantitySelector: e.target.checked } })} />
              Show Quantity Selector
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={product.display.showSizeDropdown} onChange={(e) => setProduct({ ...product, display: { ...product.display, showSizeDropdown: e.target.checked } })} />
              Show Size Dropdown (uses Sizes list from the Variants tab — customers can't order beyond each size's stock)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={product.display.showColorDropdown} onChange={(e) => setProduct({ ...product, display: { ...product.display, showColorDropdown: e.target.checked } })} />
              Show Color Dropdown (uses Color values from the Variants tab)
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate("/admin/products")} className="px-5 py-2 rounded-full border border-gray-300 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-rakhired text-white text-sm hover:bg-maroon disabled:opacity-60">
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
