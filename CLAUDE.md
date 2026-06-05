# CLAUDE.md

## Project Overview

Traveller Toolkit - A multi-tool web app for the Mongoose Traveller 2nd Edition tabletop RPG. The home page lists the available tools and the user navigates between them. Current tools:
- **UWP Decoder** — decodes Universal World Profile codes (manual entry or OCR from images).
- **Freight Calculator** — computes traffic DMs, rolls lots, and lets the player pick which lots to buy up to their cargo bay capacity.
- **Recent Planets** — history of previously decoded planets, persisted in `localStorage`.

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5** - Type-safe JavaScript (strict mode enabled)
- **Vite 8** - Build tool and dev server
- **Tesseract.js 7** - OCR engine for scanning UWP codes from images
- **No external UI libraries** - Custom components with inline styles
- **No router library** - Custom URL routing with History API

## TypeScript Configuration

This project uses **strict TypeScript**. The following rules are enforced:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

**IMPORTANT**:
- ALL new code MUST be written in TypeScript (`.ts` or `.tsx`)
- NEVER create `.js` or `.jsx` files
- ALWAYS define proper types for props, state, and function parameters
- NEVER use `any` type - use proper types or `unknown` if needed

## Project Structure

```
src/
├── types/                    # Type definitions
│   ├── theme.ts              # Theme, ThemeMode, ThemeConfig
│   ├── uwp.ts                # ParsedUWP, StarportClass, ZoneCode, RecentPlanet
│   ├── i18n.ts               # Language, LangMode, TranslationFunction, TranslationKey
│   ├── game-data.ts          # StarportData, SizeData, AtmosphereData, etc.
│   ├── freight.ts            # FreightInputs, FreightResult, LotResult, LotType, etc.
│   ├── components.ts         # Component props interfaces
│   └── index.ts              # Re-exports all types
├── components/
│   ├── icons/
│   │   └── index.tsx         # SVG icon components (IconCamera, IconGlobe, IconBox, IconClock, IconSettings, etc.)
│   ├── ui/
│   │   ├── Button.tsx        # Reusable button with variants
│   │   ├── Section.tsx       # Card section with colored border
│   │   ├── Row.tsx           # Label-value row for data display
│   │   ├── Badge.tsx         # Colored badge/tag
│   │   └── PageHeader.tsx    # Shared centered gradient h1 + optional icon
│   ├── Navbar.tsx            # Navigation bar (desktop + mobile, with a11y)
│   ├── Footer.tsx            # Disclaimer footer
│   └── ErrorBoundary.tsx     # Error boundary with fallback UI
├── views/
│   ├── HomeView.tsx          # Tools list (cards) — landing page at "/"
│   ├── DecoderView.tsx       # UWP decoder (scan + manual input) — "/decoder"
│   ├── PlanetView.tsx        # Planet detail view — "/planet/{UWP}"
│   ├── RecentView.tsx        # Recent planets list — "/recent"
│   ├── FreightView.tsx       # Freight calculator — "/freight"
│   └── SettingsView.tsx      # Settings page — "/settings"
├── constants/
│   ├── colors.ts             # COLORS, SECTION_COLORS, THEMES (with `as const`)
│   ├── zones.ts              # ZONES, ZONE_COLORS (with `as const`)
│   ├── gameRules.ts          # SIZE_RULES, ATMO_RULES, LAW_RULES, etc.
│   ├── freight.ts            # POPULATION_DM, STARPORT_DM, TONS_PER_LOT_DIE, lotsFromTraffic, etc.
│   └── ocr.ts                # OCR_SETTINGS, MAX_RECENT_PLANETS
├── hooks/
│   ├── useThemeMode.ts       # Theme management with localStorage
│   └── useRecentPlanets.ts   # CRUD for recent planets
├── utils/
│   ├── routing.ts            # URL parsing and building (home, decoder, freight, saved, settings, planet)
│   ├── uwp.ts                # UWP parsing and validation
│   ├── freight.ts            # calculateFreight (DM breakdown + lot rolling)
│   └── i18n-helpers.ts       # isNoneValue, requiresWarning
├── i18n/
│   ├── translations.ts       # UI translations (ES/EN)
│   ├── game-data.ts          # Game data functions (getSTARPORT, getSIZE, etc.)
│   ├── useTranslation.ts     # Translation hook
│   └── index.ts              # Re-exports
├── App.tsx                   # Main orchestration: view state + popstate + routing
├── main.tsx                  # React entry point
├── vite-env.d.ts             # Vite type declarations
└── index.css                 # Global styles and responsive breakpoints
```

