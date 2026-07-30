import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

dotenv.config();

// ---- Top-level categories (parents) ----
const topLevelCategories = [
  { name: "Rakhi & Raksha Bandhan", slug: "rakhi", emoji: "🪢", displayOrder: 0 },
  { name: "Jewellery", slug: "jewellery", emoji: "💍", displayOrder: 1 },
  { name: "Ladies Wear", slug: "ladies-wear", emoji: "👗", displayOrder: 2 },
  { name: "Gents Wear", slug: "gents-wear", emoji: "👔", displayOrder: 3 },
  { name: "Kids Wear", slug: "kids-wear", emoji: "🧸", displayOrder: 4 },
];

// ---- Subcategories (each references its parent's slug above) ----
const subCategories = [
  // Rakhi subcategories (existing catalog, now nested under "Rakhi & Raksha Bandhan")
  { name: "Designer Rakhi", slug: "designer-rakhi", emoji: "💠", parentSlug: "rakhi" },
  { name: "Bhaiya Bhabhi Rakhi", slug: "bhaiya-bhabhi-rakhi", emoji: "👫", parentSlug: "rakhi" },
  { name: "Kids Rakhi", slug: "kids-rakhi", emoji: "🧸", parentSlug: "rakhi" },
  { name: "Rudraksha Rakhi", slug: "rudraksha-rakhi", emoji: "📿", parentSlug: "rakhi" },
  { name: "Silver Rakhi", slug: "silver-rakhi", emoji: "⚪", parentSlug: "rakhi" },
  { name: "Personalized Rakhi", slug: "personalized-rakhi", emoji: "🏷️", parentSlug: "rakhi" },
  { name: "Gift Hampers", slug: "gift-hampers", emoji: "🎁", parentSlug: "rakhi" },

  // Jewellery subcategories
  { name: "Earrings", slug: "earrings", emoji: "💎", parentSlug: "jewellery" },
  { name: "Necklaces", slug: "necklaces", emoji: "📿", parentSlug: "jewellery" },
  { name: "Bangles & Bracelets", slug: "bangles-bracelets", emoji: "💫", parentSlug: "jewellery" },
  { name: "Rings", slug: "rings", emoji: "💍", parentSlug: "jewellery" },

  // Ladies Wear subcategories
  { name: "Sarees", slug: "sarees", emoji: "🥻", parentSlug: "ladies-wear" },
  { name: "Kurtis", slug: "kurtis", emoji: "👚", parentSlug: "ladies-wear" },
  { name: "Dresses", slug: "dresses", emoji: "👗", parentSlug: "ladies-wear" },

  // Gents Wear subcategories
  { name: "Shirts", slug: "shirts", emoji: "👔", parentSlug: "gents-wear" },
  { name: "Kurta Sets", slug: "kurta-sets", emoji: "🧵", parentSlug: "gents-wear" },
  { name: "Ethnic Wear", slug: "ethnic-wear-gents", emoji: "🕴️", parentSlug: "gents-wear" },

  // Kids Wear subcategories
  { name: "Boys Wear", slug: "boys-wear", emoji: "👦", parentSlug: "kids-wear" },
  { name: "Girls Wear", slug: "girls-wear", emoji: "👧", parentSlug: "kids-wear" },
  { name: "Infant Wear", slug: "infant-wear", emoji: "👶", parentSlug: "kids-wear" },
];

