import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer, Truck, RotateCcw, Check, X } from "lucide-react";
import Badge from "../components/Badge.jsx";
import {
  getAdminOrder,
  updateOrderStatus,
  updateOrderTracking,
  refundOrder,
  acceptOrder,
  rejectOrder,
} from "../api/adminApi.js";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
];
const STATUS_COLORS = {
  pending: "amber",
  confirmed: "blue",
  processing: "blue",
  packed: "purple",
  shipped: "purple",
  out_for_delivery: "purple",
  delivered: "green",
  cancelled: "red",
  returned: "red",
  refunded: "gray",
};

const invoiceNo = (order) =>
  order.invoiceNumber || `INV-${String(order._id).slice(-8).toUpperCase()}`;

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: "", note: "" });
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: "",
    courierName: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const load = () => {
    setError("");
    getAdminOrder(id)
      .then((res) => {
        setOrder(res.data);
        setStatusForm({ status: res.data.status, note: "" });
        setTrackingForm({
          trackingNumber: res.data.trackingNumber || "",
          courierName: res.data.courierName || "",
        });
      })
      .catch(() => setError("Could not load order."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading)
    return <p className="text-gray-500">{error || "Loading order..."}</p>;
  if (!order) return <p className="text-gray-500">Order not found.</p>;

  const handleStatusUpdate = async () => {
    if (!statusForm.status) {
      setActionError("Select a status before updating.");
      return;
    }
    setActionError("");
    setActionLoading("status");
    try {
      await updateOrderStatus(id, statusForm);
      load();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Could not update order status.",
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleTrackingUpdate = async () => {
    if (
      !trackingForm.trackingNumber.trim() &&
      !trackingForm.courierName.trim()
    ) {
      setActionError(
        "Add a courier name or tracking number before saving tracking.",
      );
      return;
    }
    setActionError("");
    setActionLoading("tracking");
    try {
      await updateOrderTracking(id, trackingForm);
      load();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Could not update tracking.",
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleRefund = async () => {
    if (
      !confirm(
        `Refund order #${id.slice(-8).toUpperCase()} for ₹${order.totalPrice}?`,
      )
    )
      return;
    setActionError("");
    setActionLoading("refund");
    try {
      await refundOrder(id, { amount: order.totalPrice });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || "Could not refund order.");
    } finally {
      setActionLoading("");
    }
  };

  const runPendingAction = async (kind, fn, failMessage) => {
    setActionError("");
    setActionLoading(kind);
    try {
      await fn();
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || failMessage);
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="max-w-4xl">
      <Link
        to="/admin/orders"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-rakhired mb-4"
      >
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="font-display text-2xl text-maroon">
            Order #{order._id.slice(-8).toUpperCase()}
          </h2>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={STATUS_COLORS[order.status]}>
            {order.status.replace(/_/g, " ")}
          </Badge>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 text-sm border border-gray-300 rounded-full px-3 py-1.5 hover:bg-gray-50"
          >
            <Printer size={14} /> Print Invoice
          </button>
        </div>
      </div>

      {order.status === "pending" && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() =>
              runPendingAction(
                "accept",
                () => acceptOrder(id),
                "Could not accept order.",
              )
            }
            className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-full text-sm hover:bg-green-700 disabled:opacity-60"
            disabled={actionLoading === "accept"}
          >
            <Check size={14} />{" "}
            {actionLoading === "accept" ? "Accepting..." : "Accept Order"}
          </button>
          <button
            onClick={() =>
              runPendingAction(
                "reject",
                () => rejectOrder(id, { reason: "Rejected by admin" }),
                "Could not reject order.",
              )
            }
            className="flex items-center gap-1 bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 disabled:opacity-60"
            disabled={actionLoading === "reject"}
          >
            <X size={14} />{" "}
            {actionLoading === "reject" ? "Rejecting..." : "Reject Order"}
          </button>
        </div>
      )}

      {actionError && (
        <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2 mb-4">
          {actionError}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-2 text-sm">Customer</h3>
          <p className="text-sm text-gray-600">
            {order.user?.name || order.guestEmail || "Guest"}
          </p>
          {order.user?.email && (
            <p className="text-sm text-gray-500">{order.user.email}</p>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-2 text-sm">Shipping Address</h3>
          <p className="text-sm text-gray-600">
            {order.shippingAddress?.fullName}
          </p>
          <p className="text-sm text-gray-600">
            {order.shippingAddress?.line1}, {order.shippingAddress?.city},{" "}
            {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
          </p>
          <p className="text-sm text-gray-600">
            {order.shippingAddress?.phone}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="font-semibold mb-3 text-sm">Items</h3>
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>
                {item.emoji} {item.name}
                {(item.size || item.color) && (
                  <span className="text-gray-400"> ({[item.size, item.color].filter(Boolean).join(", ")})</span>
                )}
                {" "}× {item.qty}
              </span>
              <span className="font-medium">₹{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-semibold text-maroon text-sm">
          <span>Total</span>
          <span>₹{order.totalPrice}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-3 text-sm">Update Order Status</h3>
          <select
            value={statusForm.status}
            onChange={(e) =>
              setStatusForm({ ...statusForm, status: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            placeholder="Note (optional)"
            value={statusForm.note}
            onChange={(e) =>
              setStatusForm({ ...statusForm, note: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
          />
          <button
            onClick={handleStatusUpdate}
            disabled={actionLoading === "status"}
            className="w-full bg-rakhired text-white py-2 rounded-full text-sm hover:bg-maroon disabled:opacity-60"
          >
            {actionLoading === "status" ? "Updating..." : "Update Status"}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-3 text-sm flex items-center gap-1">
            <Truck size={14} /> Tracking & Courier
          </h3>
          <input
            placeholder="Courier Name"
            value={trackingForm.courierName}
            onChange={(e) =>
              setTrackingForm({ ...trackingForm, courierName: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
          />
          <input
            placeholder="Tracking Number"
            value={trackingForm.trackingNumber}
            onChange={(e) =>
              setTrackingForm({
                ...trackingForm,
                trackingNumber: e.target.value,
              })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleTrackingUpdate}
              disabled={actionLoading === "tracking"}
              className="flex-1 bg-gray-800 text-white py-2 rounded-full text-sm hover:bg-gray-900 disabled:opacity-60"
            >
              {actionLoading === "tracking" ? "Saving..." : "Save Tracking"}
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 border border-gray-300 rounded-full text-sm hover:bg-gray-50"
            >
              Print Label
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold text-sm">Invoice</h3>
            <p className="text-sm text-gray-500 mt-1">
              {invoiceNo(order)}
              {order.invoiceSentAt
                ? ` · emailed ${new Date(order.invoiceSentAt).toLocaleString("en-IN")}`
                : " · not emailed yet"}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 text-sm border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50"
          >
            <Printer size={14} /> Print Invoice
          </button>
        </div>

        <div className="mt-4 border border-gray-100 rounded-2xl p-5 bg-gray-50 print:border-0 print:bg-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Rakhi - Thread of Love
              </p>
              <h4 className="text-xl font-semibold text-maroon mt-1">
                {invoiceNo(order)}
              </h4>
              <p className="text-sm text-gray-500">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>{new Date(order.createdAt).toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400 mt-1">
                Payment: {order.paymentMethod?.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-xs uppercase text-gray-500 mb-2">Bill To</p>
              <p className="font-medium">
                {order.user?.name || order.guestEmail || "Guest"}
              </p>
              <p className="text-sm text-gray-600">
                {order.shippingAddress?.fullName}
              </p>
              <p className="text-sm text-gray-600">
                {order.shippingAddress?.line1}
                {order.shippingAddress?.line2
                  ? `, ${order.shippingAddress.line2}`
                  : ""}
              </p>
              <p className="text-sm text-gray-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                {order.shippingAddress?.pincode}
              </p>
              <p className="text-sm text-gray-600">
                {order.shippingAddress?.phone}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 mb-2">
                Invoice Status
              </p>
              <p className="text-sm text-gray-600">
                Order status: {order.status.replace(/_/g, " ")}
              </p>
              <p className="text-sm text-gray-600">
                Invoice sent:{" "}
                {order.invoiceSentAt
                  ? new Date(order.invoiceSentAt).toLocaleString("en-IN")
                  : "Pending"}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="py-3 pr-3">
                      {item.name}
                      {(item.size || item.color) && (
                        <div className="text-xs text-gray-400">{[item.size, item.color].filter(Boolean).join(", ")}</div>
                      )}
                    </td>
                    <td className="py-3 text-center">{item.qty}</td>
                    <td className="py-3 text-right">₹{item.price}</td>
                    <td className="py-3 text-right">
                      ₹{item.price * item.qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span>₹{order.itemsPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₹{order.shippingPrice}</span>
            </div>
            <div className="flex justify-between font-semibold text-maroon border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>₹{order.totalPrice}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="font-semibold mb-3 text-sm">Status History</h3>
        {order.statusHistory?.length === 0 ? (
          <p className="text-xs text-gray-400">No history yet.</p>
        ) : (
          <div className="space-y-2">
            {[...(order.statusHistory || [])].reverse().map((h, i) => (
              <div
                key={i}
                className="flex justify-between text-xs text-gray-500 border-b border-gray-50 pb-2 last:border-0"
              >
                <span className="capitalize">
                  {h.status.replace(/_/g, " ")} {h.note ? `— ${h.note}` : ""}
                </span>
                <span>{new Date(h.changedAt).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
