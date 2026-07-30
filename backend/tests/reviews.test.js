import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { setupTestDB } from "./testDb.js";
import { createCategory, createProduct, createCustomer, validAddress } from "./helpers.js";

setupTestDB();

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

describe("Public review listing", () => {
  it("only returns approved reviews", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id);
    await Review.create([
      { product: product._id, name: "Approved User", rating: 5, comment: "Great!", status: "approved" },
      { product: product._id, name: "Pending User", rating: 3, comment: "Meh", status: "pending" },
      { product: product._id, name: "Rejected User", rating: 1, comment: "Spam", status: "rejected" },
    ]);

    const res = await request(app).get("/api/reviews").query({ product: product.slug });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Approved User");
  });
});

describe("Review submission (requires login)", () => {
  it("rejects submission without authentication", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id);

    const res = await request(app)
      .post("/api/reviews")
      .send({ productId: product._id.toString(), rating: 5, comment: "Nice" });

    expect(res.status).toBe(401);
  });

  it("creates a pending review that doesn't affect the product's public rating yet", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id);
    const { token } = await createCustomer();

    const res = await request(app)
      .post("/api/reviews")
      .set(authHeader(token))
      .send({ productId: product._id.toString(), rating: 4, comment: "Pretty good" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.reviewCount).toBe(0); // pending reviews don't count yet
  });

  it("marks a review as a verified purchase when the customer has ordered the product", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, { stock: 10 });
    const { customer, token } = await createCustomer();

    await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: product._id.toString(), name: product.name, price: product.price, qty: 1 }],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
        guestEmail: customer.email,
      });
    // Note: this order was placed as a guest (no auth header) using the same
    // email, which intentionally does NOT count as this customer's purchase —
    // verifiedPurchase is tied to the logged-in user field on the order, not
    // email matching. Place an authenticated order to actually verify it:
    await request(app)
      .post("/api/orders")
      .set(authHeader(token))
      .send({
        items: [{ product: product._id.toString(), name: product.name, price: product.price, qty: 1 }],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
      });

    const res = await request(app)
      .post("/api/reviews")
      .set(authHeader(token))
      .send({ productId: product._id.toString(), rating: 5, comment: "Loved it" });

    expect(res.body.verifiedPurchase).toBe(true);
  });

  it("does not mark a review as verified when the customer never ordered the product", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id);
    const { token } = await createCustomer();

    const res = await request(app)
      .post("/api/reviews")
      .set(authHeader(token))
      .send({ productId: product._id.toString(), rating: 5, comment: "Looks nice" });

    expect(res.body.verifiedPurchase).toBe(false);
  });

  it("updates the same review on resubmission instead of creating a duplicate", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id);
    const { token } = await createCustomer();

    await request(app)
      .post("/api/reviews")
      .set(authHeader(token))
      .send({ productId: product._id.toString(), rating: 3, comment: "It's okay" });

    await request(app)
      .post("/api/reviews")
      .set(authHeader(token))
      .send({ productId: product._id.toString(), rating: 5, comment: "Actually it grew on me!" });

    const allReviews = await Review.find({ product: product._id });
    expect(allReviews).toHaveLength(1);
    expect(allReviews[0].rating).toBe(5);
  });

  it("rejects an out-of-range rating", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id);
    const { token } = await createCustomer();

    const res = await request(app)
      .post("/api/reviews")
      .set(authHeader(token))
      .send({ productId: product._id.toString(), rating: 8, comment: "..." });

    expect(res.status).toBe(400);
  });
});

describe("Admin moderation recalculates the product's public rating", () => {
  it("updates product.rating/reviewCount when a review is approved", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id);
    const { admin, token: adminToken } = await createCustomer({
      email: "adminreviewer@test.com",
      role: "super_admin",
    });
    const { token: customerToken } = await createCustomer({ email: "reviewer@test.com" });

    const submitRes = await request(app)
      .post("/api/reviews")
      .set(authHeader(customerToken))
      .send({ productId: product._id.toString(), rating: 5, comment: "Excellent" });

    await request(app)
      .patch(`/api/admin/reviews/${submitRes.body._id}/approve`)
      .set(authHeader(adminToken));

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.reviewCount).toBe(1);
    expect(updatedProduct.rating).toBe(5);
  });

  it("removes a review from the rating average once rejected", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id);
    const { token: adminToken } = await createCustomer({ email: "admin2@test.com", role: "super_admin" });
    const { token: customerToken } = await createCustomer({ email: "reviewer2@test.com" });

    const submitRes = await request(app)
      .post("/api/reviews")
      .set(authHeader(customerToken))
      .send({ productId: product._id.toString(), rating: 5, comment: "Great" });

    await request(app).patch(`/api/admin/reviews/${submitRes.body._id}/approve`).set(authHeader(adminToken));
    let updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.reviewCount).toBe(1);

    await request(app).patch(`/api/admin/reviews/${submitRes.body._id}/reject`).set(authHeader(adminToken));
    updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.reviewCount).toBe(0);
  });
});
