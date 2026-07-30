import React, { useEffect, useState } from "react";
import { Star, Check, X, Trash2, MessageSquare } from "lucide-react";
import Badge from "../components/Badge.jsx";
import { getAdminReviews, approveReview, rejectReview, replyReview, deleteReview } from "../api/adminApi.js";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [error, setError] = useState("");

  const load = () => getAdminReviews(filter ? { status: filter } : {}).then((res) => setReviews(res.data || [])).catch(() => setError("Could not load reviews."));
  useEffect(() => { load(); }, [filter]);

  const statusColor = { pending: "amber", approved: "green", rejected: "red" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-maroon">Reviews</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-300 rounded-full px-4 py-2 text-sm">
          <option value="">All Reviews</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-4">
        {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews found.</p>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{r.name} <span className="text-gray-400 font-normal">on {r.product?.name}</span></p>
                  <div className="flex items-center gap-1 text-gold text-xs">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"} />)}
                  </div>
                </div>
                <Badge color={statusColor[r.status]}>{r.status}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{r.comment}</p>

              {r.adminReply && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-3">
                  <span className="font-medium">Store reply:</span> {r.adminReply}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                {r.status !== "approved" && (
                  <button onClick={async () => { await approveReview(r._id); load(); }} className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                    <Check size={13} /> Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button onClick={async () => { await rejectReview(r._id); load(); }} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                    <X size={13} /> Reject
                  </button>
                )}
                <button onClick={async () => { if (confirm("Delete this review?")) { await deleteReview(r._id); load(); } }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-rakhired">
                  <Trash2 size={13} /> Delete
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <input
                  placeholder="Write a reply..."
                  value={replyDrafts[r._id] ?? r.adminReply ?? ""}
                  onChange={(e) => setReplyDrafts({ ...replyDrafts, [r._id]: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={async () => { await replyReview(r._id, { reply: replyDrafts[r._id] ?? "" }); load(); }}
                  className="flex items-center gap-1 text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg"
                >
                  <MessageSquare size={12} /> Reply
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
