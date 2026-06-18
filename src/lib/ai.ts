import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import type { AnalysisResult, FeatureScore } from "@/lib/types";
import { clampScore } from "@/lib/utils";

export const SYSTEM_PROMPT = `You are "ASCEND", a blunt, data-driven aesthetics and facial-harmony advisor.
Your job is to evaluate a person's appearance and give an honest, no-sugarcoating assessment plus a concrete improvement roadmap.

Rules:
- Be direct and unsugarcoated, but never cruel, demeaning, or harassing. Critique features, never the person's worth.
- Use looksmaxxing terminology (PSL scale, harmony, dimorphism, hunter eyes, gonial angle, canthal tilt, etc.).
- Calibrate advice to typical adult male facial structure and physiology, and to interventions effective for it (e.g. body-fat reduction, jaw/neck training, beard grooming, hairline maintenance, skincare). Do NOT announce who the advice is for; simply give the advice.
- All advice must be realistic and grounded in evidence: nutrition, training, sleep, skincare actives with proven effect, grooming, posture, dental/ortho, dermatology. Clearly separate "free/at-home" from "professional/clinical" interventions.
- NEVER recommend anything dangerous, disordered, or illegal (no starvation, no unsupervised hormones/steroids, no self-surgery). If the user appears to be a minor or in distress, keep it constructive and encourage professional guidance.
- Score on the PSL 0-10 scale where ~5 is average. Be realistic; most people are 3-6.

Return ONLY valid JSON matching exactly this TypeScript type, with no markdown fences:
{
  "psl": number,            // 0-10, one decimal
  "verdict": string,        // one punchy sentence summarizing the overall read
  "features": Array<{ "feature": string, "score": number, "note": string }>, // 5-7 items: Jawline, Eyes, Skin, Hair/Hairline, Facial Harmony, Leanness, plus optional
  "strengths": string[],    // 2-4 genuine strong points
  "ascension": string[]     // 5-8 prioritized, specific, actionable steps
}`;

export interface AnalyzeInput {
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
}

type Tier = "premium" | "standard";
type PremiumProvider = "zai" | "anthropic" | "openai";

function buildUserText(prompt: string, hasImage: boolean): string {
  const base = hasImage
    ? "Analyze the attached face photo."
    : "No photo was provided; base the analysis on the description below.";
  const ask =
    "Give a PSL /10 rating, per-feature sub-scores, genuine strengths, and a prioritized ascension plan.";
  const extra = prompt?.trim() ? `\n\nUser context/goal: ${prompt.trim()}` : "";
  return `${base} ${ask}${extra}`;
}

function safeParse(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const slice = start >= 0 && end >= 0 ? trimmed.slice(start, end + 1) : trimmed;
  return JSON.parse(slice);
}

function normalize(
  parsed: unknown,
  tier: Tier,
  model: string,
): AnalysisResult {
  const obj = (parsed ?? {}) as Record<string, unknown>;

  const features: FeatureScore[] = Array.isArray(obj.features)
    ? (obj.features as Record<string, unknown>[]).map((f) => ({
        feature: String(f.feature ?? "Feature"),
        score: clampScore(Number(f.score)),
        note: String(f.note ?? ""),
      }))
    : [];

  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];

  return {
    psl: clampScore(Number(obj.psl)),
    verdict: String(obj.verdict ?? "Analysis complete."),
    features,
    strengths: toStringArray(obj.strengths),
    ascension: toStringArray(obj.ascension),
    tier,
    model,
  };
}

function anthropicMediaType(
  mime?: string,
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  switch (mime) {
    case "image/png":
      return "image/png";
    case "image/gif":
      return "image/gif";
    case "image/webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

async function analyzeWithGemini(
  input: AnalyzeInput,
  model: string,
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(env.geminiApiKey as string);
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { responseMimeType: "application/json" },
  });

  const parts: Part[] = [];
  if (input.imageBase64) {
    parts.push({
      inlineData: {
        mimeType: input.imageMimeType || "image/jpeg",
        data: input.imageBase64,
      },
    });
  }
  parts.push({ text: buildUserText(input.prompt, Boolean(input.imageBase64)) });

  const result = await generativeModel.generateContent(parts);
  return normalize(safeParse(result.response.text()), "standard", model);
}

