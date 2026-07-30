import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { protect } from "../middleware/auth.js";
import { validateRegisterPayload, validateResetPasswordPayload, isNonEmptyString } from "../utils/validators.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const validationMessage = validateRegisterPayload({ name, email, password, phone });
    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ message: "An account with this email already exists" });

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, phone: phone?.trim() });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "This account has been disabled. Please contact support." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// POST /api/auth/forgot-password
// Always responds with the same generic message regardless of whether the
// email exists — this is deliberate, so the endpoint can't be used to check
// which emails have an account (a common privacy/enumeration issue).
router.post("/forgot-password", async (req, res) => {
  const genericResponse = { message: "If an account exists for that email, we've sent a password reset link." };
  try {
    const { email } = req.body;
    if (!isNonEmptyString(email)) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || user.isActive === false) {
      return res.json(genericResponse); // don't reveal whether the account exists or is disabled
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // CLIENT_URL may be a comma-separated list in production (multiple allowed
    // origins for CORS) — use the first as the canonical link target.
    const frontendOrigin = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
    const resetUrl = `${frontendOrigin}/reset-password/${rawToken}`;

    await sendMail({
      to: user.email,
      subject: "Reset your Rakhi account password",
      html: `
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. This link expires in 1 hour:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
      `,
    }).catch((mailErr) => {
      // Don't fail the request over an email delivery issue — log it and
      // still return the generic response so we don't leak account existence.
      console.error("Password reset email failed:", mailErr.message);
    });

    res.json(genericResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const validationMessage = validateResetPasswordPayload({ password });
    if (validationMessage) return res.status(400).json({ message: validationMessage });

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
    }

    user.password = password; // re-hashed by the pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: "Password updated successfully.",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id), // log them straight in after a successful reset
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
