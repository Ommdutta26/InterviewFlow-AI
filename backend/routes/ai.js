import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

router.post('/ai',async(req,res) => {
  const {transcript,context}=req.body;
  try {
    const geminiResponse=await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [
          {
            parts: [
              {text:`Transcript: ${transcript}\nContext: ${context}`}
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const aiReply=geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
    res.json({ response:aiReply});

  } catch (error) {
    console.error('Gemini API error:', error?.response?.data || error.message);
    res.status(500).json({ response: 'Error connecting to Gemini API.' });
  }
});


router.post("/vapi/create-call",async(req, res) => {
  try {
    const response = await axios.post(
      "https://api.vapi.ai/call",
      {
        assistant: {
          id: process.env.VAPI_AGENT_ID,
        },
        customer: {
          channel: {
            type: "web",
            cli: req.body.cli || "user123", 
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error creating Vapi call:", error.response?.data || error.message);
    res.status(500).json({
      error: "Vapi call creation failed",
      details: error.response?.data || error.message,
    });
  }
});

export default router;
