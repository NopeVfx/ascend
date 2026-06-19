"use client";
import { useState } from "react";
import { ADVANCED_PALETTES, parseThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function ThemePicker({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [showCustom, setShowCustom] = useState(false);
  const { palette } = parseThemeId(value);

  const setBasic = (mode: string) => {
    onChange(mode);
    setShowCustom(false);
  };

  const setAdvanced = (paletteId: string, mode: string) => {
    onChange(`${paletteId}-${mode}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button 
          onClick={() => setBasic("system")} 
          className={cn("btn-bubbly p-2 flex-1 rounded-xl border-2 font-bold uppercase-wide text-sm transition-colors glow-border-hover", 
          value === 'system' ? 'bg-accent text-accent-fg border-accent glow-border' : 'bg-surface text-foreground border-border')}
        >System</button>
        <button 
          onClick={() => setBasic("dark")} 
          className={cn("btn-bubbly p-2 flex-1 rounded-xl border-2 font-bold uppercase-wide text-sm transition-colors glow-border-hover", 
          value === 'dark' ? 'bg-accent text-accent-fg border-accent glow-border' : 'bg-surface text-foreground border-border')}
        >Dark</button>
        <button 
          onClick={() => setBasic("light")} 
          className={cn("btn-bubbly p-2 flex-1 rounded-xl border-2 font-bold uppercase-wide text-sm transition-colors glow-border-hover", 
          value === 'light' ? 'bg-accent text-accent-fg border-accent glow-border' : 'bg-surface text-foreground border-border')}
        >Light</button>
      </div>
      
      <button 
        onClick={() => setShowCustom(!showCustom)} 
        className="btn-bubbly p-3 bg-surface-2 border-2 border-border rounded-xl text-sm font-bold uppercase-wide text-foreground transition-colors hover:border-accent glow-border-hover"
      >
        {showCustom ? "Hide Custom Themes" : "Custom Themes (Gruvbox, Catppuccin, etc.)"}
      </button>

      {showCustom && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface rounded-xl border-2 border-border glow-border">
          {ADVANCED_PALETTES.map((p) => {
            const isSelectedPalette = palette === p.id;
            return (
            <div key={p.id} className={cn("flex flex-col gap-2 p-3 rounded-xl border-2 transition-colors", isSelectedPalette ? "border-accent bg-accent/5" : "border-border bg-surface-2")}>
              <span className="text-sm font-bold uppercase-wide text-center text-foreground">{p.label}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setAdvanced(p.id, "light")} 
                  className={cn("btn-bubbly flex-1 py-1.5 text-xs font-bold rounded-lg border-2 transition-colors glow-border-hover",
                    value === `${p.id}-light` ? "bg-accent text-accent-fg border-accent" : "bg-surface text-foreground border-border"
                  )}
                >{p.lightName}</button>
                <button 
                  onClick={() => setAdvanced(p.id, "dark")} 
                  className={cn("btn-bubbly flex-1 py-1.5 text-xs font-bold rounded-lg border-2 transition-colors glow-border-hover",
                    value === `${p.id}-dark` ? "bg-accent text-accent-fg border-accent" : "bg-surface text-foreground border-border"
                  )}
                >{p.darkName}</button>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
