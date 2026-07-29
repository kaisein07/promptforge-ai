import mongoose, { Schema } from "mongoose";

const configSchema = new Schema(
  {
    key:       { type: String, required: true, unique: true },
    value:     { type: String, required: true },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { id: false, versionKey: false }
);

export type IConfig = { key: string; value: string; updatedAt: Date };

export const ConfigModel =
  (mongoose.models["Config"] as mongoose.Model<IConfig>) ||
  mongoose.model<IConfig>("Config", configSchema);
