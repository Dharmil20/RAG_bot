const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const axios = require('axios');
const cloudinary = require("../utils/cloudinary"); // Your Cloudinary config
const upload = require("../middleware/multer");    // Your multer middleware

router.post("/api/upload", upload.single("docUpload"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const localFilePath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: "uploads", // Optional: Cloudinary folder name
      public_id: originalName, // Use original filename (without extension)
      resource_type: "auto",   // handles images, videos, etc.
    });

    // Delete file from local uploads folder
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    const response = await axios.post("http://localhost:8000/process", {
      file_url: result.secure_url,
    });

    res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      url: result.secure_url,
      public_id: result.public_id,
      vectorCount: response.data.vector_count,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({
      success: false,
      message: "Error while uploading",
    });
  }
});

module.exports = router;
