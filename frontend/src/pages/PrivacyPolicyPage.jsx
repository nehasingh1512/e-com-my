import React from "react";
import SupportPolicyPage from "./SupportPolicyPage.jsx";

export default function PrivacyPolicyPage() {
  return (
    <SupportPolicyPage
      title="Privacy Policy"
      sections={[
        {
          title: "Information We Collect",
          body: "We collect the details needed to process your orders, manage your account, and respond to support requests. This may include contact, shipping, and payment-related information.",
        },
        {
          title: "How We Use It",
          body: "Your information is used only to operate the store, process orders, support payments, handle returns, and improve the shopping experience.",
        },
        {
          title: "Payment Data",
          body: "Card and UPI details are processed by Razorpay Checkout. We do not store raw card details on our server.",
        },
        {
          title: "Data Sharing",
          body: "We only share information with service providers that help us run the store, such as payment processing, delivery, and communication services.",
        },
      ]}
    />
  );
}
