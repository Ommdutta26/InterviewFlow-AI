import express from "express";

const router = express.Router();
const proctoringData = {};

router.post("/event", (req, res) => {
  const { callId, candidateName, type, message, time } = req.body;

  if (!proctoringData[callId]) {
    proctoringData[callId] = [];
  }

  proctoringData[callId].push({ type, message, time, candidateName });
  console.log(`Proctoring event [${callId}]: ${type} - ${message}`);

  res.json({ success: true });
});

router.get("/events/:callId", (req, res) => {
  const { callId } = req.params;
  res.json({ events: proctoringData[callId] || [] });
});

router.delete("/events/:callId", (req, res) => {
  delete proctoringData[req.params.callId];
  res.json({ success: true });
});

export default router; // ✅ ES module export