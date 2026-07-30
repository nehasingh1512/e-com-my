import express from "express";
import Category from "../models/Category.js";

const router = express.Router();

const buildTree = (categories) => {
  const byId = {};
  categories.forEach((c) => (byId[c._id] = { ...c.toObject(), children: [] }));
  const tree = [];
  categories.forEach((c) => {
    if (c.parent && byId[c.parent]) byId[c.parent].children.push(byId[c._id]);
    else tree.push(byId[c._id]);
  });
  return tree;
};

// GET /api/categories  -> flat list (active only), used for filters/dropdowns
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/categories/tree  -> nested parent -> children[], used for the header submenu
router.get("/tree", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json(buildTree(categories));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
