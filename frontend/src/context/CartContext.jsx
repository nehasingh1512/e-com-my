import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { syncCart, syncWishlist, getServerCart, getServerWishlist } from "../api/api.js";
import { getVariantPrice } from "../utils/variant.js";

const CartContext = createContext(null);

const loadLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const CART_GUEST_KEY = "rakhi_cart_guest";
const WISHLIST_GUEST_KEY = "rakhi_wishlist_guest";
const CART_SERVER_KEY = "rakhi_cart_server";
const WISHLIST_SERVER_KEY = "rakhi_wishlist_server";

// A cart "line" is identified by product + the specific size/color chosen —
// NOT product alone. Two different sizes of the same rakhi are two separate
// lines; without this, selecting Size M then Size L would silently merge into
// one line and lose the size that was actually picked.
export const getCartLineId = (item) =>
  `${item._id || item.slug}::${item.selectedSize || ""}::${item.selectedColor || ""}`;

// If the product has a variant matching the chosen size/color with its own
// price override, use that instead of the base product price.
const resolveVariantPrice = (product) => getVariantPrice(product, product.selectedSize, product.selectedColor);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const hasToken = Boolean(localStorage.getItem("rakhi_token"));
  const [cart, setCart] = useState(() => loadLocal(hasToken ? CART_SERVER_KEY : CART_GUEST_KEY, []));
  const [wishlist, setWishlist] = useState(() => loadLocal(hasToken ? WISHLIST_SERVER_KEY : WISHLIST_GUEST_KEY, []));
  const [hydrated, setHydrated] = useState(false);

  // Persist guest cart/wishlist locally, and keep authenticated state in a separate cache
  useEffect(() => {
    const key = user ? CART_SERVER_KEY : CART_GUEST_KEY;
    localStorage.setItem(key, JSON.stringify(cart));
    if (user) {
      localStorage.removeItem(CART_GUEST_KEY);
    }
  }, [cart, user]);

  useEffect(() => {
    const key = user ? WISHLIST_SERVER_KEY : WISHLIST_GUEST_KEY;
    localStorage.setItem(key, JSON.stringify(wishlist));
    if (user) {
      localStorage.removeItem(WISHLIST_GUEST_KEY);
    }
  }, [wishlist, user]);

  // When a user logs in, pull their saved cart/wishlist from the server.
  // Only merge in guest data if it exists in the guest cache.
  useEffect(() => {
    if (!user) {
      setHydrated(true);
      return;
    }
    (async () => {
      try {
        const [cartRes, wishlistRes] = await Promise.all([getServerCart(), getServerWishlist()]);
        const serverCart = (cartRes.data || [])
          .filter((c) => c.product)
          .map((c) => ({ ...c.product, qty: c.qty, selectedSize: c.size || undefined, selectedColor: c.color || undefined }));
        const serverWishlist = wishlistRes.data || [];
        const guestCart = loadLocal(CART_GUEST_KEY, []);
        const guestWishlist = loadLocal(WISHLIST_GUEST_KEY, []);

        const mergedCartMap = new Map();
        [...serverCart, ...guestCart].forEach((item) => {
          const key = getCartLineId(item);
          if (mergedCartMap.has(key)) {
            mergedCartMap.get(key).qty += item.qty || 1;
          } else {
            mergedCartMap.set(key, { ...item, qty: item.qty || 1 });
          }
        });
        const mergedCart = Array.from(mergedCartMap.values());

        const mergedWishlistMap = new Map();
        [...serverWishlist, ...guestWishlist].forEach((item) => mergedWishlistMap.set(item._id || item.slug, item));
        const mergedWishlist = Array.from(mergedWishlistMap.values());

        setCart(mergedCart);
        setWishlist(mergedWishlist);

        localStorage.setItem(CART_SERVER_KEY, JSON.stringify(mergedCart));
        localStorage.setItem(WISHLIST_SERVER_KEY, JSON.stringify(mergedWishlist));
        localStorage.removeItem(CART_GUEST_KEY);
        localStorage.removeItem(WISHLIST_GUEST_KEY);
      } catch {
        // fall back to local guest data if server sync fails
      } finally {
        setHydrated(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Push cart/wishlist to server whenever they change, if logged in
  useEffect(() => {
    if (!user || !hydrated) return;
    syncCart(cart.map((i) => ({ product: i._id, qty: i.qty, size: i.selectedSize || "", color: i.selectedColor || "" }))).catch(() => {});
  }, [cart, user, hydrated]);

  useEffect(() => {
    if (!user || !hydrated) return;
    syncWishlist(wishlist.map((i) => i._id)).catch(() => {});
  }, [wishlist, user, hydrated]);

  const addToCart = (product, qty = 1) => {
    const price = resolveVariantPrice(product);
    setCart((prev) => {
      const key = getCartLineId(product);
      const existing = prev.find((i) => getCartLineId(i) === key);
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { ...product, price, qty }];
    });
  };

  const removeFromCart = (lineId) => setCart((prev) => prev.filter((i) => getCartLineId(i) !== lineId));

  const updateQty = (lineId, qty) => {
    if (qty < 1) return removeFromCart(lineId);
    setCart((prev) => prev.map((i) => (getCartLineId(i) === lineId ? { ...i, qty } : i)));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((i) => (i._id || i.slug) === (product._id || product.slug));
      if (exists) return prev.filter((i) => (i._id || i.slug) !== (product._id || product.slug));
      return [...prev, product];
    });
  };

  const isWishlisted = (id) => wishlist.some((i) => (i._id || i.slug) === id);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        toggleWishlist,
        isWishlisted,
        cartCount,
        cartSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
