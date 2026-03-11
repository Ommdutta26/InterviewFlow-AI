"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { BASE_URL } from "@/constants";
import { Loader2 } from "lucide-react";

export default function MockCodingInterview() {

  const [language, setLanguage] = useState("javascript");
  const [question, setQuestion] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [time, setTime] = useState(1800); // 30 min timer

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (t: number) => {
    const min = Math.floor(t / 60);
    const sec = t % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // Generate AI question
  const generateQuestion = async () => {
    try {
      setLoading(true);

      const res = await axios.post(`${BASE_URL}/api/resume/generate-coding-question`, {
        language,
      });

      setQuestion(res.data.question);
      setCode(res.data.starterCode || "");
      setResult(null);

    } catch (error) {
      console.error(error);
      alert("Failed to generate question");
    } finally {
      setLoading(false);
    }
  };

  // Evaluate solution
  const evaluateCode = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/resume/evaluate-code`, {
        question,
        code,
        language,
      });

      setResult(res.data);

    } catch (error) {
      console.error(error);
      alert("Evaluation failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold">
          AI Mock Coding Interview
        </h1>

        <div className="text-red-400 font-semibold text-lg">
          ⏱ {formatTime(time)}
        </div>

      </div>

      {/* Controls */}
      <div className="mb-6 flex gap-4 items-center">

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-white/10 border border-white/20 p-2 rounded-lg"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>

        <button
          onClick={generateQuestion}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg flex items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />}
          {loading ? "Generating..." : "Generate Question"}
        </button>

      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-2 gap-6">

        {/* Question Panel */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl border border-white/10 shadow-lg">

          {question ? (
            <>
              <div className="flex justify-between items-center mb-4">

                <div className="flex gap-3">
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs">
                    Medium
                  </span>

                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs">
                    Binary Tree
                  </span>
                </div>

                <button
                  onClick={() => navigator.clipboard.writeText(question)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Copy
                </button>

              </div>

              <h2 className="font-semibold mb-3 text-lg">
                Question
              </h2>

              <p className="text-gray-300 leading-relaxed">
                {question}
              </p>

            </>
          ) : (
            <p className="text-gray-400">
              Generate a question to start the interview.
            </p>
          )}

        </div>

        {/* Editor Panel */}
        <div className="flex flex-col">

          {question && (
            <>
              <Editor
                height="400px"
                language={language}
                value={code}
                theme="vs-dark"
                onChange={(value) => setCode(value || "")}
                options={{
                  fontSize: 15,
                  minimap: { enabled: false },
                  fontFamily: "Fira Code",
                }}
              />

              {/* Buttons */}
              <div className="flex gap-4 mt-4">

                <button
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                >
                  Run Code
                </button>

                <button
                  onClick={evaluateCode}
                  className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg"
                >
                  Submit Solution
                </button>

              </div>
            </>
          )}

        </div>

      </div>

      {/* Evaluation */}
      {result && (
        <div className="mt-8 bg-white/5 p-6 rounded-xl border border-white/10">

          <h2 className="text-xl font-semibold mb-4">
            AI Evaluation
          </h2>

          {/* Score Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">

            <div className="bg-white/5 p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm">Score</p>
              <p className="text-xl font-bold">
                {result.score}/10
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm">Correctness</p>
              <p className="text-xl font-bold">
                {result.correctness}
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm">Time Complexity</p>
              <p className="text-xl font-bold">
                {result.time_complexity}
              </p>
            </div>

          </div>

          {/* Feedback */}
          <p className="text-gray-300 mb-4">
            {result.feedback}
          </p>

          {/* Improvements */}
          {result.improvements && (
            <>
              <h3 className="font-semibold mb-2">
                Improvements
              </h3>

              <ul className="list-disc pl-6 text-gray-300">
                {result.improvements.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          )}

        </div>
      )}

    </div>
  );
}