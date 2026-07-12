import { useState, useEffect } from "react";

export type AppTheme = "ocean" | "abysse" | "aurore";

const THEME_CLASSES: Record<AppTheme, string> = {
  ocean:  "",       // :root — aucune classe
  abysse: "dark",   // .dark
  aurore: "light",  // .light
};

function getInitialTheme(): AppTheme {
  if (typeof window === "undefined") return "ocean";
  const stored = localStorage.getItem("delipose-theme") as AppTheme | null;
  if (stored === "ocean" || stored === "abysse" || stored === "aurore") return stored;
  // Héritage ancienne clé
  const old = localStorage.getItem("elengi-theme");
  if (old === "dark") return "abysse";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "ocean" : "ocean";
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  const cls = THEME_CLASSES[theme];
  if (cls) root.classList.add(cls);
}

export function useTheme() {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("delipose-theme", theme);
  }, [theme]);

  const cycle = () =>
    setTheme((t) => t === "ocean" ? "abysse" : t === "abysse" ? "aurore" : "ocean");

  const set = (t: AppTheme) => setTheme(t);

  return {
    theme,
    set,
    cycle,
    isDark: theme === "abysse",
    isLight: theme === "aurore",
    isOcean: theme === "ocean",
  };
}

// Initialisation synchrone avant le premier render (évite le flash)
if (typeof window !== "undefined") {
  applyTheme(getInitialTheme());
}
