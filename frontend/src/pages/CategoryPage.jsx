import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import { getProducts, getCategoryTree } from "../api/api.js";

// Flattens the category tree into a single lookup list (used to resolve the
// page heading from a slug, whether it's a top-level category or a subcategory).
const flatten = (tree) => tree.flatMap((c) => [c, ...(c.children || [])]);

export default function CategoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || 1);
  const sort = searchParams.get("sort") || "newest";

  const [categoryTree, setCategoryTree] = useState([]);
  const [products, setProducts] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getCategoryTree().then((res) => setCategoryTree(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12, sort };
    if (category) params.category = category;
    if (search) params.search = search;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    getProducts(params)
      .then((res) => {
        setProducts(res.data.products || []);
        setPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      })
      .catch(() => {
        setProducts([]);
        setPages(1);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [category, search, page, sort, minPrice, maxPrice]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const applyPriceFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    setSearchParams(next);
  };

  const flatCategories = flatten(categoryTree);
  const activeCategoryName = flatCategories.find((c) => c.slug === category)?.name;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl text-maroon">
            {search ? `Search results for "${search}"` : category ? activeCategoryName || "Shop" : "Shop All Products"}
          </h2>
          <p className="text-sm text-gray-500">{total} product{total !== 1 ? "s" : ""} found</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="lg:hidden flex items-center gap-1 border border-gray-300 rounded-full px-4 py-2 text-sm"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
            <h4 className="font-semibold mb-3 text-sm">Category</h4>
            <ul className="space-y-1 text-sm text-gray-600 mb-6">
              <li>
                <button
                  onClick={() => updateParam("category", "")}
                  className={`hover:text-rakhired py-1 ${!category ? "text-rakhired font-medium" : ""}`}
                >
                  All Categories
                </button>
              </li>
              {categoryTree.map((c) => (
                <li key={c._id || c.slug}>
                  <button
                    onClick={() => updateParam("category", c.slug)}
                    className={`hover:text-rakhired py-1 font-medium block ${category === c.slug ? "text-rakhired" : "text-gray-700"}`}
                  >
                    {c.emoji} {c.name}
                  </button>
                  {c.children?.length > 0 && (
                    <ul className="pl-4 border-l border-gray-100 ml-1 space-y-1 mt-1">
                      {c.children.map((sub) => (
                        <li key={sub._id || sub.slug}>
                          <button
                            onClick={() => updateParam("category", sub.slug)}
                            className={`hover:text-rakhired py-1 block ${category === sub.slug ? "text-rakhired font-medium" : ""}`}
                          >
                            {sub.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <h4 className="font-semibold mb-3 text-sm">Price Range</h4>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={applyPriceFilter}
              className="w-full bg-rakhired text-white text-sm py-2 rounded-lg hover:bg-maroon transition-colors"
            >
              Apply
            </button>
          </div>
        </aside>

        <div>
          {loading ? (
            <p className="text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500">No products found. Try adjusting your filters.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {products.map((p) => (
                <ProductCard key={p._id || p.slug} product={p} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParam("page", String(p))}
                  className={`w-9 h-9 rounded-full text-sm border ${
                    p === page
                      ? "bg-rakhired text-white border-rakhired"
                      : "border-gray-300 text-gray-600 hover:border-rakhired hover:text-rakhired"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
