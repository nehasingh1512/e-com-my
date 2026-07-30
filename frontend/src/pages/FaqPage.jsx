import React from "react";
import SupportPolicyPage from "./SupportPolicyPage.jsx";

export default function FaqPage() {
  return (
    <SupportPolicyPage
      title="FAQ"
      sections={[
        {
          title: "Which payment methods are available?",
          body: "You can choose Cash on Delivery, UPI, or Card. UPI and Card payments use Razorpay Checkout.",
        },
        {
          title: "What happens if payment succeeds but the page closes?",
          body: "Our backend verifies Razorpay payment details before confirming the order. If something interrupts the flow, please contact support with your payment reference.",
        },
        {
          title: "Can I use coupons with Razorpay payments?",
          body: "Yes. If a coupon is valid for your cart, it can be applied before you place the order and pay through Razorpay.",
        },
        {
          title: "How do I track my order?",
          body: "You can track your order from the Track Order page using your order ID and the email used at checkout.",
        },
      ]}
    />
  );
}
