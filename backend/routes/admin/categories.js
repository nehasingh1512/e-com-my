import express from "express";
import Category from "../../models/Category.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission, logActivity } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect, requirePermission("categories"));

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");

// GET /api/admin/categories
router.get("/", async (req, res) => {
  const categories = await Category.find().sort({ displayOrder: 1, createdAt: -1 }).populate("parent", "name slug");
  res.json(categories);
});

// GET /api/admin/categories/:id
router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id).populate("parent", "name slug");
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.json(category);
});

// POST /api/admin/categories
router.post("/", async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.slug) body.slug = slugify(body.name || "");
    const category = await Category.create(body);
    await logActivity(req, "category.create", category.name);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/admin/categories/:id
router.put("/:id", async (req, res) => {
  try {
    if (req.body.parent) {
      if (String(req.body.parent) === String(req.params.id)) {
        return res.status(400).json({ message: "A category can't be its own parent" });
      }
      const descendantIds = await Category.getSelfAndDescendantIds(req.params.id);
      if (descendantIds.includes(String(req.body.parent))) {
        return res.status(400).json({ message: "Can't set a subcategory as the parent (that would create a loop)" });
      }
    }
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    await logActivity(req, "category.update", category.name);
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/admin/categories/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found" });
  category.isActive = !category.isActive;
  await category.save();
  await logActivity(req, "category.toggle", `${category.name} -> ${category.isActive}`);
  res.json(category);
});

// DELETE /api/admin/categories/:id
router.delete("/:id", async (req, res) => {
  const childCount = await Category.countDocuments({ parent: req.params.id });
  if (childCount > 0) {
    return res.status(400).json({ message: `This category has ${childCount} subcategor${childCount === 1 ? "y" : "ies"}. Move or delete them first.` });
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found" });
  await logActivity(req, "category.delete", category.name);
  res.json({ message: "Category deleted" });
});

export default router;