## Commands

```bash
npm run dev      # Start dev server (usually http://localhost:5173)
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build
npx tsc --noEmit # Type check without emitting files
```

## Key Concepts

### UWP Code Format
A UWP code is 8 characters: `A123456-7`
- Position 0: Starport class (A-E, X)
- Positions 1-6: Hex digits for Size, Atmosphere, Hydrographics, Population, Government, Law Level
- Position 7 (after dash): Tech Level

### URL Routing
- `/` — Home (tools list, `HomeView`)
- `/decoder` — UWP Decoder (scan + manual input, `DecoderView`)
- `/freight` — Freight Calculator (`FreightView`)
- `/recent` — Recent planets list (`RecentView`)
- `/settings` — Settings (`SettingsView`)
- `/planet/{UWP}` — Planet detail (`PlanetView`, e.g. `/planet/A123456-7`)

The router is hand-rolled (no library) in `utils/routing.ts` and `App.tsx` manages the `ViewType` state plus `popstate` for browser back/forward. The Navbar logo calls `goHome` (resets decoder state + navigates to `/`). The Decoder nav entry calls `resetDecoder` (resets + navigates to `/decoder`).

### Freight Calculator (Mongoose 2e rules)

Lives in `src/views/FreightView.tsx`, `src/utils/freight.ts`, `src/constants/freight.ts`, `src/types/freight.ts`.

Flow:
1. User picks origin/destination world properties (population, starport, TL, zone), parsec distance, cargo bay, broker skill effect, on-time delivery.
2. **Modificadores (DM)** section updates live — sums per-attribute DMs and shows the base DM.
3. **Cantidad de lotes** section: one 2D traffic roll per lot type (Major / Minor / Incidental). As the user types the 2D, an `(NDg)` badge next to the label shows how many d6 the program will roll.
4. **Calculate lots** button triggers `handleCalculate`:
   - Rolls N d6 internally with `rollD6Array` for each lot type (N from the traffic table).
   - Each die maps to one lot: tons = die × `TONS_PER_LOT_DIE[type]` (Major × 10, Minor × 5, Incidental × 1).
   - Resets `selectedLots` selection state.
5. **Precio por tonelada**, **Lotes disponibles** and **Resumen** sections only render after the button is pressed (gated on `calculatedResult`).
6. Each lot chip in **Lotes disponibles** is clickable → toggles in `selectedLots: Set<string>` (keyed `${type}-${idx}`). The Resumen recomputes tons/income live from the selection (no recalculation of the lots themselves).

`calculateFreight(inputs, t)` returns a `FreightResult` (DM breakdown, lots, per-lot tons, rate per ton). It is called twice: once via `useMemo` for the live preview, once on button click with the rolled dice.

### i18n System
- Auto-detects language from `navigator.language`
- Spanish: es, ca, gl, eu (Spanish regional languages)
- English: all other languages
- Translations in `src/i18n/` with `useTranslation()` hook

### Data Persistence
- Recent planets stored in `localStorage` key: `traveller-recent`
- Auto-saves when viewing/editing a planet
- Synced via React effect when `recentPlanets` state changes

## Code Conventions

- **TypeScript strict mode** - All code must pass strict type checking
- **Inline styles** preferred over CSS classes (except responsive styles)
- **Flat SVG icons** as React components (aria-hidden for accessibility)
- **No emojis** in UI unless user requests
- **Spanish comments** acceptable (bilingual project)
- **Mobile-first responsive** with breakpoint at 640px for navbar, 480px for other elements

## TypeScript Patterns (IMPORTANT)

### Typing Components
```tsx
import type { FC } from "react";
import type { Theme } from "../types/theme";

interface MyComponentProps {
  theme: Theme;
  title: string;
  count?: number; // Optional prop
}

export const MyComponent: FC<MyComponentProps> = ({ theme, title, count = 0 }) => {
  // ...
};
```

