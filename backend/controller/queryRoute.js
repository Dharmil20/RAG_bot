// const express = require("express");
// const router = express.Router();
// const { get_answer_from_query } = require("./rag_backend");

// router.post("/query", async (req, res) => {
//   try {
//     if (!req.body.question) {
//       return res.status(400).json({ error: "Question is required" });
//     }

//     const answer = await get_answer_from_query(req.body.question);
//     res.json({ answer });
//   } catch (error) {
//     console.error("Error processing query:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// module.exports = router;