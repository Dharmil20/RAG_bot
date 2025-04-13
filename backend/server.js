const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();
const uploadRoute = require("./controller/uploadRoute");
// const queryRoute = require("./controller/queryRoute");

const app = express();
app.use(cors());

// ✅ Create uploads folder if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
  console.log("Created 'uploads/' folder");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", uploadRoute);
// app.use("/api", queryRoute)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
