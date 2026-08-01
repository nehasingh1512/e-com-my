// Multer calls next(err) when a file is rejected (wrong type, too large,
// fileFilter threw, etc.) — without this, that error falls through to the
// app's generic error handler and comes back as an unhelpful 500 instead of
// a clean 400 with the actual reason. Place this immediately after any
// upload.single()/upload.array() call in a route's middleware chain.
export const uploadErrorHandler = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({ message: err.message || "File upload failed" });
  }
  next();
};
