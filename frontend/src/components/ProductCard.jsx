import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";

export default function ProductCard({ product }) {
  const { name, price, mrp, discountPercent, rating, reviewCount, emoji, slug, images } = product;
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const id = product._id || slug;
  const wishlisted = isWishlisted(id);
  const [qty, setQty] = useState(1);
  const featuredImage = images?.find((img) => img.isFeatured) || images?.[0];

  const increment = () => setQty((current) => current + 1);
  const decrement = () => setQty((current) => Math.max(1, current - 1));

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-4 relative border border-maroon/5">
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product);
        }}
        className={`absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center transition-colors ${
          wishlisted ? "text-rakhired" : "text-gray-400 hover:text-rakhired"
        }`}
      >
        <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
      </button>

      <Link to={`/product/${slug}`}>
        <div className="aspect-square rounded-xl bg-[#f0ddc7] flex items-center justify-center text-5xl mb-4 border border-white overflow-hidden">
          {featuredImage ? (
            <img src={featuredImage.url} alt={name} className="w-full h-full object-cover" />
          ) : (
            emoji || "✿"
          )}
        </div>
        <h4 className="font-medium text-sm mb-1 hover:text-rakhired">{name}</h4>
      </Link>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <Star size={12} className="fill-gold text-gold" />
        {rating} ({reviewCount})
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold text-maroon">₹{price}</span>
        <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
        <span className="text-xs text-rakhired font-medium">{discountPercent}% OFF</span>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3 rounded-lg border border-gray-200 px-3 py-2">
        <span className="text-xs font-medium text-gray-600">Qty</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decrement}
            className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-rakhired hover:text-rakhired"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-6 text-center text-sm font-semibold text-gray-800">{qty}</span>
          <button
            type="button"
            onClick={increment}
            className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-rakhired hover:text-rakhired"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <button
        onClick={() => addToCart(product, qty)}
        className="w-full bg-rakhired text-white text-sm py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-maroon transition-colors"
      >
        Add to Cart <ShoppingCart size={14} />
      </button>
    </div>
  );
}
