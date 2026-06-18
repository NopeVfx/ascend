"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={`inline-flex items-center justify-center border-2 border-border bg-surface p-2 text-foreground transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      {/* Icon is driven by the `.dark` class so it never mismatches on hydration. */}
      <Sun size={18} className="hidden dark:block" />
      <Moon size={18} className="block dark:hidden" />
    </button>
  );
}
