import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import type { AuthRequest } from "../middleware/auth";
import Household from "../models/Household";
import { ensureHousehold, newInviteCode, recordActivity } from "../services/householdService";

function issueToken(userId: string) {
  return jwt.sign({}, process.env.JWT_SECRET!, { subject: userId, expiresIn: "7d" });
}

export async function register(req: Request, res: Response) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const householdName = typeof req.body.householdName === "string" ? req.body.householdName.trim() : "";
  const inviteCode = typeof req.body.inviteCode === "string" ? req.body.inviteCode.trim().toUpperCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  if (password.length < 8 || password.length > 72) return res.status(400).json({ message: "Password must be between 8 and 72 characters." });
  if (Boolean(householdName) === Boolean(inviteCode)) return res.status(400).json({ message: "Create a family space or enter an invite code to join one." });
  if (householdName.length > 60) return res.status(400).json({ message: "Family name must be 60 characters or fewer." });
  if (await User.exists({ email })) return res.status(409).json({ message: "An account with this email already exists." });
  let household = inviteCode ? await Household.findOne({ inviteCode }) : null;
  if (inviteCode && !household) return res.status(404).json({ message: "That invite code was not found. Check the code and try again." });
  let createdUser: ReturnType<typeof User.hydrate> | null = null;
  let createdHouseholdId: string | null = null;
  try {
    createdUser = await User.create({
      email,
      passwordHash: await bcrypt.hash(password, 12),
      ...(household ? { household: household._id } : {})
    });
    if (!inviteCode) {
      household = await Household.create({ name: householdName, inviteCode: newInviteCode(), createdBy: createdUser._id });
      createdHouseholdId = household.id;
      createdUser.household = household._id;
      await createdUser.save();
    }
    if (household) {
      await recordActivity(
        household._id,
        createdUser._id,
        inviteCode ? "member_joined" : "household_created",
        inviteCode ? "Joined the family budget" : `Created the ${household.name} family space`
      );
    }
    return res.status(201).json({ token: issueToken(createdUser.id), user: { id: createdUser.id, email: createdUser.email } });
  } catch (error) {
    if (createdHouseholdId) await Household.deleteOne({ _id: createdHouseholdId });
    if (createdUser) await User.deleteOne({ _id: createdUser._id });
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
    throw error;
  }
}

export async function login(req: Request, res: Response) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  return res.json({ token: issueToken(user.id), user: { id: user.id, email: user.email } });
}

export async function me(req: AuthRequest, res: Response) {
  const membership = await ensureHousehold(req.userId!);
  if (!membership) return res.status(401).json({ message: "Your account could not be found. Please sign in again." });
  return res.json({ user: { id: membership.user.id, email: membership.user.email } });
}
