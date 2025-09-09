import User from "../models/User.js";


export const syncUser=async (req, res) => {
  try {
    const {name,email,clerkId,image}=req.body;
    let user = await User.findOne({clerkId});
    if (user) {
      return res.status(200).json({
        message: "User already exists",
        role: user.role,
        user,
      });
    }

    const newUser=new User({name,email,clerkId,image});
    const savedUser=await newUser.save();

    res.status(201).json({
      message: "User synced successfully",
      role: savedUser.role,
      user: savedUser,
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getUserByClerkId = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
