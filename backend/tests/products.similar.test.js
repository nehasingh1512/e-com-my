import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { setupTestDB } from "./testDb.js";
import { createCategory, createProduct } from "./helpers.js";

setupTestDB();

describe("Product details similar products", () => {
  it("returns similar active products from the same category or brand", async () => {
    const category = await createCategory({ name: "Rakhi", slug: "rakhi" });

    const base = await createProduct(category._id, {
      name: "Premium Silk Rakhi",
      slug: "premium-silk-rakhi",
      brand: "Tradition",
      rating: 4.9,
      reviewCount: 120,
    });

    const sameCategory = await createProduct(category._id, {
      name: "Pearl Rakhi",
      slug: "pearl-rakhi",
      brand: "OtherBrand",
      rating: 4.7,
      reviewCount: 80,
    });

    const sameBrand = await createProduct(category._id, {
      name: "Golden Rakhi",
      slug: "golden-rakhi",
      brand: "Tradition",
      rating: 4.8,
      reviewCount: 95,
    });

    await createProduct(category._id, {
      name: "Inactive Rakhi",
      slug: "inactive-rakhi",
      isActive: false,
      brand: "Tradition",
    });

    const otherCategory = await createCategory({ name: "Bracelets", slug: "bracelets" });
    await createProduct(otherCategory._id, {
      name: "Bracelet Product",
      slug: "bracelet-product",
      brand: "OtherBrand",
    });

    const res = await request(app).get(`/api/products/${base.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(base.slug);
    expect(Array.isArray(res.body.similarProducts)).toBe(true);
    expect(res.body.similarProducts).toHaveLength(2);

    const slugs = res.body.similarProducts.map((product) => product.slug);
    expect(slugs).toContain(sameCategory.slug);
    expect(slugs).toContain(sameBrand.slug);
    expect(slugs).not.toContain(base.slug);
    expect(slugs).not.toContain("inactive-rakhi");
    expect(slugs).not.toContain("bracelet-product");
  });
});
