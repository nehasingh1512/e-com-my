import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

// Fail loudly and immediately on missing required config, rather than
// starting up and failing mysteriously on the first request that needs it.
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
});

// Don't let one bad async error silently kill the process with no log, or
// leave it in a half-broken state — log clearly and shut down deliberately
// so a process manager (Docker, PM2, systemd) can restart it cleanly.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  shutdown(1);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown(1);
});

// Graceful shutdown on the signals a container orchestrator / process
// manager sends when stopping or restarting the service.
const shutdown = (exitCode = 0) => {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    try {
      await mongoose.connection.close();
    } finally {
      process.exit(exitCode);
    }
  });
  // Force-exit if graceful shutdown hangs for any reason.
  setTimeout(() => process.exit(exitCode), 10000).unref();
};

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
