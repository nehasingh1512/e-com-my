import express from "express";
import Notification from "../../models/Notification.js";
import { protect } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect, requireAdmin);

router.get("/", async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

router.patch("/:id/read", async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  res.json(notification);
});

router.patch("/read-all", async (req, res) => {
  await Notification.updateMany({ isRead: false }, { isRead: true });
  res.json({ message: "All notifications marked as read" });
});

export default router;
