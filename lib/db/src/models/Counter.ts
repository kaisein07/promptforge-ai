import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema(
  { _id: { type: String }, seq: { type: Number, default: 0 } },
  { _id: false, versionKey: false }
);

// re-use model if already compiled (hot-reload safety)
const Counter =
  (mongoose.models["Counter"] as mongoose.Model<{ _id: string; seq: number }>) ||
  mongoose.model<{ _id: string; seq: number }>("Counter", counterSchema);

export async function getNextId(name: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc!.seq;
}
