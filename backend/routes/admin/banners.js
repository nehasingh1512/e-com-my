import express from "express";
import Banner from "../../models/Banner.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission, logActivity } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect, requirePermission("settings"));

router.get("/", async (req, res) => {
  const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
  res.json(banners);
});

router.post("/", async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    await logActivity(req, "banner.create", banner.title);
    res.status(201).json(banner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    await logActivity(req, "banner.update", banner.title);
    res.json(banner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id/toggle", async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  banner.isActive = !banner.isActive;
  await banner.save();
  res.json(banner);
});

router.delete("/:id", async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  await logActivity(req, "banner.delete", banner.title);
  res.json({ message: "Banner deleted" });
});

export default router;
