import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCategoryTree } from "../api/api.js";

const fallbackCategories = [
  { name: "Rakhi & Raksha Bandhan", slug: "rakhi", emoji: "🪢", children: [] },
  { name: "Jewellery", slug: "jewellery", emoji: "💍", children: [] },
  { name: "Ladies Wear", slug: "ladies-wear", emoji: "👗", children: [] },
  { name: "Gents Wear", slug: "gents-wear", emoji: "👔", children: [] },
  { name: "Kids Wear", slug: "kids-wear", emoji: "🧸", children: [] },
];

export default function CategoryGrid() {
  const [categories, setCategories] = useState(fallbackCategories);

  useEffect(() => {
    getCategoryTree()
      .then((res) => {
        if (res.data?.length) setCategories(res.data);
      })
      .catch(() => {
        // keep fallback data if API/DB isn't running
      });
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-2xl text-maroon flex items-center gap-2">
          Shop By Category <span className="w-8 h-[2px] bg-gold inline-block" />
        </h3>
        <Link to="/shop" className="text-rakhired text-sm font-medium flex items-center gap-1">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map((cat) => (
          <Link
            to={`/shop?category=${cat.slug}`}
            key={cat._id || cat.slug}
            className="text-center group cursor-pointer block"
          >
            <div className="aspect-square rounded-2xl bg-[#f0ddc7] flex items-center justify-center text-4xl mb-2 group-hover:shadow-lg transition-shadow border border-white/70">
              {cat.emoji || "🎀"}
            </div>
            <p className="text-sm font-medium flex items-center justify-center gap-1">
              {cat.name}
              <span className="w-4 h-4 rounded-full bg-rakhired text-white text-[10px] flex items-center justify-center">
                <ArrowRight size={10} />
              </span>
            </p>
            {cat.children?.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-0.5">{cat.children.length} categories</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
