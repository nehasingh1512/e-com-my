import Coupon from "../models/Coupon.js";

// Server-side coupon validation — never trust a discount amount computed on
// the client. `productIds`/`categoryIds` are the items actually in the cart,
// used to enforce category/product-restricted coupons.
export const validateCoupon = async (code, { subtotal, productIds = [], categoryIds = [] }) => {
  if (!code) throw new Error("Enter a coupon code");

  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim(), isActive: true });
  if (!coupon) throw new Error("Invalid or inactive coupon code");

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) throw new Error("This coupon isn't active yet");
  if (coupon.endDate && now > coupon.endDate) throw new Error("This coupon has expired");
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("This coupon has reached its usage limit");
  }
  if (subtotal < (coupon.minPurchase || 0)) {
    throw new Error(`This coupon requires a minimum purchase of ₹${coupon.minPurchase}`);
  }

  if (coupon.products?.length > 0) {
    const applies = productIds.some((id) => coupon.products.some((p) => String(p) === String(id)));
    if (!applies) throw new Error("This coupon doesn't apply to any items in your cart");
  } else if (coupon.categories?.length > 0) {
    const applies = categoryIds.some((id) => coupon.categories.some((c) => String(c) === String(id)));
    if (!applies) throw new Error("This coupon doesn't apply to any items in your cart");
  }

  const rawDiscount =
    coupon.type === "percentage" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  const discountAmount = Math.max(0, Math.min(rawDiscount, subtotal));

  return { coupon, discountAmount };
};
