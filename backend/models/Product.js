import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema(
  { label: String, stock: { type: Number, default: 0 } },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    size: String,
    color: String,
    material: String,
    stock: { type: Number, default: 0 },
    price: { type: Number },
    sku: { type: String },
  },
  { _id: true }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    // legacy single-emoji display fallback (kept for the storefront placeholder art)
    image: { type: String, default: "" },
    emoji: { type: String, default: "🪢" },
    images: [imageSchema],

    sku: { type: String, default: "" },
    barcode: { type: String, default: "" },
    brand: { type: String, default: "" },

    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },

    price: { type: Number, required: true }, // sale price (what customers pay)
    mrp: { type: Number, required: true }, // regular price
    discountPercent: { type: Number, default: 0 },
    tax: { type: Number, default: 0 }, // percent, optional

    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    bestSeller: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },

    stock: { type: Number, default: 100 },
    lowStockThreshold: { type: Number, default: 10 },

    variants: [variantSchema],
    sizes: [sizeSchema],

    display: {
      showQuantitySelector: { type: Boolean, default: true },
      showSizeDropdown: { type: Boolean, default: false },
      showColorDropdown: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text" });

export default mongoose.model("Product", productSchema);
