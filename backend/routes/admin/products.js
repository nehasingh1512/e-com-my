import express from "express";
import multer from "multer";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import StockHistory from "../../models/StockHistory.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission, logActivity } from "../../middleware/adminAuth.js";
import { uploadErrorHandler } from "../../middleware/uploadErrorHandler.js";
import { toCSV, parseCSV } from "../../utils/csv.js";

const router = express.Router();
router.use(protect, requirePermission("products"));

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const okType = file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel" || file.originalname.endsWith(".csv");
    if (okType) cb(null, true);
    else cb(new Error("Please upload a .csv file"));
  },
});

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");

// The flat, CSV-friendly subset of Product fields. Nested data (images,
// variants, sizes, display settings) isn't included — those still need the
// product editor UI; cramming array/object data into CSV cells is fragile
// and painful to edit in Excel/Sheets anyway.
const CSV_COLUMNS = [
  "name", "slug", "sku", "brand", "categorySlug",
  "price", "mrp", "discountPercent", "tax",
  "stock", "lowStockThreshold",
  "isActive", "bestSeller", "featured", "newArrival",
  "emoji", "shortDescription", "description",
];

const parseBool = (value, fallback) => {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  return ["true", "1", "yes", "y"].includes(String(value).trim().toLowerCase());
};

// GET /api/admin/products/export  -> CSV of all products
router.get("/export", async (req, res) => {
  const products = await Product.find().populate("category", "slug").sort({ name: 1 });
  const rows = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    sku: p.sku || "",
    brand: p.brand || "",
    categorySlug: p.category?.slug || "",
    price: p.price,
    mrp: p.mrp,
    discountPercent: p.discountPercent || 0,
    tax: p.tax || 0,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    isActive: p.isActive,
    bestSeller: p.bestSeller,
    featured: p.featured,
    newArrival: p.newArrival,
    emoji: p.emoji || "",
    shortDescription: p.shortDescription || "",
    description: p.description || "",
  }));

  res.header("Content-Type", "text/csv");
  res.attachment(`products-export-${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(toCSV(rows.length ? rows : [Object.fromEntries(CSV_COLUMNS.map((c) => [c, ""]))]));
});

// GET /api/admin/products/import/template  -> blank CSV with headers + one example row
router.get("/import/template", async (req, res) => {
  const exampleCategory = await Category.findOne().select("slug");
  const example = {
    name: "Elegant Pearl Rakhi",
    slug: "elegant-pearl-rakhi",
    sku: "EPR-001",
    brand: "",
    categorySlug: exampleCategory?.slug || "designer-rakhi",
    price: 199,
    mrp: 249,
    discountPercent: 20,
    tax: 0,
    stock: 50,
    lowStockThreshold: 10,
    isActive: "true",
    bestSeller: "false",
    featured: "false",
    newArrival: "false",
    emoji: "💠",
    shortDescription: "A beautiful handcrafted rakhi",
    description: "Full product description goes here.",
  };
  res.header("Content-Type", "text/csv");
  res.attachment("product-import-template.csv");
  res.send(toCSV([example]));
});

// POST /api/admin/products/import  (multipart/form-data, field name "file")
// Upserts by slug — a row with an existing slug updates that product, a new
// slug creates one. Each row succeeds or fails independently; one bad row
// never aborts the rest of the batch, and every row's outcome is reported
// back rather than failing silently.
router.post("/import", csvUpload.single("file"), uploadErrorHandler, async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  let rows;
  try {
    rows = parseCSV(req.file.buffer.toString("utf-8"));
  } catch (err) {
    return res.status(400).json({ message: `Could not parse CSV: ${err.message}` });
  }
  if (rows.length === 0) {
    return res.status(400).json({ message: "The CSV file has no data rows" });
  }
  if (rows.length > 1000) {
    return res.status(400).json({ message: "Import is limited to 1000 rows at a time" });
  }

  const categoryCache = new Map();
  const results = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // account for the header row + 1-indexing, matches what a spreadsheet shows

    try {
      if (!row.name?.trim()) throw new Error("Missing required field: name");
      if (!row.price || isNaN(Number(row.price))) throw new Error("Missing or invalid field: price");
      if (!row.mrp || isNaN(Number(row.mrp))) throw new Error("Missing or invalid field: mrp");
      if (!row.categorySlug?.trim()) throw new Error("Missing required field: categorySlug");

      let categoryId = categoryCache.get(row.categorySlug);
      if (!categoryId) {
        const category = await Category.findOne({ slug: row.categorySlug.trim() }).select("_id");
        if (!category) throw new Error(`Category "${row.categorySlug}" doesn't exist — create it first in Categories`);
        categoryId = category._id;
        categoryCache.set(row.categorySlug, categoryId);
      }

      const slug = row.slug?.trim() || slugify(row.name);
      const existing = await Product.findOne({ slug });

      const payload = {
        name: row.name.trim(),
        slug,
        sku: row.sku?.trim() || "",
        brand: row.brand?.trim() || "",
        category: categoryId,
        price: Number(row.price),
        mrp: Number(row.mrp),
        discountPercent: row.discountPercent ? Number(row.discountPercent) : 0,
        tax: row.tax ? Number(row.tax) : 0,
        stock: row.stock !== undefined && row.stock !== "" ? Number(row.stock) : (existing?.stock ?? 0),
        lowStockThreshold: row.lowStockThreshold ? Number(row.lowStockThreshold) : (existing?.lowStockThreshold ?? 10),
        isActive: parseBool(row.isActive, existing?.isActive ?? true),
        bestSeller: parseBool(row.bestSeller, existing?.bestSeller ?? false),
        featured: parseBool(row.featured, existing?.featured ?? false),
        newArrival: parseBool(row.newArrival, existing?.newArrival ?? false),
        emoji: row.emoji?.trim() || existing?.emoji || "🪢",
        shortDescription: row.shortDescription?.trim() || "",
        description: row.description?.trim() || "",
      };

      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
        updated += 1;
        results.push({ row: rowNum, slug, status: "updated" });
      } else {
        await Product.create(payload);
        created += 1;
        results.push({ row: rowNum, slug, status: "created" });
      }
    } catch (err) {
      failed += 1;
      results.push({ row: rowNum, slug: row.slug || row.name || "(unknown)", status: "failed", error: err.message });
    }
  }

  await logActivity(req, "product.bulk_import", `${created} created, ${updated} updated, ${failed} failed`);
  res.json({ total: rows.length, created, updated, failed, results });
});

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
