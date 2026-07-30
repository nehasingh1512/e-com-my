import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { setupTestDB } from "./testDb.js";
import { createCustomer } from "./helpers.js";

setupTestDB();

describe("Auth", () => {
  it("registers a new customer and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.role).toBe("customer");
  });

  it("rejects registration with a duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Jane Doe",
      email: "dupe@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Jane Doe 2",
      email: "dupe@example.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials and rejects wrong ones", async () => {
    await createCustomer({ email: "login@test.com", password: "correcthorse" });

    const good = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "correcthorse",
    });
    expect(good.status).toBe(200);
    expect(good.body.token).toBeTruthy();

    const bad = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "wrongpassword",
    });
    expect(bad.status).toBe(401);
  });

  it("blocks login for a disabled account", async () => {
    await createCustomer({ email: "disabled@test.com", password: "password123", isActive: false });

    const res = await request(app).post("/api/auth/login").send({
      email: "disabled@test.com",
      password: "password123",
    });

    expect(res.status).toBe(403);
  });

  it("rejects /auth/me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
