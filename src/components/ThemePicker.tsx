"use client";
import { useState } from "react";
import { ADVANCED_PALETTES, parseThemeId } from "@/lib/themes";

export default function ThemePicker({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [showCustom, setShowCustom] = useState(false);
  const appearance = parseThemeId(value);

  const setBasic = (mode: string) => {
    onChange(mode);
    setShowCustom(false);
  };

  const setAdvanced = (paletteId: string, mode: string) => {
    onChange(`${paletteId}-${mode}`);
    setShowCustom(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button onClick={() => setBasic("system")} className={`btn-bubbly p-2 flex-1 ${value === 'system' ? 'bg-[var(--accent)] text-black' : 'bg-zinc-800'}`}>System</button>
        <button onClick={() => setBasic("dark")} className={`btn-bubbly p-2 flex-1 ${value === 'dark' ? 'bg-[var(--accent)] text-black' : 'bg-zinc-800'}`}>Dark</button>
        <button onClick={() => setBasic("light")} className={`btn-bubbly p-2 flex-1 ${value === 'light' ? 'bg-[var(--accent)] text-black' : 'bg-zinc-800'}`}>Light</button>
      </div>
      
      <button onClick={() => setShowCustom(!showCustom)} className="btn-bubbly p-2 bg-zinc-900 border border-zinc-700">
        Custom Themes (Gruvbox, Catppuccin, etc.)
      </button>

      {showCustom && (
        <div className="grid grid-cols-2 gap-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          {ADVANCED_PALETTES.map((p) => (
            <div key={p.id} className="flex flex-col gap-1 items-center">
              <span className="text-xs font-bold">{p.label}</span>
              <div className="flex gap-1">
                <button onClick={() => setAdvanced(p.id, "light")} className="btn-bubbly px-3 py-1 text-xs bg-zinc-700">Light</button>
                <button onClick={() => setAdvanced(p.id, "dark")} className="btn-bubbly px-3 py-1 text-xs bg-zinc-800">Dark</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
