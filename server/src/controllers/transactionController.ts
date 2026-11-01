import mongoose from "mongoose";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import Account from "../models/Account";
import Transaction from "../models/Transaction";
import { recordActivity } from "../services/householdService";

const categories = ["Housing", "Utilities", "Groceries", "Transport", "Dining", "Shopping", "Health", "Entertainment", "Other", "Income"];

export async function listTransactions(req: AuthRequest, res: Response) {
  const filter: Record<string, unknown> = { household: req.householdId };
  if (typeof req.query.month === "string") {
    if (!/^\d{4}-\d{2}$/.test(req.query.month)) return res.status(400).json({ message: "Choose a valid month." });
    const [year, month] = req.query.month.split("-").map(Number);
    if (month < 1 || month > 12) return res.status(400).json({ message: "Choose a valid month." });
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    filter.date = { $gte: start, $lt: end };
  }
  const transactions = await Transaction.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .populate("user", "email")
    .lean();
  return res.json({ transactions });
}

export async function createTransaction(req: AuthRequest, res: Response) {
  const { description, amount, kind, category, account, date, note } = req.body;
  if (typeof description !== "string" || !description.trim()) return res.status(400).json({ message: "Enter a transaction description." });
  if (description.trim().length > 100) return res.status(400).json({ message: "Description must be 100 characters or fewer." });
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Amount must be greater than zero." });
  if (kind !== "expense" && kind !== "income") return res.status(400).json({ message: "Choose expense or income." });
  if (typeof category !== "string" || !categories.includes(category) || (kind === "income" && category !== "Income") || (kind === "expense" && category === "Income")) return res.status(400).json({ message: "Choose a valid category." });
  if (typeof account !== "string" || !mongoose.isValidObjectId(account)) return res.status(400).json({ message: "Choose a valid account." });
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Choose a valid transaction date." });
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return res.status(400).json({ message: "Choose a valid transaction date." });
  if (note !== undefined && (typeof note !== "string" || note.length > 200)) return res.status(400).json({ message: "Note must be 200 characters or fewer." });
  const ownedAccount = await Account.exists({ _id: account, household: req.householdId });
  if (!ownedAccount) return res.status(404).json({ message: "That account could not be found." });
  const transaction = await Transaction.create({
    household: req.householdId,
    user: req.userId,
    account,
    description: description.trim(),
    amount,
    kind,
    category,
    date: new Date(`${date}T12:00:00.000Z`),
    note
  });
  await recordActivity(
    new mongoose.Types.ObjectId(req.householdId),
    new mongoose.Types.ObjectId(req.userId),
    "transaction_created",
    `${kind === "expense" ? "Added expense" : "Recorded income"}: ${transaction.description}`
  );
  return res.status(201).json({ transaction });
}

export async function deleteTransaction(req: AuthRequest, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid transaction." });
  const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, household: req.householdId });
  if (!transaction) return res.status(404).json({ message: "Transaction not found." });
  await recordActivity(
    new mongoose.Types.ObjectId(req.householdId),
    new mongoose.Types.ObjectId(req.userId),
    "transaction_deleted",
    `Deleted ${transaction.kind}: ${transaction.description}`
  );
  return res.json({ message: "Transaction deleted." });
}
