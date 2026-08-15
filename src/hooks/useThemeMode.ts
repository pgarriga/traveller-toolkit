import { useState, useEffect } from "react";
import type { Theme, ThemeMode } from "../types/theme";
import { THEMES } from "../constants/colors";

const STORAGE_KEY = "traveller-theme";

interface UseThemeModeReturn {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  theme: Theme;
}

// Helper to get the actual theme based on mode
const getSystemTheme = (): "dark" | "light" => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeMode = (): UseThemeModeReturn => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");
  // The OS preference has to live in state, not just be read at render time:
  // every view paints its own full-height `theme.bg` over the body, so nudging
  // document.body alone left "auto" showing the old theme until a reload.
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(getSystemTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && ["auto", "dark", "light"].includes(savedTheme)) {
      setThemeMode(savedTheme as ThemeMode);
    }
  }, []);

  // Listen for system theme changes. Registered whatever the mode, so switching
  // back to "auto" already knows the current preference.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent): void => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const theme = themeMode === "auto" ? THEMES[systemTheme] : THEMES[themeMode];

  // Sync to localStorage and keep the body behind the app on the same surface,
  // so overscroll and the browser chrome do not flash the other theme.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
    document.body.style.background = theme.bg;
  }, [themeMode, theme.bg]);

  return { themeMode, setThemeMode, theme };
};
