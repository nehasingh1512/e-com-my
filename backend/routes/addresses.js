import express from "express";
import Address from "../models/Address.js";
import { protect } from "../middleware/auth.js";
import { validateAddressPayload } from "../utils/validators.js";

const router = express.Router();
router.use(protect);

// GET /api/addresses
router.get("/", async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json(addresses);
});

// POST /api/addresses
router.post("/", async (req, res) => {
  try {
    const validationMessage = validateAddressPayload(req.body);
    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }
    const address = await Address.create({
      user: req.user._id,
      fullName: req.body.fullName.trim(),
      phone: req.body.phone.trim(),
      line1: req.body.line1.trim(),
      line2: req.body.line2?.trim(),
      city: req.body.city.trim(),
      state: req.body.state.trim(),
      pincode: String(req.body.pincode).trim(),
      label: req.body.label || "Home",
      isDefault: Boolean(req.body.isDefault),
    });
    res.status(201).json(address);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/addresses/:id
router.put("/:id", async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return res.status(404).json({ message: "Address not found" });
  const validationMessage = validateAddressPayload({ ...address.toObject(), ...req.body });
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }
  Object.assign(address, {
    ...req.body,
    fullName: req.body.fullName?.trim() ?? address.fullName,
    phone: req.body.phone?.trim() ?? address.phone,
    line1: req.body.line1?.trim() ?? address.line1,
    line2: req.body.line2?.trim() ?? address.line2,
    city: req.body.city?.trim() ?? address.city,
    state: req.body.state?.trim() ?? address.state,
    pincode: req.body.pincode != null ? String(req.body.pincode).trim() : address.pincode,
  });
  await address.save();
  res.json(address);
});

// DELETE /api/addresses/:id
router.delete("/:id", async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) return res.status(404).json({ message: "Address not found" });
  res.json({ message: "Address removed" });
});

export default router;
