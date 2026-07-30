import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getProductReviews, getMyReview, getMyOrders, submitReview } from "../api/api.js";

const StarInput = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)} className="text-gold">
        <Star size={22} fill={n <= value ? "currentColor" : "none"} />
      </button>
    ))}
  </div>
);

const statusNote = {
  pending: { icon: Clock, text: "Your review is awaiting moderation.", color: "text-amber-600" },
  rejected: { icon: Clock, text: "Your review wasn't approved for display. You can edit and resubmit it.", color: "text-red-500" },
  approved: { icon: CheckCircle2, text: "Your review is live.", color: "text-green-600" },
};

export default function ReviewsSection({ product }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [purchaseNote, setPurchaseNote] = useState("");
  const [reviewPromptOpen, setReviewPromptOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 0, comment: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

  const loadReviews = () => {
    getProductReviews(product.slug)
      .then((res) => setReviews(res.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
    if (user) {
      getMyOrders()
        .then((res) => {
          const orders = res.data || [];
          const now = Date.now();
          const eligibleOrder = orders.find((order) => {
            const orderAge = now - new Date(order.createdAt).getTime();
            if (orderAge > TWO_YEARS_MS) return false;
            return (order.items || []).some((item) => {
              if (!item) return false;
              if (item.product === product._id) return true;
              if (typeof item.product === "object" && item.product?._id === product._id) return true;
              if (item.productId === product._id) return true;
              return false;
            });
          });

          if (eligibleOrder) {
            setCanReview(true);
            setPurchaseNote("You purchased this product within the last 2 years, so you can leave a review.");
          } else {
            setCanReview(false);
            setPurchaseNote("Only customers who bought this product within the last 2 years can review it.");
          }
        })
        .catch(() => {
          setCanReview(false);
          setPurchaseNote("We couldn't verify your purchase history right now.");
        });

      getMyReview(product.slug)
        .then((res) => {
          setMyReview(res.data);
          if (res.data) setForm({ rating: res.data.rating, comment: res.data.comment || "" });
        })
        .catch(() => setMyReview(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.rating) {
      setError("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitReview({ productId: product._id, rating: form.rating, comment: form.comment });
      setMyReview(res.data);
      loadReviews(); // in case an edit dropped an approved review back out of the public list
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const StatusNote = myReview ? statusNote[myReview.status] : null;
  const approvedReviews = reviews;
  const reviewCount = approvedReviews.length;
  const averageRating =
    reviewCount > 0
      ? (approvedReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviewCount).toFixed(1)
      : "0.0";

  return (
    <div className="mt-16">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="font-display text-2xl text-maroon">Reviews</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Star size={14} className="fill-gold text-gold" />
            {averageRating}
          </span>
          <span>•</span>
          <span>{reviewCount} rating{reviewCount === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-8">
        {/* Write / edit review */}
        <div className="bg-white rounded-2xl shadow-sm p-5 h-fit">
          <h3 className="font-semibold text-sm mb-3">
            {myReview ? "Edit Your Review" : "Write a Review"}
          </h3>

          {!reviewPromptOpen ? (
            <button
              type="button"
              onClick={() => setReviewPromptOpen(true)}
              className="w-full bg-rakhired text-white py-2 rounded-full text-sm hover:bg-maroon transition-colors"
            >
              Write a Review
            </button>
          ) : !user ? (
            <p className="text-sm text-gray-500">
              <Link to="/login" state={{ from: `/product/${product.slug}` }} className="text-rakhired font-medium">
                Log in
              </Link>{" "}
              to write a review.
            </p>
          ) : !canReview && !myReview ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">{purchaseNote}</p>
              <button
                type="button"
                onClick={() => setReviewPromptOpen(false)}
                className="text-sm text-rakhired font-medium"
              >
                Back
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <p className="text-xs text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
              {StatusNote && (
                <p className={`text-xs flex items-center gap-1 ${StatusNote.color}`}>
                  <StatusNote.icon size={13} /> {statusNote[myReview.status].text}
                </p>
              )}
              <StarInput value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
              <textarea
                placeholder="Share your experience with this product..."
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                rows={4}
                maxLength={1000}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired"
              />
              <button
                type="submit"
                disabled={submitting || (!canReview && !myReview)}
                className="w-full bg-rakhired text-white py-2 rounded-full text-sm hover:bg-maroon transition-colors disabled:opacity-60"
              >
                {submitting ? "Submitting..." : myReview ? "Update Review" : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        {/* Existing reviews */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-gray-400">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet — be the first to share your thoughts.</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-medium text-sm">{r.name}</p>
                    <div className="flex items-center gap-1 text-gold text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  {r.verifiedPurchase && (
                    <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle2 size={11} /> Verified Purchase
                    </span>
                  )}
                </div>
                {r.comment && <p className="text-sm text-gray-600 mt-2">{r.comment}</p>}
                <p className="text-[11px] text-gray-400 mt-2">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                {r.adminReply && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mt-3 flex gap-2">
                    <MessageSquare size={13} className="shrink-0 mt-0.5 text-rakhired" />
                    <span><span className="font-medium">Store reply:</span> {r.adminReply}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
