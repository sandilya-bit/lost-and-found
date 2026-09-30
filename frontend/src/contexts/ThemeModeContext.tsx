import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMediaQuery } from "@mui/material";

type Mode = "dark" | "light";

interface ThemeModeContextValue {
  mode: Mode;
  toggle: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

const KEY = "lf_theme_mode";

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const prefersLight = useMediaQuery("(prefers-color-scheme: light)", { noSsr: true });
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
    return "dark";
  });
  // Keep the prefers-color-scheme listener referenced for future defaults.
  void prefersLight;

  useEffect(() => {
    localStorage.setItem(KEY, mode);
    document.documentElement.setAttribute("data-theme", mode);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", mode === "dark" ? "#0F172A" : "#F1F5F9");
  }, [mode]);

  const toggle = useCallback(() => setMode((m) => (m === "dark" ? "light" : "dark")), []);
  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
}
