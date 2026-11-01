import { Schema, model } from "mongoose";

const activitySchema = new Schema({
  household: { type: Schema.Types.ObjectId, ref: "Household", required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["household_created", "member_joined", "account_created", "transaction_created", "transaction_deleted"], required: true },
  description: { type: String, required: true, maxlength: 240 },
  createdAt: { type: Date, default: Date.now }
});

activitySchema.index({ household: 1, createdAt: -1 });
export default model("Activity", activitySchema);
