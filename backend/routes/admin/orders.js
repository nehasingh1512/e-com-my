import express from "express";
import Order from "../../models/Order.js";
import Notification from "../../models/Notification.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission, logActivity } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect, requirePermission("orders"));

// GET /api/admin/orders?status=&paymentStatus=&from=&to=&customer=&page=&limit=
router.get("/", async (req, res) => {
  const { status, paymentStatus, from, to, customer, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (customer) {
    filter.$or = [
      { guestEmail: { $regex: customer, $options: "i" } },
      { "shippingAddress.fullName": { $regex: customer, $options: "i" } },
    ];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));

  const [orders, total] = await Promise.all([
    Order.find(filter).populate("user", "name email").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, page: pageNum, pages: Math.ceil(total / limitNum) || 1, total });
});

// GET /api/admin/orders/:id
router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

// PATCH /api/admin/orders/:id/status  { status, note }
router.patch("/:id/status", async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = status;
  order.statusHistory.push({ status, note, changedAt: new Date() });
  if (status === "delivered") order.isPaid = order.paymentMethod === "cod" ? true : order.isPaid;
  await order.save();

  if (status === "cancelled") {
    await Notification.create({ type: "order_cancelled", message: `Order #${order._id.toString().slice(-8).toUpperCase()} was cancelled`, relatedId: order._id });
  }
  if (status === "returned") {
    await Notification.create({ type: "order_returned", message: `Order #${order._id.toString().slice(-8).toUpperCase()} was returned`, relatedId: order._id });
  }

  await logActivity(req, "order.status_update", `${order._id} -> ${status}`);
  // NOTE: email/SMS notification to the customer would be wired in here via a
  // transactional email/SMS provider (e.g. SendGrid, Twilio) — stubbed for now.
  res.json(order);
});

// PATCH /api/admin/orders/:id/tracking  { trackingNumber, courierName }
router.patch("/:id/tracking", async (req, res) => {
  const { trackingNumber, courierName } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { trackingNumber, courierName },
    { new: true }
  );
  if (!order) return res.status(404).json({ message: "Order not found" });
  await logActivity(req, "order.tracking_update", `${order._id}: ${courierName} / ${trackingNumber}`);
  res.json(order);
});

// PATCH /api/admin/orders/:id/refund  { amount, note }
router.patch("/:id/refund", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.paymentStatus = "refunded";
  order.status = "refunded";
  order.statusHistory.push({ status: "refunded", note: req.body.note || `Manually refunded ₹${req.body.amount ?? order.totalPrice}`, changedAt: new Date() });
  await order.save();

  await logActivity(req, "order.refund", `${order._id}`);
  res.json(order);
});

// POST /api/admin/orders/:id/accept  |  /reject
router.post("/:id/accept", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  order.status = "confirmed";
  order.statusHistory.push({ status: "confirmed", note: "Order accepted by admin", changedAt: new Date() });
  await order.save();
  await logActivity(req, "order.accept", `${order._id}`);
  res.json(order);
});

router.post("/:id/reject", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  order.status = "cancelled";
  order.statusHistory.push({ status: "cancelled", note: req.body.reason || "Order rejected by admin", changedAt: new Date() });
  await order.save();
  await logActivity(req, "order.reject", `${order._id}`);
  res.json(order);
});

export default router;
