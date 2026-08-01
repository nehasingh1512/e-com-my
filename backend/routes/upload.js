import express from "express";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { uploadErrorHandler } from "../middleware/uploadErrorHandler.js";
import { saveFile } from "../utils/storage.js";

const router = express.Router();

// POST /api/upload  (multipart/form-data, field name "image") -> { url }
router.post("/", protect, requireAdmin, upload.single("image"), uploadErrorHandler, async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const url = await saveFile(req.file);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: `Upload failed: ${err.message}` });
  }
});

// POST /api/upload/multiple  (field name "images", up to 10) -> { urls: [] }
router.post("/multiple", protect, requireAdmin, upload.array("images", 10), uploadErrorHandler, async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: "No files uploaded" });
  try {
    const urls = await Promise.all(req.files.map(saveFile));
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ message: `Upload failed: ${err.message}` });
  }
});

export default router;
