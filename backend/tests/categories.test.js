import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { setupTestDB } from "./testDb.js";
import { createAdmin, createCategory } from "./helpers.js";

setupTestDB();

describe("Categories (public storefront routes)", () => {
  // Regression test: /api/routes/categories.js was once accidentally
  // overwritten with the admin (auth-required) version, which made the
  // storefront nav 401 on every load. These routes must NEVER require auth.
  it("GET /api/categories requires no authentication", async () => {
    await createCategory();
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/categories/tree requires no authentication", async () => {
    await createCategory();
    const res = await request(app).get("/api/categories/tree");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("only returns active categories", async () => {
    await createCategory({ name: "Active Cat", slug: "active-cat", isActive: true });
    await createCategory({ name: "Disabled Cat", slug: "disabled-cat", isActive: false });

    const res = await request(app).get("/api/categories");
    const slugs = res.body.map((c) => c.slug);
    expect(slugs).toContain("active-cat");
    expect(slugs).not.toContain("disabled-cat");
  });

  it("nests subcategories under their parent in the tree endpoint", async () => {
    const parent = await createCategory({ name: "Jewellery", slug: "jewellery" });
    await createCategory({ name: "Earrings", slug: "earrings", parent: parent._id });

    const res = await request(app).get("/api/categories/tree");
    const jewellery = res.body.find((c) => c.slug === "jewellery");
    expect(jewellery).toBeTruthy();
    expect(jewellery.children.map((c) => c.slug)).toContain("earrings");
  });
});

describe("Categories (admin routes require auth)", () => {
  it("blocks unauthenticated access to admin category management", async () => {
    const res = await request(app).get("/api/admin/categories");
    expect(res.status).toBe(401);
  });

  it("allows an authenticated admin to manage categories", async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post("/api/admin/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Category", slug: "new-category" });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe("new-category");
  });
});