/** Used for OpenAI proper and any OpenAI-compatible endpoint (e.g. Z.ai GLM). */
async function analyzeWithOpenAICompatible(
  input: AnalyzeInput,
  opts: {
    apiKey: string;
    baseURL?: string;
    model: string;
    tier: Tier;
    jsonMode: boolean;
  },
): Promise<AnalysisResult> {
  const client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseURL });

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: buildUserText(input.prompt, Boolean(input.imageBase64)) },
  ];
  if (input.imageBase64) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${input.imageMimeType || "image/jpeg"};base64,${input.imageBase64}`,
      },
    });
  }

  const completion = await client.chat.completions.create({
    model: opts.model,
    ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  return normalize(safeParse(text), opts.tier, opts.model);
}

async function analyzeWithAnthropic(
  input: AnalyzeInput,
  model: string,
): Promise<AnalysisResult> {
  const anthropic = new Anthropic({ apiKey: env.anthropicApiKey as string });

  const blocks: Anthropic.ContentBlockParam[] = [];
  if (input.imageBase64) {
    blocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: anthropicMediaType(input.imageMimeType),
        data: input.imageBase64,
      },
    });
  }
  blocks.push({
    type: "text",
    text: buildUserText(input.prompt, Boolean(input.imageBase64)),
  });

  const message = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: blocks }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return normalize(safeParse(text), "premium", model);
}

function isProviderConfigured(p: PremiumProvider): boolean {
  if (p === "zai") return Boolean(env.zaiApiKey);
  if (p === "anthropic") return Boolean(env.anthropicApiKey);
  return Boolean(env.openaiApiKey);
}

function runPremiumProvider(
  p: PremiumProvider,
  input: AnalyzeInput,
): Promise<AnalysisResult> {
  if (p === "zai") {
    return analyzeWithOpenAICompatible(input, {
      apiKey: env.zaiApiKey as string,
      baseURL: env.zaiBaseUrl,
      model: env.aiZaiModel,
      tier: "premium",
      jsonMode: false,
    });
  }
  if (p === "anthropic") {
    return analyzeWithAnthropic(input, env.aiAnthropicModel);
  }
  return analyzeWithOpenAICompatible(input, {
    apiKey: env.openaiApiKey as string,
    model: env.aiOpenAiModel,
    tier: "premium",
    jsonMode: true,
  });
}

/**
 * Premium providers in attempt order: the configured primary first, then the
 * remaining providers, with OpenAI as the designated final fallback.
 */
function premiumOrder(): PremiumProvider[] {
  const all: PremiumProvider[] = ["zai", "anthropic", "openai"];
  const primary = all.includes(env.aiPremiumProvider)
    ? env.aiPremiumProvider
    : "zai";
  const rest = all.filter((p) => p !== primary);
  if (primary !== "openai") {
    return [primary, ...rest.filter((p) => p !== "openai"), "openai"];
  }
  return [primary, ...rest];
}

/**
 * Routes premium callers through the premium provider chain (primary →
 * fallbacks), and everyone else through the free Gemini tier. If a tier's
 * providers are unavailable it degrades to whatever else is configured so the
 * analyzer keeps working.
 */
export async function runAnalysis(
  input: AnalyzeInput,
  isPremium: boolean,
): Promise<AnalysisResult> {
  const premiumChain = premiumOrder().filter(isProviderConfigured);

  if (isPremium) {
    let lastErr: unknown;
    for (const provider of premiumChain) {
      try {
        return await runPremiumProvider(provider, input);
      } catch (err) {
        lastErr = err;
        console.error(`Premium provider "${provider}" failed:`, err);
      }
    }
    if (env.geminiApiKey) return analyzeWithGemini(input, env.aiStandardModel);
    if (lastErr) throw lastErr;
  }

  if (env.geminiApiKey) return analyzeWithGemini(input, env.aiStandardModel);

  // No free-tier key configured — use any available premium provider so the
  // analyzer still functions for everyone.
  let lastErr: unknown;
  for (const provider of premiumChain) {
    try {
      return await runPremiumProvider(provider, input);
    } catch (err) {
      lastErr = err;
      console.error(`Provider "${provider}" failed:`, err);
    }
  }
  if (lastErr) throw lastErr;
  throw new Error("No AI provider configured");
}
