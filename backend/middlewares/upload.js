const path = require("path");
const multer = require("multer");
const HttpError = require("../utils/httpError");

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, path.join(__dirname, "../uploads/products"));
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
  fileFilter(req, file, callback) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new HttpError(400, "Formats autorisés : JPG, PNG et WEBP.")
      );
    }

    callback(null, true);
  },
});

module.exports = upload;
