import OpenAI from "openai";
import { logger } from "./logger";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.GROK_API_KEY) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
}

export interface GeneratePromptOptions {
  projectType: string;
  niche: string;
  description: string;
  destination: string;
  style: string;
  aiPreference?: string | null;
}

export interface GeneratedResult {
  prompt: string;
  aiTool: string;
  aiTips: string;
}

const AI_TOOL_MAP: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  midjourney: "Midjourney",
  "stable diffusion": "Stable Diffusion",
  dall: "DALL-E 3",
  grok: "Grok",
};

function recommendAiTool(style: string, destination: string): string {
  const styleLower = style.toLowerCase();
  if (styleLower.includes("réaliste") || styleLower.includes("realiste") || styleLower.includes("portrait")) return "Midjourney";
  if (styleLower.includes("cartoon") || styleLower.includes("pixar") || styleLower.includes("manga")) return "DALL-E 3";
  if (styleLower.includes("3d") || styleLower.includes("cinématique")) return "Midjourney";
  const destLower = destination.toLowerCase();
  if (destLower.includes("instagram") || destLower.includes("tiktok")) return "Stable Diffusion";
  return "ChatGPT";
}

function buildSystemPrompt(): string {
  return `Tu es un expert en prompt engineering pour les IA génératives d'images.
Tu génères des prompts professionnels, détaillés et optimisés en ANGLAIS (les prompts IA doivent être en anglais pour de meilleurs résultats).
Réponds toujours avec un JSON valide contenant exactement ces champs:
{
  "prompt": "le prompt complet en anglais",
  "aiTool": "l'outil IA recommandé",
  "aiTips": "conseils en français pour obtenir le meilleur résultat"
}`;
}

function buildUserPrompt(opts: GeneratePromptOptions): string {
  return `Génère un prompt professionnel optimisé pour:
- Type de projet: ${opts.projectType}
- Domaine/Niche: ${opts.niche}
- Description du besoin: ${opts.description}
- Destination finale: ${opts.destination}
- Style souhaité: ${opts.style}
- Préférence IA: ${opts.aiPreference ?? "automatique"}

Inclus dans le prompt: style, éclairage, composition, détails techniques, qualité.
L'outil IA doit être le plus adapté au style et à la destination.
Les conseils (aiTips) doivent mentionner: l'IA recommandée, format, qualité, ratio, et astuces spécifiques.`;
}

function buildFallbackResult(opts: GeneratePromptOptions): GeneratedResult {
  const aiTool = opts.aiPreference && opts.aiPreference !== "auto"
    ? opts.aiPreference
    : recommendAiTool(opts.style, opts.destination);

  const prompt = `Professional ${opts.style.toLowerCase()} style image for ${opts.niche.toLowerCase()} sector, ${opts.projectType.toLowerCase()}, ${opts.description}, designed for ${opts.destination}, high quality, detailed, professional lighting, sharp focus, 8k resolution, masterpiece`;

  const aiTips = `IA recommandée: ${aiTool}. Utilisez un ratio adapté à ${opts.destination} (ex: 1:1 pour Instagram, 16:9 pour YouTube). Activez la qualité maximale (quality: HD) et essayez plusieurs variations (--v 6 pour Midjourney). Ajoutez des références d'artistes ou de styles pour affiner le résultat.`;

  return { prompt, aiTool, aiTips };
}

export async function generatePromptWithAI(opts: GeneratePromptOptions): Promise<GeneratedResult> {
  const grok = getClient();
  if (!grok) {
    logger.warn("GROK_API_KEY not set, using fallback prompt generator");
    return buildFallbackResult(opts);
  }

  try {
    const completion = await grok.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(opts) },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Grok");

    const parsed = JSON.parse(content) as { prompt?: string; aiTool?: string; aiTips?: string };
    return {
      prompt: parsed.prompt ?? buildFallbackResult(opts).prompt,
      aiTool: parsed.aiTool ?? recommendAiTool(opts.style, opts.destination),
      aiTips: parsed.aiTips ?? buildFallbackResult(opts).aiTips,
    };
  } catch (err) {
    logger.error({ err }, "Failed to generate prompt with Grok, using fallback");
    return buildFallbackResult(opts);
  }
}
