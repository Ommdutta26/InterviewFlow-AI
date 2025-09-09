import Comment from "../models/Comment.js";
import Interview from "../models/Interview.js";
import User from "../models/User.js";


export const addComment = async (req, res) => {
  try {
    const {interviewId,content,rating,interviewerId}=req.body;
    const user=await User.findOne({clerkId:interviewerId});
    if (!user) {
      return res.status(404).json({message:'User not found'});
    }

    const newComment=new Comment({
      interviewId,
      content,
      rating,
      interviewerId:user._id,
    });

    await newComment.save();

    res.status(201).json({ message:'Comment added successfully',comment:newComment});
  } catch (error) {
    console.error('Error adding comment:',error);
    res.status(500).json({ message:'Internal server error'});
  }
};

export const getComments=async(req,res)=>{
  try {
    const {interviewId}=req.params;
    const comments=await Comment.find({interviewId}).populate("interviewerId","name email");
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({error:err.message});
  }
};
