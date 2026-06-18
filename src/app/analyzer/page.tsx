import { Analyzer } from "@/components/analyzer/Analyzer";
import { Notice } from "@/components/ui/Notice";
import { isAnyAiConfigured } from "@/lib/env";

export const metadata = {
  title: "AI Face Analyzer — Ascend",
};

export default function AnalyzerPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-6">
        <h1 className="text-3xl font-black uppercase-wide md:text-4xl">
          AI Face Analyzer
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Unsugarcoated, data-driven. Premium accounts route to a frontier model
          automatically.
        </p>
      </header>

      {!isAnyAiConfigured ? (
        <Notice tone="warn" title="AI not configured" className="mb-6">
          Add a <code>GOOGLE_GENERATIVE_AI_API_KEY</code> (free Gemini) and/or{" "}
          <code>OPENAI_API_KEY</code> to enable analysis. The UI below is fully
          functional once a key is present.
        </Notice>
      ) : null}

      <Analyzer />
    </div>
  );
}
