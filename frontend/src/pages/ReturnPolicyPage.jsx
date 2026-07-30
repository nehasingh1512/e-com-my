import React from "react";
import SupportPolicyPage from "./SupportPolicyPage.jsx";

export default function ReturnPolicyPage() {
  return (
    <SupportPolicyPage
      title="Return Policy"
      sections={[
        {
          title: "When Returns Are Accepted",
          body: "We accept return requests for damaged, defective, wrong, or missing items reported within a reasonable time after delivery.",
        },
        {
          title: "How to Request a Return",
          body: "Please contact support with your order ID, photos of the issue, and a brief description. Our team will review the request and guide you through the next step.",
        },
        {
          title: "Refund Timing",
          body: "Approved refunds are processed to the original payment method or an alternate resolution depending on the case and payment channel.",
        },
        {
          title: "Payment Gateway Cases",
          body: "If a Razorpay payment succeeds but the order cannot be created, we review the payment reference and resolve it manually. Failed or reversed payments are not treated as successful orders.",
        },
      ]}
    />
  );
}
