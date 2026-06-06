import type { ThemeConfig } from "../types/theme";

// Design system inspired by the Mongoose Traveller 2026 Core Rulebook.
//
// - Traveller orange (#D4521C) is the dominant accent: section headers,
//   separator lines, key indicators, primary buttons.
// - Space black (#1A1A18) and cream (#F1EFE8) are the canonical surface
//   colors (dark and light themes).
// - Semantic colors (warning/danger/success/info) are muted industrial
//   tones rather than vivid web blues/greens so the palette feels cohesive
//   with the manual's printed aesthetic.

// Raw Traveller palette (use when you need the canonical color directly).
export const TRAVELLER = {
  orange: "#D4521C",
  spaceBlack: "#1A1A18",
  cream: "#F1EFE8",
} as const;

// UI colors used throughout the app. `primary` is the Traveller orange.
export const COLORS = {
  primary: TRAVELLER.orange,
  secondary: "#A03B14",   // rust — secondary accent
  warning: "#E8A23C",     // industrial amber
  danger: "#B43F1C",      // deep red-rust
  success: "#6B8E3D",     // muted olive
  info: "#4A6B7D",        // steel blue
  pink: "#C66E4E",        // terracotta
  indigo: "#3D4E6B",      // midnight
  rose: "#8C4F3B",        // brick
} as const;

// Section colors per UWP attribute. Picked from the constrained palette so
// the manual aesthetic is preserved while keeping visual differentiation.
export const SECTION_COLORS = {
  starport: COLORS.primary,
  size: COLORS.info,
  atmosphere: COLORS.success,
  hydrographics: COLORS.indigo,
  population: COLORS.pink,
  government: COLORS.success,
  lawLevel: COLORS.warning,
  techLevel: COLORS.secondary,
} as const;

// Theme colors — space-black + cream surfaces with orange accents.
export const THEMES: ThemeConfig = {
  dark: {
    bg: TRAVELLER.spaceBlack,
    bgCard: "#252521",
    bgHeader: TRAVELLER.spaceBlack,
    text: TRAVELLER.cream,
    textMuted: "#A8A29A",
    textDimmed: "#6B6864",
    border: "#3D3A35",
    navBg: "#252521",
  },
  light: {
    bg: TRAVELLER.cream,
    bgCard: "#FAF8F0",
    bgHeader: TRAVELLER.cream,
    text: TRAVELLER.spaceBlack,
    textMuted: "#4A4742",
    textDimmed: "#8A8782",
    border: "#D4D0C5",
    navBg: "#FAF8F0",
  },
} as const;
