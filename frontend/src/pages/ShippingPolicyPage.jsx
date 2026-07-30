import React from "react";
import SupportPolicyPage from "./SupportPolicyPage.jsx";

export default function ShippingPolicyPage() {
  return (
    <SupportPolicyPage
      title="Shipping Policy"
      sections={[
        {
          title: "Order Processing",
          body: "Orders are processed after payment confirmation. Most orders are packed within 1-2 business days, subject to product availability and verification checks.",
        },
        {
          title: "Delivery Timelines",
          body: "Standard delivery generally takes 5-7 business days. Express and same-day options may be available for selected locations during checkout.",
        },
        {
          title: "Tracking Updates",
          body: "Once your order is handed to the courier, tracking details are shared where available so you can monitor delivery progress.",
        },
        {
          title: "Razorpay Checkout Note",
          body: "For card and UPI payments, payment is captured through Razorpay Checkout before the order is confirmed in our system. This helps us verify successful payment before dispatch.",
        },
      ]}
    />
  );
}
