import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { CartProvider, useCart, getCartLineId } from "../CartContext.jsx";

// Isolate CartContext from the real AuthContext/API — these tests are about
// cart logic, not auth or network behavior. Guest mode (no user) unless a
// specific test overrides this.
let mockUser = null;
vi.mock("../AuthContext.jsx", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockSyncCart = vi.fn(() => Promise.resolve({ data: [] }));
const mockSyncWishlist = vi.fn(() => Promise.resolve({ data: [] }));
const mockGetServerCart = vi.fn(() => Promise.resolve({ data: [] }));
const mockGetServerWishlist = vi.fn(() => Promise.resolve({ data: [] }));
vi.mock("../../api/api.js", () => ({
  syncCart: (...args) => mockSyncCart(...args),
  syncWishlist: (...args) => mockSyncWishlist(...args),
  getServerCart: (...args) => mockGetServerCart(...args),
  getServerWishlist: (...args) => mockGetServerWishlist(...args),
}));

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

const product = { _id: "p1", slug: "elegant-rakhi", name: "Elegant Rakhi", price: 199, mrp: 249 };

const productWithVariants = {
  _id: "p2",
  slug: "printed-kurti",
  name: "Printed Kurti",
  price: 599,
  mrp: 899,
  variants: [
    { size: "S", color: "Blue", stock: 5 },
    { size: "M", color: "Black", stock: 3, price: 649 },
  ],
};

beforeEach(() => {
  localStorage.clear();
  mockUser = null;
  vi.clearAllMocks();
});

describe("CartContext — line identity", () => {
  it("merges adding the same plain product twice into one line with increased qty", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart(product, 1));
    act(() => result.current.addToCart(product, 2));

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].qty).toBe(3);
  });

  // Regression test: this is the exact bug that shipped and had to be fixed
  // later — different sizes of the same product silently collapsing into one
  // cart line. Locking this in so it can't quietly regress again.
  it("keeps two different sizes of the same product as separate cart lines", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "S", selectedColor: "Blue" }, 1));
    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "M", selectedColor: "Black" }, 1));

    expect(result.current.cart).toHaveLength(2);
    expect(result.current.cart.find((i) => i.selectedSize === "S").qty).toBe(1);
    expect(result.current.cart.find((i) => i.selectedSize === "M").qty).toBe(1);
  });

  it("merges the same size/color selection added twice", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "S", selectedColor: "Blue" }, 1));
    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "S", selectedColor: "Blue" }, 2));

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].qty).toBe(3);
  });
});

describe("CartContext — variant pricing", () => {
  it("charges the variant's own price when one was selected and exists", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "M", selectedColor: "Black" }, 1));
    expect(result.current.cart[0].price).toBe(649);
  });

  it("charges the base price when no variant price override applies", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "S", selectedColor: "Blue" }, 1));
    expect(result.current.cart[0].price).toBe(599);
  });

  it("charges the base price on a quick-add with no selection, even though a variant override exists", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(productWithVariants, 1));
    expect(result.current.cart[0].price).toBe(599);
  });
});

describe("CartContext — quantity and totals", () => {
  it("updates quantity for the correct line via its composite id", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(product, 1));
    const lineId = getCartLineId(result.current.cart[0]);

    act(() => result.current.updateQty(lineId, 5));
    expect(result.current.cart[0].qty).toBe(5);
  });

  it("removes the item when quantity is updated to 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(product, 1));
    const lineId = getCartLineId(result.current.cart[0]);

    act(() => result.current.updateQty(lineId, 0));
    expect(result.current.cart).toHaveLength(0);
  });

  it("removes only the targeted line, leaving other variants of the same product intact", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "S" }, 1));
    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "M" }, 1));

    const sizeSLineId = getCartLineId(result.current.cart.find((i) => i.selectedSize === "S"));
    act(() => result.current.removeFromCart(sizeSLineId));

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].selectedSize).toBe("M");
  });

  it("computes cartCount and cartSubtotal correctly across multiple lines", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(product, 2)); // 199 x 2 = 398
    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "M", selectedColor: "Black" }, 1)); // 649 x 1

    expect(result.current.cartCount).toBe(3);
    expect(result.current.cartSubtotal).toBe(398 + 649);
  });
});

describe("CartContext — wishlist", () => {
  it("adds and removes a product from the wishlist via toggle", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.toggleWishlist(product));
    expect(result.current.isWishlisted("p1")).toBe(true);

    act(() => result.current.toggleWishlist(product));
    expect(result.current.isWishlisted("p1")).toBe(false);
  });
});

describe("CartContext — guest persistence", () => {
  it("persists the guest cart to localStorage", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(product, 1));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("rakhi_cart_guest"));
      expect(saved).toHaveLength(1);
      expect(saved[0]._id).toBe("p1");
    });
  });

  it("does not call the server sync endpoints while logged out", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addToCart(product, 1));

    await waitFor(() => expect(result.current.cart).toHaveLength(1));
    expect(mockSyncCart).not.toHaveBeenCalled();
  });
});

describe("CartContext — logged-in sync", () => {
  it("pushes the cart to the server (with size/color) once logged in", async () => {
    mockUser = { _id: "u1", name: "Test User" };
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addToCart({ ...productWithVariants, selectedSize: "M", selectedColor: "Black" }, 2));

    await waitFor(() => {
      expect(mockSyncCart).toHaveBeenCalledWith([
        { product: "p2", qty: 2, size: "M", color: "Black" },
      ]);
    });
  });
});
