import { randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import Activity from "../models/Activity";
import Account from "../models/Account";
import Household from "../models/Household";
import Transaction from "../models/Transaction";
import User from "../models/User";

export function newInviteCode() {
  return randomBytes(6).toString("hex").toUpperCase();
}

export async function ensureHousehold(userId: string) {
  let user = await User.findById(userId);
  if (!user) return null;
  if (user.household) {
    const existing = await Household.findById(user.household);
    if (existing) return { user, household: existing };
  }

  const household = await Household.create({
    name: "Family budget",
    inviteCode: newInviteCode(),
    createdBy: user._id
  });
  const updated = await User.findOneAndUpdate(
    { _id: user._id, $or: [{ household: { $exists: false } }, { household: null }] },
    { $set: { household: household._id } },
    { new: true }
  );
  if (!updated) {
    await Household.deleteOne({ _id: household._id });
    user = await User.findById(userId);
    if (!user?.household) return null;
    const existing = await Household.findById(user.household);
    return existing ? { user, household: existing } : null;
  }

  await Promise.all([
    Account.updateMany({ user: user._id, household: { $exists: false } }, { $set: { household: household._id } }),
    Transaction.updateMany({ user: user._id, household: { $exists: false } }, { $set: { household: household._id } })
  ]);
  return { user: updated, household };
}

export async function recordActivity(
  household: Types.ObjectId,
  user: Types.ObjectId,
  action: "household_created" | "member_joined" | "account_created" | "transaction_created" | "transaction_deleted",
  description: string
) {
  await Activity.create({ household, user, action, description });
}
