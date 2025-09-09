import mongoose from "mongoose";

const interviewSchema=new mongoose.Schema({
  title: {type:String, required:true},
  description: {type:String},
  startTime: {type:Number, required:true},
  status: {type:String, required:true},
  streamCallId: {type:String, required:true },
  candidateId: {type:String, required:true },
  interviewerIds:[{type:String, required:true}], 
  passStatus:{
    type:String,
    enum:["pass","fail","pending"],
    default:"pending"
  
  }
})
const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;
