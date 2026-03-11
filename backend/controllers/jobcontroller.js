import axios from "axios";

export const findJobs = async (req, res) => {
  try {
    const { skills } = req.body;

    // Convert skills array into search query
    const query = skills.slice(0, 6).join(" ");

    const options = {
      method: "GET",
      url: "https://jsearch.p.rapidapi.com/search",
      params: {
        query: query,
        page: "1",
        num_pages: "1",
      },
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);

    res.json({
      jobs: response.data.data,
    });

  } catch (error) {
    console.error("Job Search Error:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};