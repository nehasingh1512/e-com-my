import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";
import { recalculateProductRating } from "../utils/reviewStats.js";

const router = express.Router();

// GET /api/reviews?product=<slug>
// Public — only approved reviews are ever exposed here.
router.get("/", async (req, res) => {
  try {
    const { product: slug } = req.query;
    if (!slug) return res.status(400).json({ message: "product slug is required" });

    const product = await Product.findOne({ slug }).select("_id");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const reviews = await Review.find({ product: product._id, status: "approved" })
      .select("name rating comment verifiedPurchase adminReply createdAt")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/mine?product=<slug>  (logged-in customers only)
// Lets the product page show "edit your review" / "awaiting moderation"
// instead of a blank submission form if they've already reviewed this item.
router.get("/mine", protect, async (req, res) => {
  try {
    const { product: slug } = req.query;
    if (!slug) return res.status(400).json({ message: "product slug is required" });

    const product = await Product.findOne({ slug }).select("_id");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const review = await Review.findOne({ product: product._id, user: req.user._id });
    res.json(review || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reviews  { productId, rating, comment }  (logged-in customers only)
// Creates or updates the caller's own review for this product — one review
// per customer per product. Resubmitting always re-queues it for moderation,
// even if the previous version was already approved, so an edited review
// can't silently bypass review.
router.post("/", protect, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "A valid productId is required" });
    }
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(productId).select("_id");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const verifiedPurchase = await Order.exists({
      user: req.user._id,
      "items.product": product._id,
    }).then(Boolean);

    const review = await Review.findOneAndUpdate(
      { product: product._id, user: req.user._id },
      {
        product: product._id,
        user: req.user._id,
        name: req.user.name,
        rating: ratingNum,
        comment: String(comment || "").trim().slice(0, 1000),
        status: "pending", // always re-moderated, even on edit
        adminReply: "", // stale replies don't carry over to edited content
        verifiedPurchase,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Handles the edge case of editing a previously-approved review back to
    // pending — it needs to drop out of the public rating average immediately,
    // not linger until an admin happens to look at it.
    await recalculateProductRating(product._id);

    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
