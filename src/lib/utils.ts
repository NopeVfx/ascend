import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function initialsFromName(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "??";
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(10, Math.max(0, value));
}
