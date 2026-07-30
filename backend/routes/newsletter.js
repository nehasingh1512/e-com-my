import express from "express";
import Newsletter from "../models/Newsletter.js";

const router = express.Router();

// POST /api/newsletter/subscribe
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const exists = await Newsletter.findOne({ email });
    if (exists) return res.status(200).json({ message: "You're already subscribed!" });

    await Newsletter.create({ email });
    res.status(201).json({ message: "Subscribed successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