const productSeed = [
  // Designer Rakhi
  { name: "Elegant Pearl Rakhi", slug: "elegant-pearl-rakhi", price: 199, mrp: 249, discountPercent: 20, rating: 4.8, reviewCount: 128, bestSeller: true, catSlug: "designer-rakhi", emoji: "💠" },
  { name: "Royal Stone Rakhi", slug: "royal-stone-rakhi", price: 299, mrp: 399, discountPercent: 25, rating: 4.7, reviewCount: 96, bestSeller: true, catSlug: "designer-rakhi", emoji: "🔴" },
  { name: "Peacock Designer Rakhi", slug: "peacock-designer-rakhi", price: 279, mrp: 379, discountPercent: 26, rating: 4.6, reviewCount: 86, bestSeller: true, catSlug: "designer-rakhi", emoji: "🦚" },
  { name: "Kundan Zardosi Rakhi", slug: "kundan-zardosi-rakhi", price: 349, mrp: 449, discountPercent: 22, rating: 4.5, reviewCount: 54, catSlug: "designer-rakhi", emoji: "✨" },
  { name: "Meenakari Floral Rakhi", slug: "meenakari-floral-rakhi", price: 229, mrp: 299, discountPercent: 23, rating: 4.4, reviewCount: 41, catSlug: "designer-rakhi", emoji: "🌸" },

  // Bhaiya Bhabhi
  { name: "Bhaiya Bhabhi Pearl Set", slug: "bhaiya-bhabhi-pearl-set", price: 399, mrp: 549, discountPercent: 27, rating: 4.7, reviewCount: 72, catSlug: "bhaiya-bhabhi-rakhi", emoji: "👫" },
  { name: "Bhaiya Bhabhi Lumba Set", slug: "bhaiya-bhabhi-lumba-set", price: 449, mrp: 599, discountPercent: 25, rating: 4.6, reviewCount: 58, catSlug: "bhaiya-bhabhi-rakhi", emoji: "💞" },
  { name: "Bhaiya Bhabhi Kundan Set", slug: "bhaiya-bhabhi-kundan-set", price: 379, mrp: 499, discountPercent: 24, rating: 4.5, reviewCount: 33, catSlug: "bhaiya-bhabhi-rakhi", emoji: "💛" },

  // Kids Rakhi
  { name: "Cartoon Hero Kids Rakhi", slug: "cartoon-hero-kids-rakhi", price: 129, mrp: 179, discountPercent: 28, rating: 4.6, reviewCount: 112, catSlug: "kids-rakhi", emoji: "🦸" },
  { name: "Cute Panda Kids Rakhi", slug: "cute-panda-kids-rakhi", price: 119, mrp: 169, discountPercent: 30, rating: 4.7, reviewCount: 89, catSlug: "kids-rakhi", emoji: "🐼" },
  { name: "Robot Kids Rakhi", slug: "robot-kids-rakhi", price: 139, mrp: 189, discountPercent: 26, rating: 4.4, reviewCount: 47, catSlug: "kids-rakhi", emoji: "🤖" },

  // Rudraksha
  { name: "Rudraksha Rakhi", slug: "rudraksha-rakhi-product", price: 249, mrp: 349, discountPercent: 29, rating: 4.6, reviewCount: 65, bestSeller: true, catSlug: "rudraksha-rakhi", emoji: "📿" },
  { name: "Rudraksha Om Rakhi", slug: "rudraksha-om-rakhi", price: 269, mrp: 369, discountPercent: 27, rating: 4.5, reviewCount: 39, catSlug: "rudraksha-rakhi", emoji: "🕉️" },
  { name: "Rudraksha Beaded Rakhi", slug: "rudraksha-beaded-rakhi", price: 229, mrp: 319, discountPercent: 28, rating: 4.3, reviewCount: 22, catSlug: "rudraksha-rakhi", emoji: "🟤" },

  // Silver
  { name: "Silver Om Rakhi", slug: "silver-om-rakhi", price: 349, mrp: 499, discountPercent: 30, rating: 4.9, reviewCount: 104, bestSeller: true, catSlug: "silver-rakhi", emoji: "🕉️" },
  { name: "Silver Swastik Rakhi", slug: "silver-swastik-rakhi", price: 379, mrp: 529, discountPercent: 28, rating: 4.6, reviewCount: 51, catSlug: "silver-rakhi", emoji: "⚪" },
  { name: "Silver Zircon Rakhi", slug: "silver-zircon-rakhi", price: 429, mrp: 599, discountPercent: 28, rating: 4.5, reviewCount: 34, catSlug: "silver-rakhi", emoji: "💎" },

  // Personalized
  { name: "Personalized Name Rakhi", slug: "personalized-name-rakhi", price: 279, mrp: 399, discountPercent: 30, rating: 4.5, reviewCount: 35, bestSeller: true, catSlug: "personalized-rakhi", emoji: "🏷️" },
  { name: "Photo Charm Rakhi", slug: "photo-charm-rakhi", price: 329, mrp: 449, discountPercent: 27, rating: 4.4, reviewCount: 28, catSlug: "personalized-rakhi", emoji: "🖼️" },

  // Gift Hampers
  { name: "Sweets & Rakhi Hamper", slug: "sweets-rakhi-hamper", price: 599, mrp: 799, discountPercent: 25, rating: 4.7, reviewCount: 63, catSlug: "gift-hampers", emoji: "🎁" },
  { name: "Dry Fruits Rakhi Hamper", slug: "dry-fruits-rakhi-hamper", price: 799, mrp: 999, discountPercent: 20, rating: 4.8, reviewCount: 77, catSlug: "gift-hampers", emoji: "🌰" },
  { name: "Chocolate Rakhi Combo", slug: "chocolate-rakhi-combo", price: 499, mrp: 699, discountPercent: 29, rating: 4.6, reviewCount: 55, catSlug: "gift-hampers", emoji: "🍫" },

  // Jewellery
  { name: "Kundan Drop Earrings", slug: "kundan-drop-earrings", price: 449, mrp: 599, discountPercent: 25, rating: 4.6, reviewCount: 41, catSlug: "earrings", emoji: "💎" },
  { name: "Pearl Stud Earrings", slug: "pearl-stud-earrings", price: 299, mrp: 399, discountPercent: 25, rating: 4.5, reviewCount: 33, catSlug: "earrings", emoji: "🦪" },
  { name: "Temple Design Necklace", slug: "temple-design-necklace", price: 899, mrp: 1199, discountPercent: 25, rating: 4.7, reviewCount: 29, catSlug: "necklaces", emoji: "📿" },
  { name: "Gold Plated Bangles Set", slug: "gold-plated-bangles-set", price: 649, mrp: 899, discountPercent: 28, rating: 4.6, reviewCount: 37, catSlug: "bangles-bracelets", emoji: "💫" },
  { name: "Adjustable Kundan Ring", slug: "adjustable-kundan-ring", price: 249, mrp: 349, discountPercent: 29, rating: 4.4, reviewCount: 18, catSlug: "rings", emoji: "💍" },

  // Ladies Wear
  { name: "Banarasi Silk Saree", slug: "banarasi-silk-saree", price: 1799, mrp: 2499, discountPercent: 28, rating: 4.8, reviewCount: 52, catSlug: "sarees", emoji: "🥻" },
  { name: "Printed Cotton Kurti", slug: "printed-cotton-kurti", price: 599, mrp: 899, discountPercent: 33, rating: 4.4, reviewCount: 66, catSlug: "kurtis", emoji: "👚" },
  { name: "Floral A-Line Dress", slug: "floral-a-line-dress", price: 899, mrp: 1299, discountPercent: 31, rating: 4.5, reviewCount: 24, catSlug: "dresses", emoji: "👗" },

  // Gents Wear
  { name: "Classic Formal Shirt", slug: "classic-formal-shirt", price: 799, mrp: 1099, discountPercent: 27, rating: 4.3, reviewCount: 45, catSlug: "shirts", emoji: "👔" },
  { name: "Festive Kurta Pajama Set", slug: "festive-kurta-pajama-set", price: 1299, mrp: 1799, discountPercent: 28, rating: 4.6, reviewCount: 38, catSlug: "kurta-sets", emoji: "🧵" },
  { name: "Nehru Jacket Ethnic Set", slug: "nehru-jacket-ethnic-set", price: 1599, mrp: 2199, discountPercent: 27, rating: 4.5, reviewCount: 21, catSlug: "ethnic-wear-gents", emoji: "🕴️" },

  // Kids Wear
  { name: "Boys Printed T-Shirt Set", slug: "boys-printed-tshirt-set", price: 449, mrp: 649, discountPercent: 31, rating: 4.4, reviewCount: 27, catSlug: "boys-wear", emoji: "👦" },
  { name: "Girls Party Frock", slug: "girls-party-frock", price: 699, mrp: 999, discountPercent: 30, rating: 4.6, reviewCount: 31, catSlug: "girls-wear", emoji: "👧" },
  { name: "Infant Cotton Romper", slug: "infant-cotton-romper", price: 349, mrp: 499, discountPercent: 30, rating: 4.7, reviewCount: 19, catSlug: "infant-wear", emoji: "👶" },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected. Seeding...");

    await Category.deleteMany();
    await Product.deleteMany();

    // Phase 1: create top-level (parent) categories first so we have their IDs
    const createdParents = await Category.insertMany(topLevelCategories);
    const catMap = {};
    createdParents.forEach((c) => (catMap[c.slug] = c._id));

    // Phase 2: create subcategories, pointing `parent` at the matching top-level ID
    const subToInsert = subCategories.map((s, idx) => ({
      name: s.name,
      slug: s.slug,
      emoji: s.emoji,
      parent: catMap[s.parentSlug],
      displayOrder: idx,
    }));
    const createdSubs = await Category.insertMany(subToInsert);
    createdSubs.forEach((c) => (catMap[c.slug] = c._id));

    const productsToInsert = productSeed.map((p) => ({
      name: p.name,
      slug: p.slug,
      category: catMap[p.catSlug],
      emoji: p.emoji,
      price: p.price,
      mrp: p.mrp,
      discountPercent: p.discountPercent,
      rating: p.rating,
      reviewCount: p.reviewCount,
      bestSeller: !!p.bestSeller,
      description: `${p.name} — thoughtfully made with quality materials.`,
    }));

    await Product.insertMany(productsToInsert);

    console.log(`Seed complete! ${createdParents.length} top-level categories, ${createdSubs.length} subcategories, ${productsToInsert.length} products.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
