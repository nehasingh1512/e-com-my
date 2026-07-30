import React from "react";

export const ORDER_STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  shipped: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

// Shared order-detail layout — used by both the logged-in OrderDetailPage and
// the guest TrackOrderPage, so the two never quietly drift out of sync.
export default function OrderSummaryDetail({ order }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h2 className="font-display text-2xl text-maroon">Order #{order._id.slice(-8).toUpperCase()}</h2>
          <p className="text-sm text-gray-500">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full capitalize ${ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      {(order.trackingNumber || order.courierName) && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="font-semibold mb-2 text-sm">Tracking</h3>
          {order.courierName && <p className="text-sm text-gray-600">Courier: {order.courierName}</p>}
          {order.trackingNumber && <p className="text-sm text-gray-600">Tracking Number: {order.trackingNumber}</p>}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="font-semibold mb-3 text-sm">Items</h3>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#f3e3cd] to-[#efd9c4] flex items-center justify-center text-2xl shrink-0">
                {item.emoji || "🪢"}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{item.name}</p>
                {(item.size || item.color) && (
                  <p className="text-gray-400 text-xs">{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                )}
                <p className="text-gray-500">Qty: {item.qty} × ₹{item.price}</p>
              </div>
              <p className="font-semibold text-sm">₹{item.price * item.qty}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-2 text-sm">Shipping Address</h3>
          <p className="text-sm text-gray-600">{order.shippingAddress?.fullName}</p>
          <p className="text-sm text-gray-600">
            {order.shippingAddress?.line1}{order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ""}
          </p>
          <p className="text-sm text-gray-600">
            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
          </p>
          <p className="text-sm text-gray-600">{order.shippingAddress?.phone}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-2 text-sm">Delivery & Payment</h3>
          <p className="text-sm text-gray-600 capitalize">Delivery: {order.deliveryMethod}</p>
          <p className="text-sm text-gray-600 uppercase">Payment: {order.paymentMethod}</p>
          <p className="text-sm text-gray-600">{order.isPaid ? "Paid" : "Payment pending"}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Items Total</span>
          <span>₹{order.itemsPrice}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600 mb-2">
            <span>Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span>
            <span>− ₹{order.discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Shipping</span>
          <span>{order.shippingPrice === 0 ? "Free" : `₹${order.shippingPrice}`}</span>
        </div>
        <div className="flex justify-between font-semibold text-maroon border-t border-gray-100 pt-3">
          <span>Total</span>
          <span>₹{order.totalPrice}</span>
        </div>
      </div>
    </div>
  );
}
