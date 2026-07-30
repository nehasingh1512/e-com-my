import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Power, Copy, Search } from "lucide-react";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import {
  getAdminProducts, toggleAdminProduct, duplicateAdminProduct, deleteAdminProduct,
} from "../api/adminApi.js";
import { getAdminCategories } from "../api/adminApi.js";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getAdminCategories().then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    getAdminProducts({ search, page, limit: 15 })
      .then((res) => {
        setProducts(res.data.products || []);
        setPages(res.data.pages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-maroon">Products</h2>
        <Link to="/admin/products/new" className="flex items-center gap-1 bg-rakhired text-white px-4 py-2 rounded-full text-sm hover:bg-maroon">
          <Plus size={14} /> Add Product
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="w-full border border-gray-300 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Flags</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-6 text-gray-400">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-6 text-gray-400">No products found.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 flex items-center gap-2">
                    <span className="text-xl">{p.emoji}</span>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sku || "—"}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{p.category?.name || "—"}</td>
                  <td className="px-5 py-3">₹{p.price}</td>
                  <td className="px-5 py-3">
                    <span className={p.stock <= 0 ? "text-red-600" : p.stock <= p.lowStockThreshold ? "text-orange-600" : "text-gray-600"}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {p.bestSeller && <Badge color="amber">Best Seller</Badge>}
                      {p.featured && <Badge color="purple">Featured</Badge>}
                      {p.newArrival && <Badge color="blue">New</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge color={p.isActive ? "green" : "gray"}>{p.isActive ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-gray-400">
                      <button onClick={() => toggleAdminProduct(p._id).then(load)} title="Enable/Disable" className="hover:text-gold">
                        <Power size={15} />
                      </button>
                      <button onClick={() => duplicateAdminProduct(p._id).then(load)} title="Duplicate" className="hover:text-blue-500">
                        <Copy size={15} />
                      </button>
                      <Link to={`/admin/products/${p._id}`} className="hover:text-rakhired">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => setDeleteTarget(p)} className="hover:text-rakhired">
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

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-full text-sm border ${
                p === page ? "bg-rakhired text-white border-rakhired" : "border-gray-300 text-gray-600 hover:border-rakhired"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete product "${deleteTarget.name}"? This cannot be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteAdminProduct(deleteTarget._id);
            setDeleteTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
