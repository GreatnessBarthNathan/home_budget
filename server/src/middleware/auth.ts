import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ensureHousehold } from "../services/householdService";

export type AuthRequest = Request & { userId?: string; householdId?: string };

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Please sign in to continue." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    if (typeof payload.sub !== "string" || !mongoose.isValidObjectId(payload.sub)) {
      return res.status(401).json({ message: "Your session is invalid. Please sign in again." });
    }
    const membership = await ensureHousehold(payload.sub);
    if (!membership) return res.status(401).json({ message: "Your account could not be found. Please sign in again." });
    req.userId = payload.sub;
    req.householdId = membership.household.id;
    return next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
