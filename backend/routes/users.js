import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { normalizeCartItems, normalizeWishlistIds } from "../utils/cart.js";

const router = express.Router();
router.use(protect);

// GET /api/users/wishlist
router.get("/wishlist", async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.json(user.wishlist);
});

// PUT /api/users/wishlist  { productIds: [...] }  -- replaces the whole wishlist (simple sync)
router.put("/wishlist", async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = normalizeWishlistIds(req.body.productIds);
  await user.save();
  res.json(user.wishlist);
});

// GET /api/users/cart
router.get("/cart", async (req, res) => {
  const user = await User.findById(req.user._id).populate("cart.product");
  res.json(user.cart);
});

// PUT /api/users/cart  { items: [{ product, qty }] } -- replaces the whole cart (simple sync)
router.put("/cart", async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = normalizeCartItems(req.body.items);
  await user.save();
  const populated = await user.populate("cart.product");
  res.json(populated.cart);
});

export default router;
