import axios from "axios";

export const findJobs = async (req, res) => {
  try {
    const { skills } = req.body;

    const queries = [];

    if (skills.includes("Machine Learning") || skills.includes("LangChain")) {
      queries.push("generative ai engineer", "machine learning engineer");
    }

    if (skills.includes("React.js") || skills.includes("Next.js")) {
      queries.push("react developer");
    }

    if (skills.includes("Node.js")) {
      queries.push("backend developer node");
    }

    if (skills.includes("Python")) {
      queries.push("python developer");
    }

    if (queries.length === 0) {
      queries.push("software engineer");
    }

    const requests = queries.map((query) =>
      axios.get("https://jsearch.p.rapidapi.com/search", {
        params: {
          query,
          page: "1",
          num_pages: "1",
        },
        headers: {
          "X-RapidAPI-Key": process.env.RAPID_API_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      })
    );

    const responses = await Promise.all(requests);

    let jobs = responses.flatMap((res) => res.data.data);

    const uniqueJobs = Array.from(
      new Map(jobs.map((job) => [job.job_id, job])).values()
    );

    res.json({
      jobs: uniqueJobs.slice(0, 4),
    });

  } catch (error) {
    console.error("Job Search Error:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};