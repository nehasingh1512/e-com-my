import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    type: { type: String, enum: ["hero_slider", "promo", "homepage"], default: "promo" },
    desktopImage: { type: String, default: "" },
    mobileImage: { type: String, default: "" },
    linkUrl: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
