import express from "express";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { validateCoupon } from "../utils/coupon.js";

const router = express.Router();

// GET /api/coupons
// Public coupon listing for checkout help text. Returns currently active coupons
// that are within their date window and still usable.
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] },
        {
          $or: [
            { usageLimit: null },
            { usageLimit: { $exists: false } },
            { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
          ],
        },
      ],
    })
      .select("code type value minPurchase usageLimit usedCount startDate endDate")
      .sort({ createdAt: -1 });

    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/coupons/validate
// { code, items: [{ product, qty, price }] }  ->  { code, discountAmount, type, value }
// Public/read-only preview — does NOT consume the coupon's usage limit.
// The order-creation endpoint re-validates and actually claims usage atomically.
router.post("/validate", async (req, res) => {
  try {
    const { code, items = [] } = req.body;
    const subtotal = items.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || 0), 0);
    const productIds = items.map((i) => i.product).filter(Boolean);

    const products = await Product.find({ _id: { $in: productIds } }).select("category");
    const categoryIds = products.map((p) => p.category).filter(Boolean);

    const { coupon, discountAmount } = await validateCoupon(code, { subtotal, productIds, categoryIds });

    res.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
