import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { setupTestDB } from "./testDb.js";
import { createCategory, createProduct, createCustomer, createAdmin, validAddress } from "./helpers.js";

setupTestDB();

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const placeGuestOrder = async (guestEmail = "guest@example.com") => {
  const category = await createCategory();
  const product = await createProduct(category._id, { stock: 10 });
  const res = await request(app)
    .post("/api/orders")
    .send({
      items: [{ product: product._id.toString(), name: product.name, price: product.price, qty: 1 }],
      shippingAddress: validAddress,
      deliveryMethod: "standard",
      paymentMethod: "cod",
      guestEmail,
    });
  return res.body;
};

describe("Guest order tracking access control", () => {
  // Regression test: guest orders used to be viewable by anyone who had the
  // order ID, with no verification at all. This asserts that gap is closed.
  it("rejects a guest order lookup with no email provided", async () => {
    const order = await placeGuestOrder();
    const res = await request(app).get(`/api/orders/${order._id}`);
    expect(res.status).toBe(403);
  });

  it("rejects a guest order lookup with the wrong email", async () => {
    const order = await placeGuestOrder("real@example.com");
    const res = await request(app).get(`/api/orders/${order._id}`).query({ email: "wrong@example.com" });
    expect(res.status).toBe(403);
  });

  it("allows a guest order lookup with the correct email", async () => {
    const order = await placeGuestOrder("real@example.com");
    const res = await request(app).get(`/api/orders/${order._id}`).query({ email: "real@example.com" });
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(order._id);
  });

  it("matches the email case-insensitively", async () => {
    const order = await placeGuestOrder("Real@Example.com");
    const res = await request(app).get(`/api/orders/${order._id}`).query({ email: "real@example.com" });
    expect(res.status).toBe(200);
  });

  it("lets an authenticated admin view a guest order without needing the email", async () => {
    const order = await placeGuestOrder();
    const { token } = await createAdmin();
    const res = await request(app).get(`/api/orders/${order._id}`).set(authHeader(token));
    expect(res.status).toBe(200);
  });
});

describe("Logged-in customer order access (unchanged behavior)", () => {
  it("lets a customer view their own order without an email param", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, { stock: 10 });
    const { token } = await createCustomer();

    const placed = await request(app)
      .post("/api/orders")
      .set(authHeader(token))
      .send({
        items: [{ product: product._id.toString(), name: product.name, price: product.price, qty: 1 }],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
      });

    const res = await request(app).get(`/api/orders/${placed.body._id}`).set(authHeader(token));
    expect(res.status).toBe(200);
  });

  it("blocks a different logged-in customer from viewing someone else's order", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, { stock: 10 });
    const { token: ownerToken } = await createCustomer({ email: "owner@test.com" });
    const { token: otherToken } = await createCustomer({ email: "other@test.com" });

    const placed = await request(app)
      .post("/api/orders")
      .set(authHeader(ownerToken))
      .send({
        items: [{ product: product._id.toString(), name: product.name, price: product.price, qty: 1 }],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
      });

    const res = await request(app).get(`/api/orders/${placed.body._id}`).set(authHeader(otherToken));
    expect(res.status).toBe(403);
  });
});
