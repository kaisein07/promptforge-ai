import mongoose, { Schema, type HydratedDocument } from "mongoose";
import { getNextId } from "./Counter";

const userSchema = new Schema(
  {
    id:           { type: Number, unique: true, index: true },
    name:         { type: String, required: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, default: "user", enum: ["user", "admin"] },
    isPremium:    { type: Boolean, default: false },
    promptsUsed:  { type: Number, default: 0 },
    createdAt:    { type: Date, default: () => new Date() },
  },
  { id: false, versionKey: false }
);

userSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextId("users");
  }
  next();
});

export type IUser = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  isPremium: boolean;
  promptsUsed: number;
  createdAt: Date;
};

export type UserDoc = HydratedDocument<IUser>;

export const UserModel =
  (mongoose.models["User"] as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
