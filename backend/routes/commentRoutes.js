import express from "express";
import { addComment, getComments } from "../controllers/commentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/",addComment);
router.get("/:interviewId", getComments);

export default router;
