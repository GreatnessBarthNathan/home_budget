import { Schema, model } from "mongoose";

const accountSchema = new Schema({
  household: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true, maxlength: 50 },
  type: { type: String, enum: ["Checking", "Savings", "Credit card", "Cash", "Other"], default: "Checking" },
  openingBalance: { type: Number, required: true },
  color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ }
}, { timestamps: true });

export default model("Account", accountSchema);
