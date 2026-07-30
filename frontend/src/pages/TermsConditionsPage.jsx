import React from "react";
import SupportPolicyPage from "./SupportPolicyPage.jsx";

export default function TermsConditionsPage() {
  return (
    <SupportPolicyPage
      title="Terms & Conditions"
      sections={[
        {
          title: "General Use",
          body: "By using this website, you agree to use it only for lawful shopping and support-related purposes.",
        },
        {
          title: "Orders and Availability",
          body: "Orders are subject to product availability, pricing validation, and successful payment or COD confirmation.",
        },
        {
          title: "Payments",
          body: "For online payments, we use Razorpay Checkout. The final order is created only after the payment is verified on the server.",
        },
        {
          title: "Limitation of Liability",
          body: "We aim to keep the website accurate and available, but we cannot guarantee uninterrupted service or absolute error-free content.",
        },
      ]}
    />
  );
}
