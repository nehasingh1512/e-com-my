import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import { recalculateProductRating } from "../utils/reviewStats.js";

dotenv.config();

// One-time migration: product.rating/reviewCount used to be static numbers
// set directly in seed data, never actually backed by real Review documents.
// Now that they're recalculated live whenever a review is approved/rejected/
// deleted, run this once to reconcile any products that predate that change
// (their old fake numbers will otherwise sit there untouched until the next
// review event happens to touch that specific product).
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected. Recalculating product ratings from approved reviews...");

    const products = await Product.find().select("_id");
    for (const p of products) {
      await recalculateProductRating(p._id);
    }

    console.log(`Done — recalculated ${products.length} products.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