### Typing Hooks
```tsx
import { useState, useCallback } from "react";
import type { ZoneCode } from "../types/uwp";

interface UseMyHookReturn {
  value: string;
  setValue: (v: string) => void;
}

export const useMyHook = (): UseMyHookReturn => {
  const [value, setValue] = useState<string>("");
  return { value, setValue };
};
```

### Typing Constants
```tsx
// Use `as const` for immutable objects
export const MY_CONSTANTS = {
  MAX_VALUE: 100,
  MIN_VALUE: 0,
} as const;

// Use `satisfies` for type checking while preserving literal types
export const ZONES = {
  GREEN: "V",
  AMBER: "A",
  RED: "R",
} as const satisfies Record<string, ZoneCode>;
```

### Import Types
```tsx
// ALWAYS use `import type` for type-only imports
import type { Theme } from "../types/theme";
import type { FC, ReactNode } from "react";

// Regular imports for values
import { COLORS } from "../constants/colors";
```

## Reusable Components (IMPORTANT)

**ALWAYS use these components instead of creating inline styles:**

### Button (`components/ui/Button.tsx`)
```tsx
import { Button } from "../components/ui/Button";

// Variants: primary, secondary, ghost, nav, nav-mobile, option, icon, danger
// Sizes: sm, md, lg, xl
<Button variant="primary" size="md" theme={theme} onClick={handler}>
  Click me
</Button>

// Navigation button (active state)
<Button variant="nav" active={isActive} theme={theme}>
  <IconCamera /> Scan
</Button>

// Option/toggle button (settings)
<Button variant="option" active={selected === "dark"} theme={theme}>
  Dark
</Button>

// Icon-only button (with aria-label)
<Button variant="icon" theme={theme} aria-label="Delete">
  <IconTrash />
</Button>
```

### Footer (`components/Footer.tsx`)
```tsx
import { Footer } from "../components/Footer";

// All views MUST use this for the disclaimer
<Footer theme={theme} t={t} />

// With version number (only in Settings)
<Footer theme={theme} t={t} showVersion />
```

### Section & Row (`components/ui/Section.tsx`, `Row.tsx`)
```tsx
import { Section } from "../components/ui/Section";
import { Row } from "../components/ui/Row";
import { SECTION_COLORS } from "../constants/colors";

<Section title="Starport" color={SECTION_COLORS.starport} theme={theme}>
  <Row label="Quality" value="Excellent" theme={theme} />
  <Row label="Warning" value="Danger!" warn theme={theme} />
</Section>
```

### PageHeader (`components/ui/PageHeader.tsx`)
```tsx
import { PageHeader } from "../components/ui/PageHeader";
import { IconGlobe } from "../components/icons";

// Centered gradient h1 (uses `.app-title` class) + optional icon.
// Used by Home, Decoder, Freight, Recent, Settings views to keep page titles consistent.
// PlanetView keeps its own header because it includes an editable planet name.
<PageHeader title={t("decodeUWP")} icon={<IconGlobe />} />
```

### Colors (`constants/colors.ts`)
```tsx
import { COLORS, SECTION_COLORS, THEMES } from "../constants/colors";

// NEVER hardcode colors like "#3b82f6" - use constants:
COLORS.primary    // #3b82f6
COLORS.secondary  // #8b5cf6
COLORS.warning    // #f59e0b
COLORS.danger     // #ef4444
COLORS.success    // #10b981

// Section colors for UWP data
SECTION_COLORS.starport     // warning
SECTION_COLORS.size         // primary
SECTION_COLORS.atmosphere   // success
SECTION_COLORS.population   // secondary
```

### Zones (`constants/zones.ts`)
```tsx
import type { ZoneCode } from "../types/uwp";
import { ZONES, ZONE_COLORS, getZoneColor } from "../constants/zones";

// NEVER use string literals "A", "R", "V" - use constants:
ZONES.GREEN   // "V"
ZONES.AMBER   // "A"
ZONES.RED     // "R"

// Get color for a zone (typed)
const color: string = getZoneColor(planet.zone);
```

