import express from "express";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import { protect } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect, requireAdmin);

// GET /api/admin/dashboard
router.get("/", async (req, res) => {
  try {
    const [
      totalProducts,
      totalCategories,
      totalOrders,
      totalCustomers,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      lowStockProducts,
      recentOrders,
      revenueAgg,
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: { $in: ["confirmed", "processing", "packed", "shipped", "out_for_delivery"] } }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: { $in: ["cancelled", "returned", "refunded"] } }),
      Product.find({ $expr: { $lte: ["$stock", "$lowStockThreshold"] } }).select("name stock lowStockThreshold slug").limit(10),
      Order.find().sort({ createdAt: -1 }).limit(8).populate("user", "name email"),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
    ]);

    const bestSellers = await Product.find({ bestSeller: true }).sort({ reviewCount: -1 }).limit(6).select("name price emoji reviewCount rating");

    res.json({
      totalProducts,
      totalCategories,
      totalOrders,
      totalCustomers,
      pendingOrders,
      processingOrders,
      completedOrders: deliveredOrders,
      cancelledOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
      lowStockProducts,
      recentOrders,
      bestSellingProducts: bestSellers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
