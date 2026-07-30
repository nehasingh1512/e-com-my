import ActivityLog from "../models/ActivityLog.js";

const ADMIN_ROLES = ["super_admin", "admin", "store_manager", "order_manager"];

// Default section access per role (used when a user has no custom `permissions` set).
// super_admin always has full access regardless of this map.
const ROLE_DEFAULTS = {
  admin: { products: true, categories: true, orders: true, customers: true, reports: true, settings: true },
  store_manager: { products: true, categories: true, orders: false, customers: false, reports: true, settings: false },
  order_manager: { products: false, categories: false, orders: true, customers: true, reports: false, settings: false },
};

// Requires a logged-in user (via `protect`) with any admin-level role.
export const requireAdmin = (req, res, next) => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Requires a specific permission section (e.g. "products", "orders").
// super_admin bypasses all checks. Other roles fall back to ROLE_DEFAULTS unless
// the user document has explicit `permissions` overrides.
export const requirePermission = (section) => (req, res, next) => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  if (req.user.role === "super_admin") return next();

  const defaults = ROLE_DEFAULTS[req.user.role] || {};
  const permsObj = req.user.permissions?.toObject ? req.user.permissions.toObject() : req.user.permissions;
  const hasCustomPermissions = permsObj && Object.values(permsObj).some((v) => v === true);
  const allowed = hasCustomPermissions ? permsObj[section] : defaults[section];

  if (!allowed) {
    return res.status(403).json({ message: `You don't have permission to manage ${section}` });
  }
  next();
};

// Fire-and-forget activity log write. Never blocks the request on failure.
export const logActivity = async (req, action, details = "") => {
  try {
    if (!req.user) return;
    await ActivityLog.create({
      admin: req.user._id,
      action,
      details,
      ip: req.ip,
    });
  } catch {
    // logging failures should never break the actual request
  }
};

export { ROLE_DEFAULTS };
