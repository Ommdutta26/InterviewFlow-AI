import express from "express";
import { generateStreamToken } from "../controllers/streamController.js";
import Interview from "../models/Interview.js";

const router = express.Router();

router.post("/token", generateStreamToken);
router.get("/stream/:streamCallId",async(req, res) => {
  try {
    const interview = await Interview.findOne({ streamCallId: req.params.streamCallId });
    if (!interview) return res.status(404).json({ error: "Interview not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch interview" });
  }
});

router.patch("/:id",async(req,res)=>{
  try {
    const { status } = req.body;
    const updated = await Interview.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update interview status" });
  }
});


export default router;
