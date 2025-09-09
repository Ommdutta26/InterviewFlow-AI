// utils/api.js
import axios from 'axios';

export const sendToAI = async ({ transcript, context }) => {
  try {
    const res = await axios.post('http://localhost:5000/api/ai', {
      transcript,
      context,
    });

    return res.data.response;
  } catch (err) {
    console.error('AI API error:', err);
    return 'Sorry, something went wrong with AI.';
  }
};
