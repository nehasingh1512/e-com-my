import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminReply: { type: String, default: "" },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per customer per product — resubmitting updates their existing
// review (and re-queues it for moderation) instead of creating a duplicate.
reviewSchema.index({ product: 1, user: 1 }, { unique: true, partialFilterExpression: { user: { $type: "objectId" } } });

export default mongoose.model("Review", reviewSchema);
