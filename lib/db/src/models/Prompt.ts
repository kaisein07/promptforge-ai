import mongoose, { Schema, type HydratedDocument } from "mongoose";
import { getNextId } from "./Counter";

const promptSchema = new Schema(
  {
    id:             { type: Number, unique: true, index: true },
    userId:         { type: Number, required: true, index: true },
    projectType:    { type: String, required: true },
    niche:          { type: String, required: true },
    description:    { type: String, required: true },
    imageUrl:       { type: String, default: null },
    destination:    { type: String, required: true },
    style:          { type: String, required: true },
    aiPreference:   { type: String, default: null },
    aiTool:         { type: String, default: "ChatGPT" },
    generatedText:  { type: String, required: true },
    aiTips:         { type: String, default: null },
    isFavorite:     { type: Boolean, default: false },
    feedback:       { type: String, default: null },
    feedbackComment:{ type: String, default: null },
    createdAt:      { type: Date, default: () => new Date() },
  },
  { id: false, versionKey: false }
);

promptSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextId("prompts");
  }
  next();
});

export type IPrompt = {
  id: number;
  userId: number;
  projectType: string;
  niche: string;
  description: string;
  imageUrl: string | null;
  destination: string;
  style: string;
  aiPreference: string | null;
  aiTool: string;
  generatedText: string;
  aiTips: string | null;
  isFavorite: boolean;
  feedback: string | null;
  feedbackComment: string | null;
  createdAt: Date;
};

export type PromptDoc = HydratedDocument<IPrompt>;

export const PromptModel =
  (mongoose.models["Prompt"] as mongoose.Model<IPrompt>) ||
  mongoose.model<IPrompt>("Prompt", promptSchema);
