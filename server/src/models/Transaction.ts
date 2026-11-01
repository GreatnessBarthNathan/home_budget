import { Schema, model } from "mongoose";

const transactionSchema = new Schema({
  household: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  account: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  description: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0.01 },
  kind: { type: String, enum: ["expense", "income"], required: true },
  category: { type: String, required: true, maxlength: 30 },
  date: { type: Date, required: true },
  note: { type: String, maxlength: 200 }
}, { timestamps: true });

transactionSchema.index({ household: 1, date: -1 });
export default model("Transaction", transactionSchema);
