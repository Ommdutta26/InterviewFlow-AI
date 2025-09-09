import mongoose from 'mongoose';

const commentSchema=new mongoose.Schema({
  interviewId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Interview',
    required:true,
  },
  content: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  interviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);
