import { Schema, model } from "mongoose";

const categorySchema = new Schema({
  household: { type: Schema.Types.ObjectId, ref: "Household", required: true },
  name: { type: String, required: true, trim: true, maxlength: 30 },
  normalizedName: { type: String, required: true },
  systemKey: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.index(
  { household: 1, normalizedName: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
categorySchema.index(
  { household: 1, systemKey: 1 },
  { unique: true, partialFilterExpression: { systemKey: { $exists: true } } }
);

export default model("Category", categorySchema);