### Icons (`components/icons/index.tsx`)
```tsx
import {
  IconCamera, IconGlobe, IconBox, IconClock, IconSettings,
  IconSearch, IconTrash, IconMenu, IconClose,
} from "../components/icons";

// All icons have aria-hidden="true" and consistent sizing (16x16, marginRight: 6).
// Semantic mapping currently used:
//   IconGlobe   → UWP Decoder (home card, decoder header, navbar entry)
//   IconBox     → Freight Calculator (home card, freight header, navbar entry, calculate button)
//   IconClock   → Recent Planets (home card, navbar entry, recent view header)
//   IconCamera  → Scan action inside the decoder
//   IconSettings→ Settings (navbar entry, settings view header)
```

### Game Rules (`constants/gameRules.ts`)
```tsx
import { SIZE_RULES, ATMO_RULES, POP_RULES, LAW_RULES, TECH_COMM, getTechLevelKey } from "../constants/gameRules";
import type { TechLevelKey } from "../types/game-data";

// NEVER hardcode game thresholds - use constants:
SIZE_RULES.LOW_GRAVITY_MAX   // 6 (size 1-6 = low gravity)
SIZE_RULES.HIGH_GRAVITY_MIN  // 10 (size 10+ = high gravity)
ATMO_RULES.DANGEROUS_MIN     // 11 (atmosphere 11+ = dangerous)
LAW_RULES.MARTIAL_LAW_MIN    // 9 (law 9+ = martial law)

// Get tech level description key for translation (typed)
const key: TechLevelKey = getTechLevelKey(parsed.tl);
t(key)  // Translates the key
```

### i18n Helpers (`utils/i18n-helpers.ts`)
```tsx
import type { TranslationFunction } from "../types/i18n";
import { isNoneValue, requiresWarning } from "../utils/i18n-helpers";

// NEVER compare against multiple language strings - use helpers:
// BAD:  value !== "None" && value !== "Ninguno"
// GOOD: requiresWarning(value, t)

<Row warn={requiresWarning(ATMO[parsed.at].equip, t)} />
```

### OCR Constants (`constants/ocr.ts`)
```tsx
import { MAX_RECENT_PLANETS, isCommonWord, OCR_SETTINGS } from "../constants/ocr";

// NEVER hardcode these values:
MAX_RECENT_PLANETS           // 20
OCR_SETTINGS.NAME_SEARCH_LENGTH  // 150
OCR_SETTINGS.NAME_SEARCH_LINES   // 4
OCR_SETTINGS.NAME_MIN_LENGTH     // 2
OCR_SETTINGS.NAME_MAX_LENGTH     // 35

// Check if word should be filtered from OCR results
if (isCommonWord(word)) { ... }
```

### Custom Hooks (`hooks/`)
```tsx
import type { Theme, ThemeMode } from "../types/theme";
import type { RecentPlanet, ZoneCode } from "../types/uwp";
import { useThemeMode } from "../hooks/useThemeMode";
import { useRecentPlanets } from "../hooks/useRecentPlanets";

// Theme management - persists to localStorage
const { themeMode, setThemeMode, theme }: {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  theme: Theme;
} = useThemeMode();

// Recent planets CRUD - persists to localStorage
const {
  recentPlanets,      // RecentPlanet[]
  dataLoaded,         // boolean
  savePlanet,         // (uwp: string, name: string, zone?: ZoneCode) => void
  loadPlanet,         // (planet: RecentPlanet) => RecentPlanet
  deletePlanet,       // (uwp: string) => void
  clearAllPlanets,    // () => void
  findPlanet,         // (uwp: string) => RecentPlanet | undefined
} = useRecentPlanets();
```

### Error Boundary (`components/ErrorBoundary.tsx`)
```tsx
// Wraps App in main.tsx - catches React errors
import { ErrorBoundary } from "./components/ErrorBoundary";

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Types (`types/`)
```tsx
// Import types from the centralized types directory
import type { Theme, ThemeMode } from "../types/theme";
import type { ParsedUWP, ZoneCode, RecentPlanet, StarportClass } from "../types/uwp";
import type { Language, TranslationFunction, TranslationKey } from "../types/i18n";
import type { StarportData, SizeData, AtmosphereData } from "../types/game-data";
import type {
  FreightInputs, FreightResult, FreightWorldInputs,
  LotResult, LotType, ParsecDistance, PopulationTier,
  TechLevelTier, FreightStarport, FreightZoneTier,
} from "../types/freight";

