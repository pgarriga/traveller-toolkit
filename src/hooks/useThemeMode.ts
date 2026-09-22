import { useState, useEffect } from "react";
import type { Theme, ThemeMode } from "../types/theme";
import { THEMES } from "../constants/colors";
import { STORAGE_KEYS } from "../constants/storage";

const STORAGE_KEY = STORAGE_KEYS.theme;

const THEME_MODES: readonly string[] = ["auto", "dark", "light"];

/** Lo guardado, o "auto". Se lee ANTES del primer pintado; ver abajo. */
const savedThemeMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null && THEME_MODES.includes(saved) ? (saved as ThemeMode) : "auto";
  } catch {
    // localStorage no disponible (modo privado, cuota llena): "auto" y a correr.
    return "auto";
  }
};

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
  // Inicializador perezoso y no un efecto: leerlo después del montaje pintaba
  // un fotograma con el tema por defecto antes de cambiar al guardado, y en una
  // app que es casi toda fondo, ese parpadeo se ve.
  const [themeMode, setThemeMode] = useState<ThemeMode>(savedThemeMode);
  // The OS preference has to live in state, not just be read at render time:
  // every view paints its own full-height `theme.bg` over the body, so nudging
  // document.body alone left "auto" showing the old theme until a reload.
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(getSystemTheme);

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
