"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import type { Theme } from "@/lib/types";
import { parseThemeId } from "@/lib/themes";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "ascend-theme";

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || "dark";
}

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  const { palette, mode } = parseThemeId(theme);
  
  document.documentElement.setAttribute("data-theme", palette);
  
  if (theme === "system") {
    const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
  } else {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The inline no-flash script in the layout has already set the `dark` class
  // before hydration, so we derive initial state from storage without an effect.
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const { palette, mode } = parseThemeId(prev);
      const isSystemDark = prev === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const currentIsDark = mode === "dark" || isSystemDark;
      
      const nextMode = currentIsDark ? "light" : "dark";
      const next = palette === "default" ? nextMode : `${palette}-${nextMode}`;
      
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  // System preference listener
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
