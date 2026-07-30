import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Banner from "../models/Banner.js";
import Review from "../models/Review.js";

dotenv.config();

// Small inline SVG placeholders (no external image hosting needed) — swap
// these out for real uploads via Admin → Banners whenever you're ready.
const heroSvg = (bg, text) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" font-family="Georgia,serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.85">${text}</text></svg>`
  )}`;

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected. Seeding extra data (coupons, banners, reviews, sample variants)...");

    const jewellery = await Category.findOne({ slug: "jewellery" });
    const rakhi = await Category.findOne({ slug: "rakhi" });

    if (!jewellery || !rakhi) {
      console.log(
        "⚠️  Couldn't find the expected categories (run `npm run seed` first to load the base catalog). Skipping category-restricted coupons that depend on them, continuing with the rest."
      );
    }

    // ---- Coupons ----
    await Coupon.deleteMany();
    const now = Date.now();
    const coupons = [
      { code: "WELCOME10", type: "percentage", value: 10, minPurchase: 0 },
      { code: "FLAT100", type: "fixed", value: 100, minPurchase: 499 },
      jewellery && {
        code: "JEWELS15",
        type: "percentage",
        value: 15,
        minPurchase: 300,
        categories: [jewellery._id],
      },
      rakhi && {
        code: "RAKHI2026",
        type: "fixed",
        value: 50,
        minPurchase: 199,
        categories: [rakhi._id],
        usageLimit: 200,
        usedCount: 34,
      },
      {
        code: "VIP500",
        type: "fixed",
        value: 500,
        minPurchase: 2999,
        usageLimit: 20,
        usedCount: 20, // maxed out — demonstrates the "usage limit reached" rejection
      },
      {
        code: "EXPIRED10",
        type: "percentage",
        value: 10,
        endDate: new Date(now - 7 * 86400000), // 7 days ago — demonstrates expiry rejection
      },
      {
        code: "COMINGSOON25",
        type: "percentage",
        value: 25,
        startDate: new Date(now + 7 * 86400000), // starts in 7 days — demonstrates "not active yet"
        isActive: true,
      },
    ].filter(Boolean);
    await Coupon.insertMany(coupons);

    // ---- Banners ----
    await Banner.deleteMany();
    await Banner.insertMany([
      {
        title: "Happy Raksha Bandhan",
        subtitle: "Flat 20% off on Designer Rakhis, this week only.",
        type: "hero_slider",
        desktopImage: heroSvg("%237A1128", "Raksha Bandhan Sale"),
        mobileImage: heroSvg("%237A1128", "Raksha Bandhan Sale"),
        linkUrl: "/shop?category=rakhi",
        displayOrder: 0,
      },
      {
        title: "Shine Bright This Season",
        subtitle: "New arrivals in Earrings, Necklaces & more.",
        type: "hero_slider",
        desktopImage: heroSvg("%23C41230", "Jewellery Collection"),
        mobileImage: heroSvg("%23C41230", "Jewellery Collection"),
        linkUrl: "/shop?category=jewellery",
        displayOrder: 1,
      },
      {
        title: "Festive Kids Wear",
        subtitle: "Adorable outfits for the little ones.",
        type: "promo",
        desktopImage: heroSvg("%23D9A441", "Kids Wear"),
        linkUrl: "/shop?category=kids-wear",
        displayOrder: 0,
      },
      {
        title: "Ladies Wear Edit",
        subtitle: "Sarees, kurtis & dresses for every occasion.",
        type: "promo",
        desktopImage: heroSvg("%235C0D1E", "Ladies Wear"),
        linkUrl: "/shop?category=ladies-wear",
        displayOrder: 1,
      },
    ]);

    // ---- Reviews (attached to a few existing products, if present) ----
    await Review.deleteMany();
    const reviewTargets = await Product.find({
      slug: { $in: ["elegant-pearl-rakhi", "silver-om-rakhi", "printed-cotton-kurti", "kundan-drop-earrings"] },
    });
    const bySlug = Object.fromEntries(reviewTargets.map((p) => [p.slug, p]));

    const reviewSeed = [
      bySlug["elegant-pearl-rakhi"] && {
        product: bySlug["elegant-pearl-rakhi"]._id,
        name: "Priya S.",
        rating: 5,
        comment: "Beautifully made, my brother loved it! Packaging was lovely too.",
        status: "approved",
        adminReply: "Thank you so much, Priya! Wishing your family a happy Raksha Bandhan 🎉",
      },
      bySlug["silver-om-rakhi"] && {
        product: bySlug["silver-om-rakhi"]._id,
        name: "Anjali M.",
        rating: 4,
        comment: "Good quality silver, slightly smaller than I expected but still lovely.",
        status: "approved",
      },
      bySlug["printed-cotton-kurti"] && {
        product: bySlug["printed-cotton-kurti"]._id,
        name: "Ritu K.",
        rating: 3,
        comment: "Fabric is nice, waiting to see how it holds up after a few washes.",
        status: "pending",
      },
      bySlug["kundan-drop-earrings"] && {
        product: bySlug["kundan-drop-earrings"]._id,
        name: "spammyuser99",
        rating: 1,
        comment: "Check out my store for better prices!! [link removed]",
        status: "rejected",
      },
    ].filter(Boolean);

    if (reviewSeed.length > 0) await Review.insertMany(reviewSeed);

    // ---- Enrich a few products with sizes + color variants ----
    // (needed to actually exercise per-size stock enforcement and
    // variant-based pricing in the UI — most seeded products don't have
    // sizes/variants by default)
    const sizeUpdates = [
      {
        slug: "printed-cotton-kurti",
        sizes: [
          { label: "S", stock: 8 },
          { label: "M", stock: 12 },
          { label: "L", stock: 5 },
          { label: "XL", stock: 0 }, // out of stock — demonstrates the disabled size button
        ],
        variants: [
          { color: "Blue", stock: 10, sku: "PCK-BLU" },
          { color: "Black", stock: 8, price: 649, sku: "PCK-BLK" }, // priced higher — demonstrates live variant pricing
        ],
        display: { showQuantitySelector: true, showSizeDropdown: true, showColorDropdown: true },
      },
      {
        slug: "festive-kurta-pajama-set",
        sizes: [
          { label: "M", stock: 6 },
          { label: "L", stock: 9 },
          { label: "XL", stock: 3 }, // low stock — demonstrates the "Only X left" note
          { label: "XXL", stock: 0 },
        ],
        display: { showQuantitySelector: true, showSizeDropdown: true, showColorDropdown: false },
      },
      {
        slug: "boys-printed-tshirt-set",
        sizes: [
          { label: "2-3Y", stock: 10 },
          { label: "4-5Y", stock: 7 },
          { label: "6-7Y", stock: 2 },
        ],
        display: { showQuantitySelector: true, showSizeDropdown: true, showColorDropdown: false },
      },
    ];

    let updatedCount = 0;
    for (const u of sizeUpdates) {
      const result = await Product.findOneAndUpdate(
        { slug: u.slug },
        { sizes: u.sizes, variants: u.variants || [], display: u.display },
        { new: true }
      );
      if (result) updatedCount += 1;
    }

    console.log(
      `Done! Seeded ${coupons.length} coupons, 4 banners, ${reviewSeed.length} reviews, and added sizes/variants to ${updatedCount} products.`
    );
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
