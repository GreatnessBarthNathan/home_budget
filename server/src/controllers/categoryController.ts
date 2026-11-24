import type { Response } from "express";
import mongoose from "mongoose";
import type { AuthRequest } from "../middleware/auth";
import Category from "../models/Category";
import Transaction from "../models/Transaction";

const defaultCategories = [
  { key: "housing", name: "Housing" },
  { key: "utilities", name: "Utilities" },
  { key: "groceries", name: "Groceries" },
  { key: "transport", name: "Transport" },
  { key: "dining", name: "Dining" },
  { key: "shopping", name: "Shopping" },
  { key: "health", name: "Health" },
  { key: "entertainment", name: "Entertainment" },
  { key: "other", name: "Other" },
  { key: "income", name: "Income" }
];

function categoryResponse(category: {
  _id: unknown;
  name: string;
  systemKey?: string | null;
}) {
  return {
    _id: String(category._id),
    name: category.name,
    isDefault: Boolean(category.systemKey),
    isIncome: category.systemKey === "income"
  };
}

function validName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 30;
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

async function ensureDefaultCategory(key: string, name: string, householdId: string | undefined) {
  try {
    await Category.updateOne(
      { household: householdId, systemKey: key },
      {
        $setOnInsert: {
          household: householdId,
          systemKey: key,
          name,
          normalizedName: name.toLowerCase(),
          isActive: true
        }
      },
      { upsert: true }
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
}

export async function listCategories(req: AuthRequest, res: Response) {
  await Promise.all(defaultCategories.map(({ key, name }) =>
    ensureDefaultCategory(key, name, req.householdId)
  ));
  const categories = await Category.find({
    household: req.householdId,
    isActive: true
  }).sort({ name: 1 }).lean();
  return res.json({ categories: categories.map(categoryResponse) });
}

export async function createCategory(req: AuthRequest, res: Response) {
  const { name } = req.body;
  if (!validName(name)) return res.status(400).json({ message: "Enter a category name of 1 to 30 characters." });
  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLowerCase();
  const duplicate = await Category.exists({
    household: req.householdId,
    normalizedName,
    isActive: true
  });
  if (duplicate) return res.status(409).json({ message: "A category with that name already exists." });

  let category;
  try {
    category = await Category.create({
      household: req.householdId,
      name: trimmedName,
      normalizedName
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) return res.status(409).json({ message: "A category with that name already exists." });
    throw error;
  }
  return res.status(201).json({ category: categoryResponse(category) });
}

export async function updateCategory(req: AuthRequest, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid category." });
  const { name } = req.body;
  if (!validName(name)) return res.status(400).json({ message: "Enter a category name of 1 to 30 characters." });

  const category = await Category.findOne({
    _id: req.params.id,
    household: req.householdId,
    isActive: true
  });
  if (!category) return res.status(404).json({ message: "Category not found." });
  if (category.systemKey === "income") {
    return res.status(400).json({ message: "The Income category is required and cannot be changed." });
  }

  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLowerCase();
  const duplicate = await Category.exists({
    household: req.householdId,
    normalizedName,
    isActive: true,
    _id: { $ne: category._id }
  });
  if (duplicate) return res.status(409).json({ message: "A category with that name already exists." });

  const previousName = category.name;
  category.name = trimmedName;
  category.normalizedName = normalizedName;
  try {
    await category.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) return res.status(409).json({ message: "A category with that name already exists." });
    throw error;
  }
  await Transaction.updateMany(
    { household: req.householdId, category: previousName },
    { $set: { category: trimmedName } }
  );
  return res.json({ category: categoryResponse(category) });
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid category." });
  const category = await Category.findOne({
    _id: req.params.id,
    household: req.householdId,
    isActive: true
  });
  if (!category) return res.status(404).json({ message: "Category not found." });
  if (category.systemKey === "income") {
    return res.status(400).json({ message: "The Income category is required and cannot be deleted." });
  }

  const expenseCategories = await Category.countDocuments({
    household: req.householdId,
    isActive: true,
    systemKey: { $ne: "income" }
  });
  if (expenseCategories <= 1) {
    return res.status(400).json({ message: "Keep at least one expense category." });
  }

  category.isActive = false;
  await category.save();
  return res.json({ message: "Category deleted." });
}
