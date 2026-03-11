"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { BASE_URL } from "@/constants";

export default function TechPrepPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return alert("Please upload a resume");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/resume/prep-interview`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setData(res.data);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <h1 className="text-4xl font-bold mb-6">
          AI Tech Interview Preparation
        </h1>

        <p className="text-gray-400 mb-8">
          Upload your resume and get AI-generated interview questions,
          answers, resume score, and improvement suggestions.
        </p>

        {/* Upload Section */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl mb-10">

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4"
          />

          <button
            onClick={handleUpload}
            className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            Analyze Resume
          </button>
        </div>

        {/* Results */}
        {data && (
          <div className="space-y-10">

            {/* Resume Score */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold mb-2">
                Resume Score
              </h2>

              <p className="text-3xl font-bold text-emerald-400">
                {data.resume_score}/100
              </p>
            </div>

            {/* Skills */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold mb-4">
                Detected Skills
              </h2>

              <div className="flex flex-wrap gap-3">
                {data.skills?.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="bg-emerald-500/20 px-3 py-1 rounded-lg text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Interview Questions */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold mb-6">
                AI Generated Interview Questions
              </h2>

              <div className="space-y-6">
                {data.interview_questions?.map((q: any, i: number) => (
                  <div
                    key={i}
                    className="border border-white/10 rounded-lg p-4"
                  >
                    <p className="font-semibold text-lg mb-2">
                      Q{i + 1}. {q.question}
                    </p>

                    <p className="text-gray-300">
                      {q.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resume Feedback */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold mb-4">
                Resume Improvement Suggestions
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                {data.resume_feedback?.map((f: string, i: number) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}