import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { normalizeOrderItems } from "../utils/cart.js";
import { validateCoupon } from "../utils/coupon.js";

const router = express.Router();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
const razorpay = razorpayKeyId && razorpayKeySecret
  ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
  : null;

const DELIVERY_COST = { standard: 0, express: 79, sameday: 149 };

router.post("/razorpay/order", async (req, res) => {
  try {
    console.log(process.env, ' ============== razorpay');
    if (!razorpay) return res.status(500).json({ message: "Razorpay is not configured" });
    const { items, deliveryMethod, couponCode } = req.body;
    const normalizedItems = normalizeOrderItems(items);
    if (normalizedItems.length === 0) return res.status(400).json({ message: "No order items" });

    const products = await Product.find({ _id: { $in: normalizedItems.map((i) => i.product) } }).select("category");
    const productById = new Map(products.map((p) => [String(p._id), p]));
    const itemsPrice = normalizedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shippingPrice = DELIVERY_COST[deliveryMethod] ?? 0;

    let discountAmount = 0;
    if (couponCode) {
      const productIds = normalizedItems.map((i) => i.product);
      const categoryIds = normalizedItems.map((i) => productById.get(String(i.product))?.category).filter(Boolean);
      const result = await validateCoupon(couponCode, { subtotal: itemsPrice, productIds, categoryIds });
      discountAmount = result.discountAmount;
    }

    const totalPrice = Math.max(0, itemsPrice + shippingPrice - discountAmount);
    const amount = Math.round(totalPrice * 100);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rakhi_${Date.now()}`,
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/razorpay/verify", async (req, res) => {
  try {
    if (!razorpayKeySecret) return res.status(500).json({ message: "Razorpay is not configured" });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const digest = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
