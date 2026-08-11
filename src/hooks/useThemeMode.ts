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

const getTheme = (mode: ThemeMode): Theme => {
  const actualTheme = mode === "auto" ? getSystemTheme() : mode;
  return THEMES[actualTheme];
};

export const useThemeMode = (): UseThemeModeReturn => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && ["auto", "dark", "light"].includes(savedTheme)) {
      setThemeMode(savedTheme as ThemeMode);
    }
  }, []);

  // Sync theme to localStorage and update body background
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
    const theme = getTheme(themeMode);
    document.body.style.background = theme.bg;
  }, [themeMode]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (themeMode !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Force re-render by updating body background
      const theme = getTheme("auto");
      document.body.style.background = theme.bg;
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [themeMode]);

  return { themeMode, setThemeMode, theme: getTheme(themeMode) };
};
