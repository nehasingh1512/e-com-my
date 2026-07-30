import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function WishlistPage() {
  const { wishlist } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Heart className="mx-auto text-gray-300 mb-4" size={64} />
        <h2 className="font-display text-2xl text-maroon mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save your favorite rakhis here to buy them later.</p>
        <Link to="/shop" className="bg-rakhired text-white px-6 py-3 rounded-full hover:bg-maroon transition-colors">
          Browse Rakhis
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="font-display text-2xl text-maroon mb-6">My Wishlist ({wishlist.length})</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {wishlist.map((p) => (
          <ProductCard key={p._id || p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
