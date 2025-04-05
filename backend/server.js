const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();

// ✅ Create uploads folder if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
  console.log("📁 Created 'uploads/' folder");
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const uploadRoute = require("./controller/uploadRoute");
app.use("/", uploadRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
