import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    image: { type: String, default: "" },
    emoji: { type: String, default: "🎀" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    seo: {
      title: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Returns [categoryId, ...all descendant category IDs] — used so that filtering
// products by a parent category (e.g. "Jewellery") also includes products filed
// under its subcategories (e.g. "Earrings", "Necklaces").
categorySchema.statics.getSelfAndDescendantIds = async function (categoryId) {
  const all = await this.find({}, "_id parent").lean();
  const byParent = {};
  all.forEach((c) => {
    const key = c.parent ? String(c.parent) : "root";
    byParent[key] = byParent[key] || [];
    byParent[key].push(String(c._id));
  });

  const result = [String(categoryId)];
  const queue = [String(categoryId)];
  while (queue.length) {
    const current = queue.shift();
    const children = byParent[current] || [];
    children.forEach((childId) => {
      result.push(childId);
      queue.push(childId);
    });
  }
  return result;
};

export default mongoose.model("Category", categorySchema);
