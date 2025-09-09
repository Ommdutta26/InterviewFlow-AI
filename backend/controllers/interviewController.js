import Interview from "../models/Interview.js";


export const getAllInterviews=async(req,res)=>{
  try {
    const interviews=await Interview.find();
    res.status(200).json(interviews);
  } catch (err) {
    res.status(500).json({error:err.message});
  }
};

export const getMyInterviews=async(req,res)=>{
  try {
    const {candidateId}=req.params;
    const interviews=await Interview.find({candidateId});
    res.status(200).json(interviews);
  } catch (err) {
    res.status(500).json({error:err.message});
  }
};

export const getInterviewByStreamCallId=async(req, res)=>{
  try {
    const { streamCallId } = req.params;
    const interview = await Interview.findOne({ streamCallId });
    if (!interview) return res.status(404).json({ message: "Not found" });
    res.status(200).json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const createInterview=async(req,res)=>{
  console.log("Creating interview with body:", req.body);
  try {
    const {
      title,
      description,
      startTime,
      status,
      streamCallId,
      candidateId,
      interviewerIds,
    }=req.body;

    const newInterview=new Interview({
      title,
      description,
      startTime,
      status,
      streamCallId,
      candidateId,
      interviewerIds,
    });

    await newInterview.save();
    res.status(201).json(newInterview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInterviewStatus=async(req,res)=>{
  try {
    const {id}=req.params;
    const {status}=req.body;
    const updateData={status}

    if (status==="completed") {
      updateData.endTime= Date.now();
    }

    const updated=await Interview.findByIdAndUpdate(id, updateData,{
      new:true,
    });

    if (!updated) return res.status(404).json({message:"Interview not found"});

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({error:err.message});
  }
};

export const updatePassStatus=async(req,res)=>{
  const {id}=req.params;
  const {passStatus}=req.body;

  if (!['pass', 'fail', 'pending'].includes(passStatus)) {
    return res.status(400).json({ error: "Invalid pass status" });
  }

  try {
    const interview = await Interview.findByIdAndUpdate(
      id,
      {passStatus},
      {new:true}
    );
    if (!interview) {
      return res.status(404).json({error:"Interview not found"});
    }
    res.status(200).json(interview);
  } catch (error) {
    console.error("Failed to update pass status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};