import express from "express";
import crypto from "crypto";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import StockHistory from "../models/StockHistory.js";
import { protect, optionalAuth } from "../middleware/auth.js";
import { normalizeOrderItems } from "../utils/cart.js";
import { validateCoupon } from "../utils/coupon.js";
import { buildInvoiceHtml, buildInvoiceNumber } from "../utils/invoice.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

const DELIVERY_COST = { standard: 0, express: 79, sameday: 149 };
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

// POST /api/orders  (works for guest checkout or logged-in users)
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      deliveryMethod,
      paymentMethod,
      guestEmail,
      couponCode,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;
    const normalizedItems = normalizeOrderItems(items);

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }
    if (!req.user && !guestEmail) {
      return res.status(400).json({ message: "Guest checkout requires an email" });
    }
    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
      return res.status(400).json({ message: "Shipping address is incomplete" });
    }

    // Pre-check stock (product-level and, where a size was selected,
    // per-size) up front so we can fail fast with a clear message before
    // creating anything. The actual authority is the atomic decrement below —
    // this pass exists for a friendly error and to gather category IDs for
    // coupon matching in one query.
    const products = await Product.find({ _id: { $in: normalizedItems.map((i) => i.product) } }).select("name stock sizes category");
    const productById = new Map(products.map((p) => [String(p._id), p]));

    for (const item of normalizedItems) {
      const product = productById.get(String(item.product));
      if (!product) {
        return res.status(400).json({ message: `Product not found for item: ${item.name}` });
      }
      if (item.size) {
        const sizeEntry = product.sizes.find((s) => s.label === item.size);
        if (!sizeEntry || sizeEntry.stock < item.qty) {
          return res.status(400).json({
            message: `"${product.name}" (size ${item.size}) doesn't have enough stock. Available: ${sizeEntry?.stock ?? 0}, requested: ${item.qty}`,
          });
        }
      } else if (product.stock < item.qty) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}. Available: ${product.stock}, requested: ${item.qty}`,
        });
      }
    }

    const itemsPrice = normalizedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shippingPrice = DELIVERY_COST[deliveryMethod] ?? 0;

    const isRazorpayPayment = paymentMethod === "upi" || paymentMethod === "card";
    console.log(razorpayKeySecret, '----razorpayKeySecret');
    if (isRazorpayPayment) {
      if (!razorpayKeySecret) {
        return res.status(500).json({ message: "Razorpay is not configured" });
      }
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ message: "Missing Razorpay payment details" });
      }
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");
      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ message: "Invalid Razorpay signature" });
      }
    }

    // Coupon: re-validate server-side and atomically claim a usage slot
    // *before* creating the order, so a race against the usage limit can
    // never let two orders both "win" the last use.
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const productIds = normalizedItems.map((i) => i.product);
      const categoryIds = normalizedItems
        .map((i) => productById.get(String(i.product))?.category)
        .filter(Boolean);

      const { coupon, discountAmount: computedDiscount } = await validateCoupon(couponCode, {
        subtotal: itemsPrice,
        productIds,
        categoryIds,
      });

      const claimed = await Coupon.findOneAndUpdate(
        {
          _id: coupon._id,
          $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );
      if (!claimed) {
        return res.status(400).json({ message: "This coupon just reached its usage limit. Please remove it and try again." });
      }

      discountAmount = computedDiscount;
      appliedCoupon = claimed;
    }

    const totalPrice = Math.max(0, itemsPrice + shippingPrice - discountAmount);

    const order = await Order.create({
      user: req.user ? req.user._id : undefined,
      guestEmail: req.user ? undefined : guestEmail,
      items: normalizedItems,
      shippingAddress,
      deliveryMethod,
      paymentMethod,
      paymentStatus: isRazorpayPayment ? "paid" : "pending",
      isPaid: isRazorpayPayment,
      paidAt: isRazorpayPayment ? new Date() : undefined,
      razorpayOrderId: razorpayOrderId || "",
      razorpayPaymentId: razorpayPaymentId || "",
      razorpaySignature: razorpaySignature || "",
      invoiceNumber: "",
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountAmount,
      itemsPrice,
      shippingPrice,
      totalPrice,
    });

    order.invoiceNumber = buildInvoiceNumber(order);
    await order.save();

    // Atomically decrement stock (per-size where applicable), rolling back
    // every decrement already applied earlier in this same order — and the
    // coupon usage claim — if any single item fails partway through.
    const appliedDecrements = [];
    try {
      for (const item of normalizedItems) {
        if (item.size) {
          const updated = await Product.findOneAndUpdate(
            { _id: item.product, sizes: { $elemMatch: { label: item.size, stock: { $gte: item.qty } } } },
            { $inc: { "sizes.$.stock": -item.qty, stock: -item.qty } },
            { new: true }
          );
          if (!updated) throw new Error(`"${item.name}" (size ${item.size}) just sold out. Please remove it and try again.`);
          appliedDecrements.push({ product: item.product, size: item.size, qty: item.qty });

          const sizeEntry = updated.sizes.find((s) => s.label === item.size);
          await StockHistory.create({
            product: updated._id,
            change: -item.qty,
            reason: "order_placed",
            previousStock: (sizeEntry?.stock ?? 0) + item.qty,
            newStock: sizeEntry?.stock ?? 0,
          });
        } else {
          const updated = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.qty } },
            { $inc: { stock: -item.qty } },
            { new: true }
          );
          if (!updated) throw new Error(`"${item.name}" just sold out. Please remove it and try again.`);
          appliedDecrements.push({ product: item.product, size: "", qty: item.qty });

          await StockHistory.create({
            product: updated._id,
            change: -item.qty,
            reason: "order_placed",
            previousStock: updated.stock + item.qty,
            newStock: updated.stock,
          });
        }
      }
    } catch (stockErr) {
      for (const d of appliedDecrements) {
        if (d.size) {
          await Product.updateOne({ _id: d.product, "sizes.label": d.size }, { $inc: { "sizes.$.stock": d.qty, stock: d.qty } });
        } else {
          await Product.updateOne({ _id: d.product }, { $inc: { stock: d.qty } });
        }
      }
      if (appliedCoupon) {
        await Coupon.updateOne({ _id: appliedCoupon._id }, { $inc: { usedCount: -1 } });
      }
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({ message: stockErr.message });
    }

    const recipientEmail = req.user?.email || guestEmail;
    if (recipientEmail) {
      const invoiceHtml = buildInvoiceHtml(order);
      sendMail({
        to: recipientEmail,
        subject: `Your Rakhi invoice ${order.invoiceNumber}`,
        html: invoiceHtml,
      })
        .then(async () => {
          await Order.findByIdAndUpdate(order._id, { invoiceSentAt: new Date() });
        })
        .catch((mailErr) => {
          console.error("Invoice email failed:", mailErr.message);
        });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/orders/mine  (logged-in user's order history)
router.get("/mine", protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
router.get("/:id", optionalAuth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.user) {
    // Belongs to a registered account — must be logged in as that account.
    if (!req.user || String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
  } else {
    // Guest order — the order ID alone is not enough (it's unguessable but
    // could still leak via a shared link/browser history); also require the
    // email used at checkout, unless an admin is asking via the admin panel.
    const email = String(req.query.email || "").trim().toLowerCase();
    const isAdmin = req.user && ["super_admin", "admin", "store_manager", "order_manager"].includes(req.user.role);
    if (!isAdmin && email !== String(order.guestEmail || "").toLowerCase()) {
      return res.status(403).json({ message: "We couldn't verify this order. Please check the order ID and email." });
    }
  }

  res.json(order);
});

export default router;
