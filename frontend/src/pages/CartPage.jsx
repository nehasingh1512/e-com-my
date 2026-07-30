import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, getCartLineId } from "../context/CartContext.jsx";

export default function CartPage() {
  const { cart, updateQty, removeFromCart, cartSubtotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
        <h2 className="font-display text-2xl text-maroon mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added any rakhis yet.</p>
        <Link to="/shop" className="bg-rakhired text-white px-6 py-3 rounded-full hover:bg-maroon transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  const shipping = cartSubtotal >= 499 ? 0 : 49;
  const total = cartSubtotal + shipping;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-[1fr_340px] gap-8">
      <div>
        <h2 className="font-display text-2xl text-maroon mb-6">Your Cart ({cart.length})</h2>
        <div className="space-y-4">
          {cart.map((item) => {
            const id = getCartLineId(item);
            const variantLabel = [item.selectedSize, item.selectedColor].filter(Boolean).join(" · ");
            return (
              <div key={id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#f3e3cd] to-[#efd9c4] flex items-center justify-center text-3xl shrink-0">
                  {item.emoji || "🪢"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {variantLabel && <p className="text-xs text-gray-500">{variantLabel}</p>}
                  <p className="text-maroon font-semibold text-sm">₹{item.price}</p>
                </div>
                <div className="flex items-center border border-gray-300 rounded-full">
                  <button onClick={() => updateQty(id, item.qty - 1)} className="p-2 hover:text-rakhired">
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-sm">{item.qty}</span>
                  <button onClick={() => updateQty(id, item.qty + 1)} className="p-2 hover:text-rakhired">
                    <Plus size={14} />
                  </button>
                </div>
                <p className="w-16 text-right font-semibold text-sm">₹{item.price * item.qty}</p>
                <button onClick={() => removeFromCart(id)} className="text-gray-400 hover:text-rakhired">
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-24">
        <h3 className="font-semibold mb-4">Order Summary</h3>
        <div className="flex justify-between text-sm mb-2 text-gray-600">
          <span>Subtotal</span>
          <span>₹{cartSubtotal}</span>
        </div>
        <div className="flex justify-between text-sm mb-4 text-gray-600">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
        </div>
        <div className="flex justify-between font-semibold text-maroon border-t border-gray-100 pt-4 mb-6">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
        <button
          onClick={() => navigate("/checkout")}
          className="w-full bg-rakhired text-white py-3 rounded-full hover:bg-maroon transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
