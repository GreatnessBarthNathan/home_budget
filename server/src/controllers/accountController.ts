import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import Account from "../models/Account";
import Transaction from "../models/Transaction";
import mongoose from "mongoose";
import { recordActivity } from "../services/householdService";

const types = ["Checking", "Savings", "Credit card", "Cash", "Other"];

export async function listAccounts(req: AuthRequest, res: Response) {
  let end = new Date();
  if (typeof req.query.month === "string") {
    if (!/^\d{4}-\d{2}$/.test(req.query.month)) return res.status(400).json({ message: "Choose a valid month." });
    const [year, month] = req.query.month.split("-").map(Number);
    if (month < 1 || month > 12) return res.status(400).json({ message: "Choose a valid month." });
    end = new Date(Date.UTC(year, month, 1));
  }
  const [accounts, balances] = await Promise.all([
    Account.find({ household: req.householdId }).sort({ createdAt: 1 }).lean(),
    Transaction.aggregate([
      { $match: { household: new mongoose.Types.ObjectId(req.householdId), date: { $lt: end } } },
      { $group: {
        _id: "$account",
        net: { $sum: { $multiply: ["$amount", { $cond: [{ $eq: ["$kind", "income"] }, 1, -1] }] } }
      } }
    ])
  ]);
  const netByAccount = new Map(balances.map((item: { _id: unknown; net: number }) => [String(item._id), item.net]));
  const accountsWithBalances = accounts.map(account => ({
    ...account,
    monthEndBalance: account.openingBalance + (netByAccount.get(String(account._id)) ?? 0)
  }));
  return res.json({ accounts: accountsWithBalances });
}

export async function createAccount(req: AuthRequest, res: Response) {
  const { name, type, openingBalance, color } = req.body;
  if (typeof name !== "string" || !name.trim()) return res.status(400).json({ message: "Enter an account name." });
  if (type !== undefined && !types.includes(type)) return res.status(400).json({ message: "Choose a valid account type." });
  if (typeof openingBalance !== "number" || !Number.isFinite(openingBalance)) return res.status(400).json({ message: "Enter a valid starting balance." });
  if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) return res.status(400).json({ message: "Choose a valid account color." });
  const account = await Account.create({
    household: req.householdId,
    user: req.userId,
    name: name.trim(),
    type: type ?? "Checking",
    openingBalance,
    color
  });
  await recordActivity(
    new mongoose.Types.ObjectId(req.householdId),
    new mongoose.Types.ObjectId(req.userId),
    "account_created",
    `Added the ${account.name} ${account.type.toLowerCase()} account`
  );
  return res.status(201).json({ account });
}
