import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { setupTestDB } from "./testDb.js";
import { createCategory, createProduct, validAddress } from "./helpers.js";

setupTestDB();

describe("Orders — variant handling (regression)", () => {
  // Regression test: different sizes of the same product used to collapse
  // into a single order line because size/color were stripped on the way to
  // the database. This asserts they now survive as two distinct line items.
  it("keeps two different sizes of the same product as separate order line items", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, {
      stock: 100,
      sizes: [
        { label: "M", stock: 5 },
        { label: "L", stock: 5 },
      ],
      display: { showSizeDropdown: true, showQuantitySelector: true, showColorDropdown: false },
    });

    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [
          { product: product._id.toString(), name: product.name, price: product.price, qty: 2, size: "M" },
          { product: product._id.toString(), name: product.name, price: product.price, qty: 3, size: "L" },
        ],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
        guestEmail: "guest@example.com",
      });

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(2);

    const sizeM = res.body.items.find((i) => i.size === "M");
    const sizeL = res.body.items.find((i) => i.size === "L");
    expect(sizeM.qty).toBe(2);
    expect(sizeL.qty).toBe(3);
  });

  it("merges identical size/color selections into one line, but not different ones", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, { stock: 100 });

    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [
          { product: product._id.toString(), name: product.name, price: product.price, qty: 1, color: "Red" },
          { product: product._id.toString(), name: product.name, price: product.price, qty: 2, color: "Red" },
          { product: product._id.toString(), name: product.name, price: product.price, qty: 1, color: "Blue" },
        ],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
        guestEmail: "guest@example.com",
      });

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(2);

    const red = res.body.items.find((i) => i.color === "Red");
    const blue = res.body.items.find((i) => i.color === "Blue");
    expect(red.qty).toBe(3); // the two "Red" lines merged
    expect(blue.qty).toBe(1);
  });
});
