"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-border bg-surface px-4 py-3 md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center bg-accent text-xs font-black text-accent-fg">
          A
        </span>
        <span className="text-base font-black uppercase-wide">Ascend</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/premium"
          className="flex items-center gap-1 border-2 border-lime/50 px-2 py-1.5 text-xs font-bold uppercase-wide text-lime"
        >
          <Crown size={14} />
          Premium
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
