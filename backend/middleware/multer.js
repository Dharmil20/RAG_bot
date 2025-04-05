const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store temporarily in /uploads
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Preserve original filename
  },
});

const upload = multer({ storage });

module.exports = upload;
