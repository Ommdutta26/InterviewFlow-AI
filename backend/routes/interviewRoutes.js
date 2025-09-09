import express from "express";
import {
  getAllInterviews,
  getMyInterviews,
  getInterviewByStreamCallId,
  createInterview,
  updateInterviewStatus,
  updatePassStatus,
} from "../controllers/interviewController.js";

const router=express.Router();

router.get("/",getAllInterviews);
router.get("/my/:candidateId",getMyInterviews);
router.get("/stream/:streamCallId",getInterviewByStreamCallId);
router.post("/",createInterview);
router.patch("/:id/status",updateInterviewStatus);
router.patch("/pass-status/:id",updatePassStatus);


export default router;
