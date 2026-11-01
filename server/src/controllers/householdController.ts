import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import Household from "../models/Household";
import User from "../models/User";

export async function getHousehold(req: AuthRequest, res: Response) {
  const [household, members] = await Promise.all([
    Household.findById(req.householdId).select("name inviteCode createdAt"),
    User.find({ household: req.householdId }).select("email createdAt").sort({ createdAt: 1 }).lean()
  ]);
  if (!household) return res.status(404).json({ message: "Family space not found." });
  return res.json({
    household,
    members: members.map(member => ({ id: String(member._id), email: member.email }))
  });
}
