import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/ai";
import { isAnyAiConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  if (!isAnyAiConfigured) {
    return NextResponse.json(
      { error: "AI is not configured. Add a Gemini (free) or premium (Z.ai / Anthropic / OpenAI) API key." },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const prompt = String(form.get("prompt") ?? "");
  const file = form.get("image");

  let imageBase64: string | undefined;
  let imageMimeType: string | undefined;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image too large (max 8MB)." },
        { status: 413 },
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    imageBase64 = buffer.toString("base64");
    imageMimeType = file.type || "image/jpeg";
  }

  if (!prompt.trim() && !imageBase64) {
    return NextResponse.json(
      { error: "Provide a photo or a prompt." },
      { status: 400 },
    );
  }

  let isPremium = false;
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      isPremium = Boolean(data?.is_premium);
    }
  }

  try {
    const result = await runAnalysis(
      { prompt, imageBase64, imageMimeType },
      isPremium,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Analysis failed:", err);
    return NextResponse.json(
      { error: "Analysis failed. Try again." },
      { status: 500 },
    );
  }
}
