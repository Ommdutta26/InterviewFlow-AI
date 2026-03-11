import Groq from "groq-sdk";
import pdf from "pdf-parse-fixed";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const analyzeResume = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Resume not uploaded" });
    }

    // ✅ Parse PDF correctly
    const pdfData = await pdf(file.buffer);
    const text = pdfData.text;

    if (!text || text.length < 20) {
      return res.status(400).json({
        message: "Could not extract text from resume",
      });
    }

    const prompt = `
You are an AI resume analyzer.

Extract the candidate's technical skills and give a resume score out of 100.

Return ONLY valid JSON like:

{
 "skills": ["skill1","skill2"],
 "score": number
}

Resume:
${text}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const response = completion.choices[0].message.content;

    // ✅ Extract JSON safely
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({
        message: "AI response not valid JSON",
        raw: response,
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    res.json(result);

  } catch (error) {
    console.error("Resume Analysis Error:", error);

    res.status(500).json({
      message: "Error analyzing resume",
      error: error.message,
    });
  }
};

export const generateInterviewPrep = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Resume not uploaded" });
    }

    // parse resume
    const pdfData = await pdf(file.buffer);
    const text = pdfData.text;

    if (!text || text.length < 20) {
      return res.status(400).json({
        message: "Could not extract text from resume",
      });
    }

    const prompt = `
You are a senior technical interviewer.

Analyze the following resume and generate interview preparation.

Return ONLY valid JSON in this format:

{
 "skills": ["skill1","skill2"],
 "resume_score": number,
 "interview_questions":[
   {
     "question":"question",
     "answer":"answer"
   }
 ],
 "resume_feedback":[
   "feedback1",
   "feedback2"
 ]
}

Instructions:
- Extract key technical skills
- Generate 12–15 technical interview questions based on skills
- Provide clear answers
- Rate resume out of 100
- Give actionable improvement suggestions

Resume:
${text}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;

    // extract JSON safely
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({
        message: "AI response not valid JSON",
        raw: response,
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    res.json(result);

  } catch (error) {
    console.error("Tech Prep Error:", error);

    res.status(500).json({
      message: "Error generating interview preparation",
      error: error.message,
    });
  }
};

export const generateCodingQuestion = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        message: "Programming language required",
      });
    }

    const prompt = `
You are a senior software engineering interviewer.

Generate ONE coding interview question for ${language}.

Return ONLY valid JSON.

Format:
{
 "question": "coding problem description",
 "starterCode": "basic function template"
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
    });

    let response = completion.choices[0].message.content;

    // remove markdown blocks if present
    response = response.replace(/```json/g, "").replace(/```/g, "").trim();

    // extract JSON safely
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({
        message: "Invalid AI response",
        raw: response,
      });
    }

    let result;

    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);

      return res.status(500).json({
        message: "Failed to parse AI JSON",
        raw: jsonMatch[0],
      });
    }

    res.json(result);

  } catch (error) {
    console.error("Generate Question Error:", error);

    res.status(500).json({
      message: "Failed to generate coding question",
      error: error.message,
    });
  }
};


export const evaluateCodeSolution = async (req, res) => {
  try {
    const { question, code, language } = req.body;

    if (!question || !code) {
      return res.status(400).json({
        message: "Question and code are required",
      });
    }

    const prompt = `
You are a senior software engineering interviewer.

Evaluate the candidate's coding solution.

Return ONLY JSON:

{
 "score": number,
 "correctness": "Good | Average | Poor",
 "time_complexity": "",
 "feedback": "",
 "improvements": ["point1","point2"]
}

Programming Language: ${language}

Question:
${question}

Candidate Code:
${code}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const response = completion.choices[0].message.content;

    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({
        message: "Invalid AI response",
        raw: response,
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    res.json(result);

  } catch (error) {
    console.error("Code Evaluation Error:", error);

    res.status(500).json({
      message: "Failed to evaluate code",
      error: error.message,
    });
  }
};