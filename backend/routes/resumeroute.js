import express from "express";
import multer from "multer";
import { analyzeResume } from "../controllers/resumecontroller.js";
import { generateInterviewPrep,generateCodingQuestion,evaluateCodeSolution } from "../controllers/resumecontroller.js"

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/analyze", upload.single("resume"), analyzeResume);
router.post('/prep-interview', upload.single('resume'), generateInterviewPrep);
router.post('/generate-coding-question', generateCodingQuestion);
router.post('/evaluate-code', evaluateCodeSolution);


export default router;