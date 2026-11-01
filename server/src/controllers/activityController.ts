import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import Activity from "../models/Activity";

export async function listActivity(req: AuthRequest, res: Response) {
  const filter: Record<string, unknown> = { household: req.householdId };
  if (typeof req.query.month === "string") {
    if (!/^\d{4}-\d{2}$/.test(req.query.month)) return res.status(400).json({ message: "Choose a valid month." });
    const [year, month] = req.query.month.split("-").map(Number);
    if (month < 1 || month > 12) return res.status(400).json({ message: "Choose a valid month." });
    filter.createdAt = { $gte: new Date(Date.UTC(year, month - 1, 1)), $lt: new Date(Date.UTC(year, month, 1)) };
  }
  const activities = await Activity.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("user", "email")
    .lean();
  return res.json({ activities });
}
