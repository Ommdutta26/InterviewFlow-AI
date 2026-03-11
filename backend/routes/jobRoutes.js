import express from "express";
import { findJobs } from "../controllers/jobcontroller.js";

const router = express.Router();

router.post("/find-jobs", findJobs);

export default router;