import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warn";
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "warn" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border-2 bg-surface p-4 text-sm glow-border",
        tone === "warn" ? "border-lime text-foreground" : "border-border text-muted",
        className,
      )}
    >
      <Icon
        size={18}
        className={cn("mt-0.5 shrink-0", tone === "warn" ? "text-lime" : "text-accent")}
      />
      <div className="space-y-1">
        {title ? (
          <p className="font-bold uppercase-wide text-foreground">{title}</p>
        ) : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
