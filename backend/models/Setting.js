import mongoose from "mongoose";

// Single-document store for site-wide settings (store info, policies, socials, etc).
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "site_settings" },
    storeName: { type: String, default: "Rakhi - Thread of Love" },
    storeEmail: { type: String, default: "support@rakhi.com" },
    storePhone: { type: String, default: "+91 98765 43210" },
    address: { type: String, default: "123, Love Street, Jaipur, Rajasthan - 302001, India" },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      pinterest: { type: String, default: "" },
    },
    footerText: { type: String, default: "" },
    termsAndConditions: { type: String, default: "" },
    privacyPolicy: { type: String, default: "" },
    shippingPolicy: { type: String, default: "" },
    returnPolicy: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
