import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import newsletterRoutes from "./routes/newsletter.js";
import bannerRoutes from "./routes/banners.js";
import couponRoutes from "./routes/coupons.js";
import paymentRoutes from "./routes/payments.js";
import reviewRoutes from "./routes/reviews.js";
import authRoutes from "./routes/auth.js";
import addressRoutes from "./routes/addresses.js";
import orderRoutes from "./routes/orders.js";
import userRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";

import adminDashboardRoutes from "./routes/admin/dashboard.js";
import adminCategoryRoutes from "./routes/admin/categories.js";
import adminProductRoutes from "./routes/admin/products.js";
import adminCustomerRoutes from "./routes/admin/customers.js";
import adminOrderRoutes from "./routes/admin/orders.js";
import adminCouponRoutes from "./routes/admin/coupons.js";
import adminBannerRoutes from "./routes/admin/banners.js";
import adminReviewRoutes from "./routes/admin/reviews.js";
import adminSettingsRoutes from "./routes/admin/settings.js";
import adminReportRoutes from "./routes/admin/reports.js";
import adminNotificationRoutes from "./routes/admin/notifications.js";
import adminStaffRoutes from "./routes/admin/staff.js";

// This file builds the Express app only — no DB connection, no app.listen().
// That's what makes it importable from tests (supertest can drive requests
// straight against this app object, and each test file owns its own DB
// connection to an isolated in-memory MongoDB instance).
// `server.js` is the thin runtime entrypoint that actually starts everything.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";

const app = express();

// Required for correct req.ip / secure cookies / rate-limit-by-IP when
// running behind a reverse proxy or load balancer (Render, Railway, Nginx,
// an ALB, etc.) — without this every request appears to come from the
// proxy's IP, which breaks IP-based rate limiting entirely.
app.set("trust proxy", 1);

app.use(helmet({
  // Storefront/admin are separate SPAs served from their own origin, not
  // from this API, so a strict default CSP here would just block valid
  // cross-origin API calls for no benefit — left to the frontend's own host.
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());

// Comma-separated list of allowed origins, e.g.
// CLIENT_URL=https://rakhi-store.com,https://admin.rakhi-store.com
const allowedOrigins = (process.env.CLIENT_URL || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server, health checks)
      // which don't send an Origin header at all.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(mongoSanitize()); // strips any $/. operators from user input to prevent NoSQL injection

// Brute-force protection on auth endpoints specifically — the rest of the
// API doesn't need this aggressive a limit.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// A gentler global limit as a safety net against abuse/scraping.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.send("Rakhi Store API is running"));

// Used by container orchestrators / PaaS platforms (Docker healthcheck,
// Render/Railway health checks, k8s liveness probes) to confirm the process
// is up and can talk to MongoDB.
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? "ok" : "degraded",
    db: ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown",
    uptime: process.uptime(),
  });
});

// ---- Storefront routes ----
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

// ---- Admin routes ----
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin/banners", adminBannerRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/admin/staff", adminStaffRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Generic error handler — never leak stack traces or internal error details
// to the client in production.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: isProduction && status === 500 ? "Something went wrong. Please try again." : err.message || "Server error",
  });
});

export default app;
