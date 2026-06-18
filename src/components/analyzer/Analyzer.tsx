"use client";

import { useRef, useState } from "react";
import { Crown, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { ScoreBar } from "@/components/analyzer/ScoreBar";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/types";

function pslTone(psl: number): string {
  if (psl >= 7) return "text-lime";
  if (psl >= 5) return "text-accent";
  return "text-danger";
}

export function Analyzer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  function selectFile(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } else {
      setFile(null);
      setPreview(null);
    }
  }

  async function analyze() {
    if (!file && !prompt.trim()) {
      setError("Upload a photo or describe your goal first.");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("prompt", prompt);
      if (file) form.set("image", file);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed.");
      setResult(data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input panel */}
      <div className="space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            selectFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-border bg-surface transition-colors hover:border-accent"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Upload preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              <Upload size={32} />
              <span className="text-sm font-bold uppercase-wide">
                Upload / drop a photo
              </span>
              <span className="text-xs">Front-lit, neutral expression works best</span>
            </div>
          )}
          {preview ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectFile(null);
              }}
              className="absolute right-2 top-2 border-2 border-border bg-surface p-1.5 hover:border-danger hover:text-danger"
            >
              <X size={16} />
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Optional: your goals, problem areas, timeframe, budget…"
          className="w-full resize-none border-2 border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
        />

        {error ? <Notice tone="warn">{error}</Notice> : null}

        <Button onClick={analyze} disabled={loading} size="lg" className="w-full">
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Analyzing…
            </>
          ) : (
            <>
              <Sparkles size={18} /> Run analysis
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted">
          Honest, evidence-based, and not a substitute for professional advice.
        </p>
      </div>

      {/* Result panel */}
      <div className="space-y-4">
        {!result && !loading ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center border-2 border-dashed border-border p-8 text-center text-muted">
            <Sparkles size={28} className="text-accent" />
            <p className="mt-3 text-sm">
              Your PSL rating, sub-scores, and ascension plan appear here.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex h-full min-h-64 items-center justify-center border-2 border-border">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : null}

        {result ? (
          <>
            <div className="flex items-center justify-between border-2 border-border bg-surface p-5">
              <div>
                <p className="text-xs font-bold uppercase-wide text-muted">
                  PSL Rating
                </p>
                <p className={cn("text-6xl font-black", pslTone(result.psl))}>
                  {result.psl.toFixed(1)}
                  <span className="text-2xl text-muted">/10</span>
                </p>
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 border-2 px-2 py-1 text-xs font-bold uppercase-wide",
                  result.tier === "premium"
                    ? "border-lime text-lime"
                    : "border-border text-muted",
                )}
              >
                {result.tier === "premium" ? <Crown size={14} /> : null}
                {result.tier}
              </span>
            </div>

            <Notice>{result.verdict}</Notice>

            <div className="grid gap-3 sm:grid-cols-2">
              {result.features.map((f) => (
                <ScoreBar
                  key={f.feature}
                  label={f.feature}
                  score={f.score}
                  note={f.note}
                />
              ))}
            </div>

            {result.strengths.length ? (
              <div className="border-2 border-lime/50 bg-surface p-4">
                <p className="text-sm font-bold uppercase-wide text-lime">
                  Strengths
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="border-2 border-border bg-surface p-4">
              <p className="text-sm font-bold uppercase-wide text-accent">
                Ascension plan
              </p>
              <ol className="mt-2 space-y-2 text-sm">
                {result.ascension.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono font-bold text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-muted">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-right text-xs text-muted">model: {result.model}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
