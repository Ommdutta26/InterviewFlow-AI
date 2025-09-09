import express from "express";
import { Webhook } from "svix";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const router = express.Router();

router.post("/clerk-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).send("Missing CLERK_WEBHOOK_SECRET");
  }

  const svix_id = req.headers["svix-id"];
  const svix_signature = req.headers["svix-signature"];
  const svix_timestamp = req.headers["svix-timestamp"];

  if (!svix_id || !svix_signature || !svix_timestamp) {
    return res.status(400).send("Missing svix headers");
  }

  const payload = req.body;
  const body = payload.toString("utf8");

  const wh = new Webhook(webhookSecret);

  let evt;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return res.status(400).send("Invalid signature");
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    const name = `${first_name || ""} ${last_name || ""}`.trim();

    try {
      const existingUser = await User.findOne({ clerkId: id });
      if (!existingUser) {
        await User.create({
          clerkId: id,
          email,
          name,
          image: image_url,
          role: "candidate",
        });
      }
      return res.status(200).send("User created");
    } catch (err) {
      console.error("Error saving user:", err);
      return res.status(500).send("Error creating user");
    }
  }

  return res.status(200).send("Webhook received");
});

export default router;
