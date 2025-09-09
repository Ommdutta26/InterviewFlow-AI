

export const createCall=async(req,res)=>{
  const {id,hostId}=req.body;
  res.status(200).json({id,hostId});
};

export const getCallById=async(req,res)=>{
  const {id}=req.params;
  res.status(200).json({id});
};