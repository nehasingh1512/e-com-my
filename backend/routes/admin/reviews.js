import express from "express";
import Review from "../../models/Review.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission, logActivity } from "../../middleware/adminAuth.js";
import { recalculateProductRating } from "../../utils/reviewStats.js";

const router = express.Router();
router.use(protect, requirePermission("products"));

// GET /api/admin/reviews?status=pending|approved|rejected
router.get("/", async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const reviews = await Review.find(filter).populate("product", "name slug").sort({ createdAt: -1 });
  res.json(reviews);
});

router.patch("/:id/approve", async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
  if (!review) return res.status(404).json({ message: "Review not found" });
  await recalculateProductRating(review.product);
  await logActivity(req, "review.approve", String(review._id));
  res.json(review);
});

router.patch("/:id/reject", async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
  if (!review) return res.status(404).json({ message: "Review not found" });
  await recalculateProductRating(review.product);
  await logActivity(req, "review.reject", String(review._id));
  res.json(review);
});

router.post("/:id/reply", async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { adminReply: req.body.reply }, { new: true });
  if (!review) return res.status(404).json({ message: "Review not found" });
  await logActivity(req, "review.reply", String(review._id));
  res.json(review);
});

router.delete("/:id", async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });
  await recalculateProductRating(review.product);
  await logActivity(req, "review.delete", String(review._id));
  res.json({ message: "Review deleted" });
});

export default router;
