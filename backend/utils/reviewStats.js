import Review from "../models/Review.js";
import Product from "../models/Product.js";

// Recomputes a product's rating/reviewCount from its APPROVED reviews only,
// and persists it. Call this any time a review's status changes (approve,
// reject, delete) — otherwise Product.rating/reviewCount silently drift from
// what customers actually submitted and admins actually approved.
export const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: "approved" } },
    { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const { avgRating = 0, count = 0 } = stats[0] || {};

  await Product.findByIdAndUpdate(productId, {
    rating: count > 0 ? Math.round(avgRating * 10) / 10 : 0,
    reviewCount: count,
  });
};
