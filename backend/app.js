import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import webhookRoutes from "./routes/webhookRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import streamRoutes from "./routes/streamRoutes.js";
import aiRouter from './routes/ai.js';
import cors from "cors";
dotenv.config();
const app = express();
app.use(cors())


app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use("/api/webhooks", webhookRoutes);
app.use(express.json());
app.use("/api/stream", streamRoutes);
app.use('/api', aiRouter);
app.use("/api/users", userRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/comments", commentRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () =>
      console.log("Server running...")
    );
  })
  .catch((err) => console.error("Mongo error:", err));
