import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import { setupTestDB } from "./testDb.js";
import { createAdmin, createCategory, createProduct } from "./helpers.js";

setupTestDB();

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const csvOf = (rows) => {
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
};

describe("Product CSV export", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/admin/products/export");
    expect(res.status).toBe(401);
  });

  it("exports products as CSV with the expected columns", async () => {
    const { token } = await createAdmin();
    const category = await createCategory();
    await createProduct(category._id, { name: "Test Rakhi", sku: "TR-1" });

    const res = await request(app).get("/api/admin/products/export").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("name,slug,sku");
    expect(res.text).toContain("Test Rakhi");
  });
});

describe("Product CSV import", () => {
  it("creates a new product from a valid CSV row", async () => {
    const { token } = await createAdmin();
    const category = await createCategory({ slug: "designer-rakhi" });

    const csv = csvOf([
      { name: "Imported Rakhi", slug: "imported-rakhi", categorySlug: "designer-rakhi", price: 299, mrp: 399, stock: 20 },
    ]);

    const res = await request(app)
      .post("/api/admin/products/import")
      .set(authHeader(token))
      .attach("file", Buffer.from(csv), "products.csv");

    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
    expect(res.body.failed).toBe(0);

    const product = await Product.findOne({ slug: "imported-rakhi" });
    expect(product).toBeTruthy();
    expect(product.price).toBe(299);
  });

  it("updates an existing product when the slug already exists", async () => {
    const { token } = await createAdmin();
    const category = await createCategory({ slug: "designer-rakhi" });
    await createProduct(category._id, { slug: "existing-rakhi", price: 100, stock: 5 });

    const csv = csvOf([
      { name: "Existing Rakhi", slug: "existing-rakhi", categorySlug: "designer-rakhi", price: 150, mrp: 200, stock: 50 },
    ]);

    const res = await request(app)
      .post("/api/admin/products/import")
      .set(authHeader(token))
      .attach("file", Buffer.from(csv), "products.csv");

    expect(res.body.created).toBe(0);
    expect(res.body.updated).toBe(1);

    const product = await Product.findOne({ slug: "existing-rakhi" });
    expect(product.price).toBe(150);
    expect(product.stock).toBe(50);
  });

  it("reports a per-row failure without aborting the rest of the batch", async () => {
    const { token } = await createAdmin();
    const category = await createCategory({ slug: "designer-rakhi" });

    const csv = csvOf([
      { name: "Good Row", slug: "good-row", categorySlug: "designer-rakhi", price: 100, mrp: 150 },
      { name: "", slug: "bad-row", categorySlug: "designer-rakhi", price: 100, mrp: 150 }, // missing name
      { name: "Another Good Row", slug: "another-good-row", categorySlug: "designer-rakhi", price: 200, mrp: 250 },
    ]);

    const res = await request(app)
      .post("/api/admin/products/import")
      .set(authHeader(token))
      .attach("file", Buffer.from(csv), "products.csv");

    expect(res.body.created).toBe(2);
    expect(res.body.failed).toBe(1);
    expect(res.body.results.find((r) => r.status === "failed").error).toMatch(/name/i);

    const survivedProducts = await Product.find({ slug: { $in: ["good-row", "another-good-row"] } });
    expect(survivedProducts).toHaveLength(2);
  });

  it("fails a row referencing a category that doesn't exist", async () => {
    const { token } = await createAdmin();

    const csv = csvOf([
      { name: "Orphan Product", slug: "orphan-product", categorySlug: "does-not-exist", price: 100, mrp: 150 },
    ]);

    const res = await request(app)
      .post("/api/admin/products/import")
      .set(authHeader(token))
      .attach("file", Buffer.from(csv), "products.csv");

    expect(res.body.failed).toBe(1);
    expect(res.body.results[0].error).toMatch(/doesn't exist/i);
  });

  it("rejects a non-CSV file", async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post("/api/admin/products/import")
      .set(authHeader(token))
      .attach("file", Buffer.from("not a csv"), "notes.txt");

    expect(res.status).toBe(400);
  });
});
