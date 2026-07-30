import express from "express";
import Setting from "../../models/Setting.js";
import { protect } from "../../middleware/auth.js";
import { requirePermission, logActivity } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect, requirePermission("settings"));

router.get("/", async (req, res) => {
  let settings = await Setting.findOne({ key: "site_settings" });
  if (!settings) settings = await Setting.create({ key: "site_settings" });
  res.json(settings);
});

router.put("/", async (req, res) => {
  let settings = await Setting.findOne({ key: "site_settings" });
  if (!settings) settings = new Setting({ key: "site_settings" });
  Object.assign(settings, req.body);
  await settings.save();
  await logActivity(req, "settings.update");
  res.json(settings);
});

export default router;
