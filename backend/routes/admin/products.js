import express from "express";
import Product from "../../models/Product.js";
import StockHistory from "../../models/StockHistory.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission, logActivity } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect, requirePermission("products"));

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");

// GET /api/admin/products?search=&category=&page=&limit=&stockStatus=low|out
router.get("/", async (req, res) => {
  const { search, category, page = 1, limit = 20, stockStatus } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (category) filter.category = category;
  if (stockStatus === "out") filter.stock = { $lte: 0 };
  if (stockStatus === "low") filter.$expr = { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));

  const [products, total] = await Promise.all([
    Product.find(filter).populate("category").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({ products, page: pageNum, pages: Math.ceil(total / limitNum) || 1, total });
});

// GET /api/admin/products/:id
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

// POST /api/admin/products
router.post("/", async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.slug) body.slug = slugify(body.name || "");
    const product = await Product.create(body);
    await logActivity(req, "product.create", product.name);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/admin/products/:id
router.put("/:id", async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const stockChanged = req.body.stock !== undefined && Number(req.body.stock) !== existing.stock;
    const previousStock = existing.stock;

    Object.assign(existing, req.body);
    await existing.save();

    if (stockChanged) {
      await StockHistory.create({
        product: existing._id,
        change: existing.stock - previousStock,
        reason: "manual_adjustment",
        previousStock,
        newStock: existing.stock,
        admin: req.user._id,
      });
    }

    await logActivity(req, "product.update", existing.name);
    res.json(existing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/admin/products/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  product.isActive = !product.isActive;
  await product.save();
  await logActivity(req, "product.toggle", `${product.name} -> ${product.isActive}`);
  res.json(product);
});

// POST /api/admin/products/:id/duplicate
router.post("/:id/duplicate", async (req, res) => {
  const source = await Product.findById(req.params.id).lean();
  if (!source) return res.status(404).json({ message: "Product not found" });

  delete source._id;
  delete source.createdAt;
  delete source.updatedAt;
  source.name = `${source.name} (Copy)`;
  source.slug = `${slugify(source.name)}-${Date.now()}`;
  source.reviewCount = 0;

  const copy = await Product.create(source);
  await logActivity(req, "product.duplicate", copy.name);
  res.status(201).json(copy);
});

// POST /api/admin/products/:id/adjust-stock  { change: number, reason: string }
router.post("/:id/adjust-stock", async (req, res) => {
  const { change, reason } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const previousStock = product.stock;
  product.stock = Math.max(0, previousStock + Number(change));
  await product.save();

  await StockHistory.create({
    product: product._id,
    change: Number(change),
    reason: reason || "manual_adjustment",
    previousStock,
    newStock: product.stock,
    admin: req.user._id,
  });

  await logActivity(req, "product.adjust_stock", `${product.name}: ${previousStock} -> ${product.stock}`);
  res.json(product);
});

// GET /api/admin/products/:id/stock-history
router.get("/:id/stock-history", async (req, res) => {
  const history = await StockHistory.find({ product: req.params.id }).sort({ createdAt: -1 }).populate("admin", "name");
  res.json(history);
});

// DELETE /api/admin/products/:id
router.delete("/:id", async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  await logActivity(req, "product.delete", product.name);
  res.json({ message: "Product deleted" });
});

export default router;
