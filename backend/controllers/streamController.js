import { StreamClient } from "@stream-io/node-sdk";
import dotenv from "dotenv";

dotenv.config();

export const generateStreamToken=async(req,res)=>{
  try {
    const userId = req.user?.id || req.body.userId; 
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const streamClient = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_API_KEY,
      process.env.STREAM_SECRET_KEY
    );

    const token=streamClient.generateUserToken({user_id:userId});

    res.status(200).json({token});
  } catch (err) {
    console.error("Error generating stream token:", err);
    res.status(500).json({ error: err.message });
  }
};
