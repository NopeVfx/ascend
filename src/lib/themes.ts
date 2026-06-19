export const ADVANCED_PALETTES = [
  { id: "catppuccin", label: "Catppuccin", lightName: "Latte", darkName: "Mocha" },
  { id: "gruvbox", label: "Gruvbox", lightName: "Light", darkName: "Dark" },
  { id: "everforest", label: "Everforest", lightName: "Light", darkName: "Dark" },
  { id: "nord", label: "Nordic", lightName: "Light", darkName: "Dark" },
  { id: "onedark", label: "One Dark", lightName: "Light", darkName: "Dark" },
  { id: "tokyonight", label: "Tokyo Night", lightName: "Day", darkName: "Night" },
];

export const parseThemeId = (themeId: string) => {
  if (themeId === "system" || themeId === "light" || themeId === "dark") {
    return { palette: "default", mode: themeId };
  }
  const parts = themeId.split("-");
  const mode = parts.pop(); // last part is light/dark
  const palette = parts.join("-");
  return { palette, mode };
};