// Or import everything from index
import type { Theme, ParsedUWP, Language } from "../types";
```

### Freight Constants & Utils
```tsx
import {
  POPULATION_DM, STARPORT_DM, TECH_LEVEL_DM, ZONE_DM, LOT_TYPE_DM,
  TONS_PER_LOT_DIE, MEAN_TONS_PER_LOT, FREIGHT_RATES_PER_TON,
  lotsFromTraffic, LATE_PAYMENT_MULTIPLIER,
  PARSEC_OPTIONS, POPULATION_OPTIONS, STARPORT_OPTIONS, TECH_LEVEL_OPTIONS, ZONE_OPTIONS,
} from "../constants/freight";
import { calculateFreight } from "../utils/freight";

// NEVER hardcode Mongoose Traveller 2e freight tables — use these constants.
// TONS_PER_LOT_DIE.major = 10 (each Major lot = 1D6 × 10 t)
// TONS_PER_LOT_DIE.minor = 5  (each Minor lot = 1D6 × 5 t)
// TONS_PER_LOT_DIE.incidental = 1
// lotsFromTraffic(2D+DM) → number of d6 lots available (Traffic table)
```

## Anti-patterns to Avoid

### General
1. **NO inline button styles** - Use `<Button>` component
2. **NO repeated footer/disclaimer** - Use `<Footer>` component
3. **NO hardcoded colors** - Use `COLORS.*` constants
4. **NO zone string literals** - Use `ZONES.*` constants
5. **NO duplicate Navbar props** - Pass via `commonProps` spread in App.tsx (must include `goHome` alongside `resetDecoder`)
6. **NO hardcoded game thresholds** - Use `SIZE_RULES`, `LAW_RULES`, etc.
7. **NO multi-language string comparisons** - Use `requiresWarning(value, t)`
8. **NO hardcoded OCR settings** - Use `OCR_SETTINGS.*` and `MAX_RECENT_PLANETS`
9. **NO duplicating theme/localStorage logic** - Use `useThemeMode` and `useRecentPlanets` hooks
10. **NO missing ErrorBoundary** - App must be wrapped in ErrorBoundary in main.tsx
11. **NO ad-hoc page titles** - Use `<PageHeader title=... icon=... />` so every page shares the same gradient h1 (PlanetView is the only exception — it has an editable name input header)
12. **NO hardcoded freight tables** - Use `TONS_PER_LOT_DIE`, `POPULATION_DM`, `lotsFromTraffic`, etc. from `constants/freight.ts`
13. **NO live re-rolling of dice during render** - The freight lot d6 are rolled once inside `handleCalculate` on button click; do not call `Math.random` inside `useMemo` or render

### TypeScript-Specific
11. **NO `.js` or `.jsx` files** - ALL code must be TypeScript (`.ts` or `.tsx`)
12. **NO `any` type** - Use proper types or `unknown` if truly unknown
13. **NO implicit any** - Always type function parameters and return values
14. **NO type assertions without validation** - Prefer type guards
15. **NO missing interface definitions** - All component props must have interfaces
16. **NO inline type definitions in components** - Define in `types/` directory
17. **NO forgetting `import type`** - Use type-only imports for types

## Required Checks

**IMPORTANT**: Run these checks when appropriate:

### After ANY code changes:
```bash
npx tsc --noEmit   # Type check - MUST pass with no errors
npm run build      # Build check - MUST succeed
```

### After UI changes:
- `/check-responsive` - Verify responsive design works on all screen sizes
- `/check-a11y` - Verify accessibility compliance

### After updating dependencies:
- `/update-badges` - Sync README.md badges with package.json versions

### After bumping version (npm version patch/minor/major):
- `/sync-version` - Sync version in README badges and verify build

These checks ensure the app works well on mobile devices, is accessible to all users, and documentation stays current.

## Important Notes

- This is an unofficial fan project, not affiliated with Mongoose Publishing
- Game data (starports, atmospheres, freight tables) is from Mongoose Traveller 2e SRD / Core Rulebook
- OCR scanning works best with clear, high-contrast images
- The app works offline after initial load (no backend required)
- **TypeScript strict mode is mandatory** - Code must compile without errors
- The app is deployed to GitHub Pages; `public/404.html` is the SPA fallback that rewrites unknown paths to `/` so the History-API router can pick them up
