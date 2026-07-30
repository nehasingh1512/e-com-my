import { describe, it, expect } from "vitest";
import request from "supertest";
import crypto from "crypto";
import app from "../app.js";
import User from "../models/User.js";
import { setupTestDB } from "./testDb.js";
import { createCustomer } from "./helpers.js";

setupTestDB();

describe("Password reset", () => {
  it("returns the same generic message whether or not the email exists (no enumeration)", async () => {
    await createCustomer({ email: "real@test.com" });

    const realRes = await request(app).post("/api/auth/forgot-password").send({ email: "real@test.com" });
    const fakeRes = await request(app).post("/api/auth/forgot-password").send({ email: "doesnotexist@test.com" });

    expect(realRes.status).toBe(200);
    expect(fakeRes.status).toBe(200);
    expect(realRes.body.message).toBe(fakeRes.body.message);
  });

  it("sets a hashed reset token with an expiry on the user record", async () => {
    const { customer } = await createCustomer({ email: "reset@test.com" });
    await request(app).post("/api/auth/forgot-password").send({ email: "reset@test.com" });

    const updated = await User.findById(customer._id).select("+resetPasswordToken +resetPasswordExpires");
    expect(updated.resetPasswordToken).toBeTruthy();
    expect(updated.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects an invalid or unknown reset token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password/not-a-real-token")
      .send({ password: "newpassword123" });
    expect(res.status).toBe(400);
  });

  it("rejects an expired reset token", async () => {
    const { customer } = await createCustomer({ email: "expired@test.com" });
    const rawToken = "sometoken123";
    customer.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    customer.resetPasswordExpires = new Date(Date.now() - 1000); // already expired
    await customer.save({ validateBeforeSave: false });

    const res = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: "newpassword123" });
    expect(res.status).toBe(400);
  });

  it("resets the password with a valid token and logs the user in", async () => {
    const { customer } = await createCustomer({ email: "valid@test.com", password: "oldpassword" });
    const rawToken = "validtoken456";
    customer.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    customer.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await customer.save({ validateBeforeSave: false });

    const res = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: "newpassword789" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy(); // auto-login token returned

    // old password no longer works, new one does
    const oldLogin = await request(app).post("/api/auth/login").send({ email: "valid@test.com", password: "oldpassword" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post("/api/auth/login").send({ email: "valid@test.com", password: "newpassword789" });
    expect(newLogin.status).toBe(200);
  });

  it("invalidates the token after a single use", async () => {
    const { customer } = await createCustomer({ email: "singleuse@test.com" });
    const rawToken = "onetimetoken";
    customer.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    customer.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await customer.save({ validateBeforeSave: false });

    const first = await request(app).post(`/api/auth/reset-password/${rawToken}`).send({ password: "firstreset1" });
    expect(first.status).toBe(200);

    const second = await request(app).post(`/api/auth/reset-password/${rawToken}`).send({ password: "secondreset2" });
    expect(second.status).toBe(400); // token was cleared after first use
  });
});
