import express from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

const router = express.Router();
const SIMILAR_PRODUCTS_LIMIT = 6;

const buildSimilarProductsFilter = (product) => {
  const filter = {
    isActive: true,
    _id: { $ne: product._id },
  };

  const orConditions = [];
  if (product.category) orConditions.push({ category: product.category._id || product.category });
  if (product.brand) orConditions.push({ brand: product.brand });

  if (orConditions.length) {
    filter.$or = orConditions;
  } else if (product.category) {
    filter.category = product.category._id || product.category;
  }

  return filter;
};

// GET /api/products
// Supports: ?bestSeller=true  ?category=slug  ?search=text
//           ?minPrice=100&maxPrice=500  ?sort=price_asc|price_desc|rating|newest
//           ?page=1&limit=12
router.get("/", async (req, res) => {
  try {
    const { bestSeller, category, search, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const filter = { isActive: true };

    if (bestSeller) filter.bestSeller = bestSeller === "true";
    if (search) filter.name = { $regex: search, $options: "i" };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        const ids = await Category.getSelfAndDescendantIds(cat._id);
        filter.category = { $in: ids };
      } else {
        filter.category = null; // unknown slug -> matches nothing
      }
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      newest: { createdAt: -1 },
    };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category")
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:slug
router.get("/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate("category");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const similarProductsFilter = buildSimilarProductsFilter(product);
    const similarProducts = await Product.find(similarProductsFilter)
      .populate("category")
      .sort({
        bestSeller: -1,
        featured: -1,
        rating: -1,
        reviewCount: -1,
        createdAt: -1,
      })
      .limit(SIMILAR_PRODUCTS_LIMIT);

    res.json({
      ...product.toObject(),
      similarProducts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
