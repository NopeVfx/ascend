import { cn } from "@/lib/utils";

function toneFor(score: number): string {
  if (score >= 7) return "bg-lime";
  if (score >= 5) return "bg-accent";
  return "bg-danger";
}

export function ScoreBar({
  label,
  score,
  note,
}: {
  label: string;
  score: number;
  note?: string;
}) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  return (
    <div className="border-2 border-border p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold uppercase-wide">{label}</span>
        <span className="font-mono text-sm font-bold">{score.toFixed(1)}</span>
      </div>
      <div className="mt-2 h-2 w-full bg-surface-2">
        <div className={cn("h-full", toneFor(score))} style={{ width: `${pct}%` }} />
      </div>
      {note ? <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p> : null}
    </div>
  );
}
