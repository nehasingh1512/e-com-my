import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard.jsx";
import { getBestSellers } from "../api/api.js";

const fallbackProducts = [
  { slug: "elegant-pearl-rakhi", name: "Elegant Pearl Rakhi", price: 199, mrp: 249, discountPercent: 20, rating: 4.8, reviewCount: 128, emoji: "💠" },
  { slug: "royal-stone-rakhi", name: "Royal Stone Rakhi", price: 299, mrp: 399, discountPercent: 25, rating: 4.7, reviewCount: 96, emoji: "🔴" },
  { slug: "rudraksha-rakhi-product", name: "Rudraksha Rakhi", price: 249, mrp: 349, discountPercent: 29, rating: 4.6, reviewCount: 65, emoji: "📿" },
  { slug: "silver-om-rakhi", name: "Silver Om Rakhi", price: 349, mrp: 499, discountPercent: 30, rating: 4.9, reviewCount: 104, emoji: "🕉️" },
  { slug: "peacock-designer-rakhi", name: "Peacock Designer Rakhi", price: 279, mrp: 379, discountPercent: 26, rating: 4.6, reviewCount: 86, emoji: "🦚" },
  { slug: "personalized-name-rakhi", name: "Personalized Name Rakhi", price: 279, mrp: 399, discountPercent: 30, rating: 4.5, reviewCount: 35, emoji: "🏷️" },
];

export default function BestSelling() {
  const [products, setProducts] = useState(fallbackProducts);

  useEffect(() => {
    getBestSellers()
      .then((res) => {
        if (res.data?.products?.length) setProducts(res.data.products);
      })
      .catch(() => {
        // keep fallback data if API/DB isn't running
      });
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-2xl text-maroon flex items-center gap-2">
          Best Selling Rakhis <span className="w-8 h-[2px] bg-gold inline-block" />
        </h3>
        <Link to="/shop" className="text-rakhired text-sm font-medium flex items-center gap-1">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id || p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
