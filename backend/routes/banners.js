import express from "express";
import Banner from "../models/Banner.js";

const router = express.Router();

// GET /api/banners?type=hero_slider|promo|homepage
// Public, read-only. Only returns active banners currently within their
// scheduled start/end window (if set).
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    const now = new Date();
    const filter = {
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] },
      ],
    };
    if (type) filter.type = type;

    const banners = await Banner.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
