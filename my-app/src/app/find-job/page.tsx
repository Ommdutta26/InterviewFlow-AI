"use client";

import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/constants";
interface Job {
  job_title: string;
  employer_name: string;
  job_city: string;
  job_apply_link: string;
}

export default function FindJobPage() {
  const [resume, setResume] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!resume) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("resume", resume);

    try {
      const res = await axios.post(`${BASE_URL}/api/resume/analyze`, formData);

      setSkills(res.data.skills);
      setScore(res.data.score);

      const jobRes = await axios.post(`${BASE_URL}/api/find-jobs`, {
        skills: res.data.skills,
      });
      console.log("SKILLS SENT:", res.data.skills);
      console.log("JOB RESPONSE:", jobRes.data);
      setJobs(jobRes.data.jobs);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-8 text-center">
          AI Resume Job Finder 🚀
        </h1>

        {/* Upload Resume */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 mb-10">
          <h2 className="text-xl mb-4 font-semibold">Upload Resume</h2>

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
            className="mb-4"
          />

          <button
            onClick={handleUpload}
            className="bg-emerald-500 px-6 py-2 rounded-lg font-semibold hover:bg-emerald-600"
          >
            Analyze Resume
          </button>
        </div>

        {loading && (
          <p className="text-center text-gray-400">Analyzing Resume...</p>
        )}

        {/* Resume Score */}
        {score && (
          <div className="mb-10 bg-slate-900 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-3">Resume Score</h2>

            <div className="text-5xl font-bold text-emerald-400">
              {score}/100
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-10 bg-slate-900 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Extracted Skills</h2>

            <div className="flex flex-wrap gap-3">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-emerald-500/20 px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Jobs */}
        {jobs.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Recommended Jobs</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, index) => (
                <div
                  key={index}
                  className="bg-slate-900 p-6 rounded-xl border border-slate-700"
                >
                  <h3 className="text-lg font-semibold">
                    {job.job_title}
                  </h3>

                  <p className="text-gray-400 mt-2">
                    {job.employer_name}
                  </p>

                  <p className="text-gray-500 text-sm mt-1">
                    {job.job_city}
                  </p>

                  <a
                    href={job.job_apply_link}
                    target="_blank"
                    className="inline-block mt-4 bg-emerald-500 px-4 py-2 rounded-lg"
                  >
                    Apply
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}