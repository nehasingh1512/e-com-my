import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import Coupon from "../models/Coupon.js";
import { setupTestDB } from "./testDb.js";
import { createCategory, createProduct, validAddress } from "./helpers.js";

setupTestDB();

const makeCoupon = (overrides = {}) =>
  Coupon.create({
    code: "SAVE20",
    type: "percentage",
    value: 20,
    isActive: true,
    ...overrides,
  });

describe("Coupon validation (preview endpoint)", () => {
  it("applies a percentage discount correctly", async () => {
    await makeCoupon();
    const category = await createCategory();
    const product = await createProduct(category._id, { price: 200 });

    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: "SAVE20", items: [{ product: product._id.toString(), qty: 2, price: 200 }] });

    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(80); // 20% of 400
  });

  it("rejects an unknown coupon code", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: "DOESNOTEXIST", items: [] });
    expect(res.status).toBe(400);
  });

  it("rejects a coupon below its minimum purchase", async () => {
    await makeCoupon({ code: "BIGSPEND", minPurchase: 1000 });
    const category = await createCategory();
    const product = await createProduct(category._id, { price: 200 });

    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: "BIGSPEND", items: [{ product: product._id.toString(), qty: 1, price: 200 }] });

    expect(res.status).toBe(400);
  });

  it("rejects an expired coupon", async () => {
    await makeCoupon({ code: "EXPIRED", endDate: new Date(Date.now() - 86400000) });
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: "EXPIRED", items: [] });
    expect(res.status).toBe(400);
  });

  it("rejects a coupon that has hit its usage limit", async () => {
    await makeCoupon({ code: "LIMITED", usageLimit: 1, usedCount: 1 });
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: "LIMITED", items: [] });
    expect(res.status).toBe(400);
  });
});

describe("Coupon application at order creation", () => {
  it("applies the discount to the order total and increments usedCount", async () => {
    const coupon = await makeCoupon({ code: "ORDER20", value: 20 });
    const category = await createCategory();
    const product = await createProduct(category._id, { price: 200, stock: 10 });

    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: product._id.toString(), name: product.name, price: 200, qty: 2 }],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
        guestEmail: "guest@example.com",
        couponCode: "ORDER20",
      });

    expect(res.status).toBe(201);
    expect(res.body.discountAmount).toBe(80); // 20% of 400
    expect(res.body.totalPrice).toBe(320); // 400 - 80, standard delivery is free

    const updatedCoupon = await Coupon.findById(coupon._id);
    expect(updatedCoupon.usedCount).toBe(1);
  });

  it("rejects order creation with an invalid coupon code without creating the order", async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, { price: 200, stock: 10 });

    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: product._id.toString(), name: product.name, price: 200, qty: 1 }],
        shippingAddress: validAddress,
        deliveryMethod: "standard",
        paymentMethod: "cod",
        guestEmail: "guest@example.com",
        couponCode: "NOTREAL",
      });

    expect(res.status).toBe(400);
  });
});
