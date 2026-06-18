import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import OpenAI from "openai";
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
  tier: "premium" | "standard",
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

async function analyzeWithGemini(input: AnalyzeInput): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(env.geminiApiKey as string);
  const model = genAI.getGenerativeModel({
    model: env.aiStandardModel,
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

  const result = await model.generateContent(parts);
  return normalize(safeParse(result.response.text()), "standard", env.aiStandardModel);
}

async function analyzeWithOpenAI(input: AnalyzeInput): Promise<AnalysisResult> {
  const openai = new OpenAI({ apiKey: env.openaiApiKey });

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

  const completion = await openai.chat.completions.create({
    model: env.aiPremiumModel,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  return normalize(safeParse(text), "premium", env.aiPremiumModel);
}

/**
 * Routes to the premium model when the caller is premium and OpenAI is set up,
 * otherwise falls back to the standard (free) Gemini model.
 */
export async function runAnalysis(
  input: AnalyzeInput,
  isPremium: boolean,
): Promise<AnalysisResult> {
  const wantsPremium = isPremium && Boolean(env.openaiApiKey);
  if (wantsPremium) return analyzeWithOpenAI(input);
  if (env.geminiApiKey) return analyzeWithGemini(input);
  if (env.openaiApiKey) return analyzeWithOpenAI(input);
  throw new Error("No AI provider configured");
}
