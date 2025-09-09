import express from "express";
import {
  syncUser,
  getUsers,
  getUserByClerkId,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/sync", syncUser);
router.get("/", getUsers);
router.get("/clerk/:clerkId", getUserByClerkId);

export default router;
