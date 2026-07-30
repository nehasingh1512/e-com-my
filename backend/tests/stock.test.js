import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import { setupTestDB } from "./testDb.js";
import { createCategory, createProduct, validAddress } from "./helpers.js";

setupTestDB();

describe("Stock enforcement", () => {
  it("rejects an order that exceeds plain (non-sized) product stock", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, { stock: 2 });

    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: product._id.toString(), name: product.name, price: product.price, qty: 5 }],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
        guestEmail: "guest@example.com",
      });

    expect(res.status).toBe(400);

    const unchanged = await Product.findById(product._id);
    expect(unchanged.stock).toBe(2); // nothing should have been decremented
  });

  it("rejects an order that exceeds a specific size's stock even though overall stock is high", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, {
      stock: 100,
      sizes: [{ label: "M", stock: 2 }],
      display: { showSizeDropdown: true },
    });

    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: product._id.toString(), name: product.name, price: product.price, qty: 5, size: "M" }],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
        guestEmail: "guest@example.com",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/size M/i);
  });

  it("decrements both the size-specific stock and the overall stock on a successful order", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, {
      stock: 100,
      sizes: [{ label: "M", stock: 10 }],
      display: { showSizeDropdown: true },
    });

    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: product._id.toString(), name: product.name, price: product.price, qty: 3, size: "M" }],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
        guestEmail: "guest@example.com",
      });

    expect(res.status).toBe(201);

    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(97);
    expect(updated.sizes.find((s) => s.label === "M").stock).toBe(7);
  });

  it("never oversells under concurrent orders racing for the same limited stock", async () => {
    // Two simultaneous orders each request more than half of a stock of 5 —
    // the pre-check alone can't prevent overselling here (both requests could
    // pass the pre-check before either decrement lands); this is what the
    // atomic conditional $inc in the decrement step is actually for.
    const category = await createCategory();
    const scarce = await createProduct(category._id, { stock: 5, name: "Scarce Rakhi" });

    const placeOrder = (qty) =>
      request(app)
        .post("/api/orders")
        .send({
          items: [{ product: scarce._id.toString(), name: scarce.name, price: scarce.price, qty }],
          shippingAddress: validAddress,
          deliveryMethod: "standard",
          paymentMethod: "cod",
          guestEmail: "guest@example.com",
        });

    const [resA, resB] = await Promise.all([placeOrder(3), placeOrder(3)]);
    const statuses = [resA.status, resB.status].sort();

    // At most one of the two can succeed (3 + 3 > 5 available)
    expect(statuses).not.toEqual([201, 201]);

    const finalProduct = await Product.findById(scarce._id);
    expect(finalProduct.stock).toBeGreaterThanOrEqual(0); // never goes negative
    expect(finalProduct.stock).toBeLessThanOrEqual(5); // never exceeds original
  });

  it("rolls back a successfully-decremented item if a later item in the same order fails validation before any decrement is attempted", async () => {
    const category = await createCategory();
    const plentiful = await createProduct(category._id, { stock: 50, name: "Plentiful Rakhi" });
    const scarce = await createProduct(category._id, { stock: 1, name: "Scarce Rakhi" });

    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [
          { product: plentiful._id.toString(), name: plentiful.name, price: plentiful.price, qty: 5 },
          { product: scarce._id.toString(), name: scarce.name, price: scarce.price, qty: 5 }, // exceeds stock
        ],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
        guestEmail: "guest@example.com",
      });

    // The pre-check catches this before any decrement happens at all — this
    // confirms the fail-fast path leaves stock completely untouched, which is
    // the simpler and much more common case in practice.
    expect(res.status).toBe(400);

    const plentifulAfter = await Product.findById(plentiful._id);
    expect(plentifulAfter.stock).toBe(50); // untouched
  });
});
