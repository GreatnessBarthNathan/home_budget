import { Schema, model } from "mongoose";

const householdSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  inviteCode: { type: String, required: true, unique: true, uppercase: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default model("Household", householdSchema);
