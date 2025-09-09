import { getAuth } from "@clerk/express";

const authMiddleware=(req,res,next)=>{
  const {userId}=getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user={id:userId};
  next();
};

export default authMiddleware;
