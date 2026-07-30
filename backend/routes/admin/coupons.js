import express from "express";
import Coupon from "../../models/Coupon.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission, logActivity } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect, requirePermission("products"));

router.get("/", async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

router.post("/", async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code?.toUpperCase() });
    await logActivity(req, "coupon.create", coupon.code);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    await logActivity(req, "coupon.update", coupon.code);
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id/toggle", async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ message: "Coupon not found" });
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json(coupon);
});

router.delete("/:id", async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ message: "Coupon not found" });
  await logActivity(req, "coupon.delete", coupon.code);
  res.json({ message: "Coupon deleted" });
});

export default router;
