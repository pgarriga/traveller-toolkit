// Theme type definitions

export type ThemeMode = "auto" | "light" | "dark";

export interface Theme {
  bg: string;
  bgCard: string;
  bgHeader: string;
  text: string;
  textMuted: string;
  textDimmed: string;
  border: string;
  navBg: string;
}

export interface ThemeConfig {
  dark: Theme;
  light: Theme;
}
