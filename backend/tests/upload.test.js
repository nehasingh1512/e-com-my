import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { setupTestDB } from "./testDb.js";
import { createAdmin } from "./helpers.js";

setupTestDB();

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

describe("Image upload error handling", () => {
  // Regression test: a rejected upload (wrong file type) used to fall through
  // to the generic error handler and come back as an unhelpful 500 instead of
  // a clean 400 explaining why.
  it("returns 400 (not 500) with a clear message when a non-image file is uploaded", async () => {
    const { token } = await createAdmin();
    const res = await request(app)
      .post("/api/upload")
      .set(authHeader(token))
      .attach("image", Buffer.from("not an image"), "notes.txt");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/image/i);
  });

  it("requires admin authentication", async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("image", Buffer.from("fake png data"), "test.png");
    expect(res.status).toBe(401);
  });
});
