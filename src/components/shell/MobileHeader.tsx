"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between rounded-b-2xl border-b-2 border-border bg-surface px-4 py-3 shadow-[0_4px_14px_0_color-mix(in_srgb,var(--foreground)_5%,transparent)] md:hidden">
      <Link href="/" className="btn-bubbly flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-black text-accent-fg glow-border">
          A
        </span>
        <span className="text-base font-black uppercase-wide">Ascend</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/premium"
          className="btn-bubbly flex items-center gap-1 rounded-xl border-2 border-lime/50 bg-lime/10 px-2 py-1.5 text-xs font-bold uppercase-wide text-lime transition-colors hover:border-lime glow-border-hover"
        >
          <Crown size={14} />
          Premium
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
