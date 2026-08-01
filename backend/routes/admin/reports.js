import express from "express";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import User from "../../models/User.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/adminAuth.js";
import { toCSV } from "../../utils/csv.js";

const router = express.Router();
router.use(protect, requirePermission("reports"));

// GET /api/admin/reports/sales?from=&to=&format=json|csv
router.get("/sales", async (req, res) => {
  const { from, to, format = "json" } = req.query;
  const filter = { status: { $ne: "cancelled" } };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  const rows = orders.map((o) => ({
    orderId: o._id.toString(),
    date: o.createdAt.toISOString().slice(0, 10),
    status: o.status,
    paymentStatus: o.paymentStatus,
    items: o.items.length,
    itemsPrice: o.itemsPrice,
    shippingPrice: o.shippingPrice,
    totalPrice: o.totalPrice,
  }));

  if (format === "csv") {
    res.header("Content-Type", "text/csv");
    res.attachment("sales-report.csv");
    return res.send(toCSV(rows));
  }

  const totalRevenue = rows.reduce((s, r) => s + r.totalPrice, 0);
  res.json({ rows, totalRevenue, totalOrders: rows.length });
});

// GET /api/admin/reports/best-sellers
router.get("/best-sellers", async (req, res) => {
  const { format = "json" } = req.query;
  const products = await Product.find().sort({ reviewCount: -1, rating: -1 }).limit(50).select("name sku price stock reviewCount rating");
  const rows = products.map((p) => ({
    name: p.name,
    sku: p.sku,
    price: p.price,
    stock: p.stock,
    reviews: p.reviewCount,
    rating: p.rating,
  }));

  if (format === "csv") {
    res.header("Content-Type", "text/csv");
    res.attachment("best-sellers.csv");
    return res.send(toCSV(rows));
  }
  res.json(rows);
});

// GET /api/admin/reports/inventory
router.get("/inventory", async (req, res) => {
  const { format = "json" } = req.query;
  const products = await Product.find().select("name sku stock lowStockThreshold price").sort({ stock: 1 });
  const rows = products.map((p) => ({
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    status: p.stock <= 0 ? "out_of_stock" : p.stock <= p.lowStockThreshold ? "low_stock" : "in_stock",
    price: p.price,
  }));

  if (format === "csv") {
    res.header("Content-Type", "text/csv");
    res.attachment("inventory-report.csv");
    return res.send(toCSV(rows));
  }
  res.json(rows);
});

// GET /api/admin/reports/customers
router.get("/customers", async (req, res) => {
  const { format = "json" } = req.query;
  const customers = await User.find({ role: "customer" }).select("name email phone createdAt isActive");
  const rows = customers.map((c) => ({
    name: c.name,
    email: c.email,
    phone: c.phone || "",
    joined: c.createdAt.toISOString().slice(0, 10),
    status: c.isActive ? "active" : "disabled",
  }));

  if (format === "csv") {
    res.header("Content-Type", "text/csv");
    res.attachment("customers-report.csv");
    return res.send(toCSV(rows));
  }
  res.json(rows);
});

export default router;
