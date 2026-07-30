import express from "express";
import User from "../../models/User.js";
import ActivityLog from "../../models/ActivityLog.js";
import { protect } from "../../middleware/auth.js";
import { logActivity } from "../../middleware/adminAuth.js";

const router = express.Router();
router.use(protect);

// Only super_admin can manage other admin/staff accounts.
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== "super_admin") return res.status(403).json({ message: "Super Admin access required" });
  next();
};

const ADMIN_ROLES = ["super_admin", "admin", "store_manager", "order_manager"];

// GET /api/admin/staff
router.get("/", requireSuperAdmin, async (req, res) => {
  const staff = await User.find({ role: { $in: ADMIN_ROLES } }).select("-password").sort({ createdAt: -1 });
  res.json(staff);
});

// POST /api/admin/staff
router.post("/", requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;
    if (!ADMIN_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already in use" });

    const staff = await User.create({ name, email, password, role, permissions });
    await logActivity(req, "staff.create", `${staff.email} (${staff.role})`);
    res.status(201).json({ ...staff.toObject(), password: undefined });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/admin/staff/:id
router.put("/:id", requireSuperAdmin, async (req, res) => {
  const { name, role, permissions, isActive } = req.body;
  if (role && !ADMIN_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });

  const staff = await User.findOneAndUpdate(
    { _id: req.params.id, role: { $in: ADMIN_ROLES } },
    { name, role, permissions, isActive },
    { new: true, runValidators: true }
  ).select("-password");
  if (!staff) return res.status(404).json({ message: "Staff member not found" });
  await logActivity(req, "staff.update", staff.email);
  res.json(staff);
});

// DELETE /api/admin/staff/:id
router.delete("/:id", requireSuperAdmin, async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    return res.status(400).json({ message: "You can't remove your own account" });
  }
  const staff = await User.findOneAndDelete({ _id: req.params.id, role: { $in: ADMIN_ROLES } });
  if (!staff) return res.status(404).json({ message: "Staff member not found" });
  await logActivity(req, "staff.delete", staff.email);
  res.json({ message: "Staff member removed" });
});

// GET /api/admin/staff/activity-log
router.get("/logs/activity", requireSuperAdmin, async (req, res) => {
  const logs = await ActivityLog.find().populate("admin", "name email role").sort({ createdAt: -1 }).limit(200);
  res.json(logs);
});

export default router;
