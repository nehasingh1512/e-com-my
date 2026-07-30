import express from "express";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Address from "../../models/Address.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission, logActivity } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect, requirePermission("customers"));

// GET /api/admin/customers?search=&page=&limit=
router.get("/", async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = { role: "customer" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));

  const [customers, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({ customers, page: pageNum, pages: Math.ceil(total / limitNum) || 1, total });
});

// GET /api/admin/customers/:id
router.get("/:id", async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: "customer" }).select("-password");
  if (!customer) return res.status(404).json({ message: "Customer not found" });

  const [orders, addresses] = await Promise.all([
    Order.find({ user: customer._id }).sort({ createdAt: -1 }),
    Address.find({ user: customer._id }),
  ]);

  res.json({ customer, orders, addresses });
});

// PUT /api/admin/customers/:id
router.put("/:id", async (req, res) => {
  const { name, email, phone } = req.body;
  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: "customer" },
    { name, email, phone },
    { new: true, runValidators: true }
  ).select("-password");
  if (!customer) return res.status(404).json({ message: "Customer not found" });
  await logActivity(req, "customer.update", customer.email);
  res.json(customer);
});

// PATCH /api/admin/customers/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: "customer" });
  if (!customer) return res.status(404).json({ message: "Customer not found" });
  customer.isActive = !customer.isActive;
  await customer.save();
  await logActivity(req, "customer.toggle", `${customer.email} -> ${customer.isActive ? "active" : "disabled"}`);
  res.json(customer);
});

export default router;
