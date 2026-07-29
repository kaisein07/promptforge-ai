import { Router, type IRouter } from "express";
import { PromptModel, UserModel, ConfigModel } from "@workspace/db";
import type { IPrompt } from "@workspace/db";
import {
  GeneratePromptBody, GetPromptsQueryParams, GetPromptParams, DeletePromptParams,
  ToggleFavoriteParams, SubmitFeedbackParams, SubmitFeedbackBody,
  DuplicatePromptParams,
  GetPromptsResponse, GeneratePromptResponse, GetPromptResponse, DeletePromptResponse,
  ToggleFavoriteResponse, SubmitFeedbackResponse, DuplicatePromptResponse,
} from "@workspace/api-zod";
import { authenticate } from "../middlewares/authenticate";
import { generatePromptWithAI } from "../lib/grok";

const router: IRouter = Router();

const FREE_LIMIT_DEFAULT = 5;

async function getFreeLimit(): Promise<number> {
  const cfg = await ConfigModel.findOne({ key: "free_limit" });
  if (cfg) return parseInt(cfg.value, 10) || FREE_LIMIT_DEFAULT;
  return FREE_LIMIT_DEFAULT;
}

function toPromptJson(p: IPrompt & { id: number }) {
  return {
    id: p.id, userId: p.userId, projectType: p.projectType, niche: p.niche,
    description: p.description, imageUrl: p.imageUrl ?? null, destination: p.destination,
    style: p.style, aiPreference: p.aiPreference ?? null, aiTool: p.aiTool,
    generatedText: p.generatedText, aiTips: p.aiTips ?? null, isFavorite: p.isFavorite,
    feedback: p.feedback ?? null, feedbackComment: p.feedbackComment ?? null,
    createdAt: p.createdAt,
  };
}

// GET /api/prompts
router.get("/prompts", authenticate, async (req, res): Promise<void> => {
  const params = GetPromptsQueryParams.safeParse(req.query);
  const userId = req.user!.userId;
  const { search, favorites } = params.success ? params.data : { search: undefined, favorites: undefined };

  const filter: Record<string, unknown> = { userId };
  if (favorites === "true") filter.isFavorite = true;
  if (search) {
    filter.$or = [
      { description:    { $regex: search, $options: "i" } },
      { projectType:    { $regex: search, $options: "i" } },
      { generatedText:  { $regex: search, $options: "i" } },
    ];
  }

  const prompts = await PromptModel.find(filter).sort({ createdAt: -1 });
  res.json(GetPromptsResponse.parse(prompts.map(toPromptJson)));
});

// POST /api/prompts/generate
router.post("/prompts/generate", authenticate, async (req, res): Promise<void> => {
  const parsed = GeneratePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await UserModel.findOne({ id: req.user!.userId });
  if (!user) {
    res.status(401).json({ error: "Utilisateur introuvable" });
    return;
  }

  const freeLimit = await getFreeLimit();
  if (!user.isPremium && user.promptsUsed >= freeLimit) {
    res.status(402).json({ error: `Limite gratuite atteinte (${freeLimit} prompts). Passez à Premium pour continuer.` });
    return;
  }

  const { projectType, niche, description, imageUrl, destination, style, aiPreference } = parsed.data;
  const result = await generatePromptWithAI({ projectType, niche, description, destination, style, aiPreference });

  const prompt = new PromptModel({
    userId: user.id,
    projectType, niche, description, imageUrl: imageUrl ?? null,
    destination, style, aiPreference: aiPreference ?? null,
    aiTool: result.aiTool,
    generatedText: result.prompt,
    aiTips: result.aiTips,
  });
  await prompt.save();

  await UserModel.findOneAndUpdate({ id: user.id }, { $inc: { promptsUsed: 1 } });

  res.status(201).json(GeneratePromptResponse.parse(toPromptJson(prompt)));
});

// GET /api/prompts/:id
router.get("/prompts/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetPromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  const prompt = await PromptModel.findOne({ id: params.data.id, userId: req.user!.userId });
  if (!prompt) {
    res.status(404).json({ error: "Prompt introuvable" });
    return;
  }
  res.json(GetPromptResponse.parse(toPromptJson(prompt)));
});

// DELETE /api/prompts/:id
router.delete("/prompts/:id", authenticate, async (req, res): Promise<void> => {
  const params = DeletePromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  const deleted = await PromptModel.findOneAndDelete({ id: params.data.id, userId: req.user!.userId });
  if (!deleted) {
    res.status(404).json({ error: "Prompt introuvable" });
    return;
  }
  res.json(DeletePromptResponse.parse({ success: true }));
});

// PATCH /api/prompts/:id/favorite
router.patch("/prompts/:id/favorite", authenticate, async (req, res): Promise<void> => {
  const params = ToggleFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  const current = await PromptModel.findOne({ id: params.data.id, userId: req.user!.userId });
  if (!current) {
    res.status(404).json({ error: "Prompt introuvable" });
    return;
  }
  const updated = await PromptModel.findOneAndUpdate(
    { id: params.data.id },
    { isFavorite: !current.isFavorite },
    { new: true }
  );
  res.json(ToggleFavoriteResponse.parse(toPromptJson(updated!)));
});

// PATCH /api/prompts/:id/feedback
router.patch("/prompts/:id/feedback", authenticate, async (req, res): Promise<void> => {
  const params = SubmitFeedbackParams.safeParse(req.params);
  const body = SubmitFeedbackBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }
  const updated = await PromptModel.findOneAndUpdate(
    { id: params.data.id, userId: req.user!.userId },
    { feedback: body.data.feedback, feedbackComment: body.data.comment ?? null },
    { new: true }
  );
  if (!updated) {
    res.status(404).json({ error: "Prompt introuvable" });
    return;
  }
  res.json(SubmitFeedbackResponse.parse(toPromptJson(updated)));
});

// POST /api/prompts/:id/duplicate
router.post("/prompts/:id/duplicate", authenticate, async (req, res): Promise<void> => {
  const params = DuplicatePromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  const original = await PromptModel.findOne({ id: params.data.id, userId: req.user!.userId });
  if (!original) {
    res.status(404).json({ error: "Prompt introuvable" });
    return;
  }
  const dup = new PromptModel({
    userId: original.userId, projectType: original.projectType, niche: original.niche,
    description: original.description, imageUrl: original.imageUrl,
    destination: original.destination, style: original.style, aiPreference: original.aiPreference,
    aiTool: original.aiTool, generatedText: original.generatedText, aiTips: original.aiTips,
    isFavorite: false,
  });
  await dup.save();
  res.status(201).json(DuplicatePromptResponse.parse(toPromptJson(dup)));
});

export default router;
