# CLAUDE.md

## Project Overview

Traveller Toolkit - A multi-tool web app for the Mongoose Traveller 2nd Edition tabletop RPG. The home page lists the available tools and the user navigates between them. Current tools:
- **Search World** — searches official Traveller worlds by name via the [Traveller Map](https://travellermap.com) API (`/api/search`). Selecting a result jumps to World Detail and auto-saves the world to Visited Worlds.
- **Visited Worlds** — standalone tool at `/recent` listing the worlds you've visited (persisted in `localStorage`). Sortable dropdown, Edit/Done toggle for per-card deletion, colored tags per UWP attribute.
- **Worlds Near Me** — standalone tool at `/nearby`. Pick the world you are on, describe your ship (jump rating, fuel range, fuel it accepts), set UWP filters (max distance, minimum starport, TL, population, travel zones) and get the matching worlds, sorted by number of jumps (parsec distance and name break ties, unreachable worlds last). Each result also shows the minimum number of jumps to reach it along a route where the ship never runs out of fuel. `jumpsFromOrigin` searches over `(world, fuel left)` states, not just worlds, so a ship with tankage for several jumps can cross a system with no fuel in it. The `FuelPolicy` (`refined` = starports A/B, `unrefined` = also C/D, `wilderness` = also gas giants and oceans) decides where the ship will refuel; a world it cannot refuel at is still crossed when the fuel range allows. Data comes from the Traveller Map `/api/jumpworlds` endpoint. Below the results table sits a **jump map**: the official `/api/jumpmap` PNG with an SVG ring overlaid on each world that passed the filters (see `utils/jumpMapImage.ts`).
- **Passenger Traffic** — rolls High / Middle / Basic / Low passenger availability with the Mongoose 2e DMs and computes income. The **Nave** section (first on the page) names the ship and declares how many berths it sells of each class; that count caps the seat selection, and 0 means the class cannot be taken at all. An **Export contract** button opens a passage contract listing every booked seat, headed by the ship's name.
- **Freight Calculator** — computes traffic DMs, rolls lots, and lets the player pick which lots to buy up to their cargo bay capacity. Includes an integrated Mail Run block. An **Export contract** button opens an invoice with the accepted lots and mail containers, headed by the ship's name.

**UI terminology**: user-facing copy uses "world" (Traveller-native term). Code identifiers (`RecentPlanet`, `useRecentPlanets`, `planet` route, `planetName` translation key, `PlanetView`) keep the "planet" naming to avoid a cross-file rename — this asymmetry is intentional.

## Tech Stack

- **React 19** - UI framework
- **TypeScript 7** - Type-safe JavaScript (strict mode enabled)
- **Vite 8** - Build tool and dev server
- **Traveller Map API** - `https://travellermap.com/api/search` for planet lookup (returns Name, Sector, Hex, UWP in the `World` items)
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
│   ├── nearby.ts             # NearbyWorld, NearbyFilters, NearbyUwpFacts, ShipProfile, FuelPolicy
│   ├── mail.ts               # MailInputs, MailResult, MailRank (Mail Run)
│   ├── contract.ts           # ContractData, ContractLine, ContractParty, ContractTotal
│   └── passenger.ts          # PassengerInputs, PassengerResult, PassengerClass, ShipBerths
├── components/
│   ├── icons/
│   │   └── index.tsx         # SVG icon components (IconSearch, IconPin, IconBox, IconClock, IconUsers, IconMail, IconSettings, IconTrash, IconRefresh, IconRadar, IconMenu, IconClose, IconFileText, IconPrinter, IconCopy, IconShare)
│   ├── banners/
│   │   └── index.tsx         # Decorative per-tool SVG headers (SearchBanner, RecentBanner, NearbyBanner, PassengerBanner, FreightBanner)
│   ├── ui/
│   │   ├── Button.tsx        # Reusable button with variants
│   │   ├── Modal.tsx         # Overlay dialog (Escape + backdrop close, focused panel)
│   │   ├── Section.tsx       # Card section with colored border
│   │   ├── Row.tsx           # Label-value row for data display
│   │   ├── Field.tsx         # Labelled form control (useId → label htmlFor) + fieldLabelStyle
│   │   ├── PageHeader.tsx    # Shared centered gradient h1 + optional icon
│   │   ├── JumpsEditor.tsx   # JumpCountField + JumpsBreakdown + distributeJumps (Freight/Passenger)
│   │   └── WorldPicker.tsx   # Visited-worlds dropdown + inline Traveller Map search
│   ├── ContractModal.tsx     # Printable contract/invoice sheet built from a ContractData
│   ├── NearbyJumpMap.tsx     # Traveller Map jump-map image + filter-match ring overlay
│   ├── Navbar.tsx            # Navigation bar (desktop + mobile, with a11y)
│   ├── Footer.tsx            # Disclaimer footer
│   └── ErrorBoundary.tsx     # Error boundary with fallback UI
├── views/
│   ├── HomeView.tsx          # Tools list (cards) — landing page at "/"
│   ├── SearchView.tsx        # World search (Traveller Map) — "/search"
│   ├── RecentWorldsView.tsx  # Visited Worlds tool (sort + edit mode) — "/recent"
│   ├── NearbyView.tsx        # Worlds Near Me (jumpworlds + UWP filters) — "/nearby"
│   ├── PlanetView.tsx        # World detail view — "/planet/{UWP}"
│   ├── FreightView.tsx       # Freight calculator (+ Mail Run) — "/freight"
│   ├── PassengerView.tsx     # Passenger traffic calculator — "/passengers"
│   └── SettingsView.tsx      # Settings page — "/settings"
├── constants/
│   ├── colors.ts             # COLORS, SECTION_COLORS, THEMES (with `as const`)
│   ├── zones.ts              # ZONES, ZONE_COLORS (with `as const`)
│   ├── gameRules.ts          # SIZE_RULES, ATMO_RULES, LAW_RULES, etc.
│   ├── freight.ts            # POPULATION_DM, STARPORT_DM, TONS_PER_LOT_DIE, lotsFromTraffic, etc.
│   ├── mail.ts               # Mail Run constants (rank/soc DMs, container size, etc.)
│   ├── nearby.ts             # Distance/starport/TL/population filter options, jump + fuel + policy options, DEFAULT_FILTERS, DEFAULT_SHIP
│   ├── storage.ts            # STORAGE_KEYS for every localStorage key + isFiniteNumber / isString guards
│   └── passenger.ts          # Passenger DMs, class prices, options
├── hooks/
│   ├── usePersistentState.ts # Generic localStorage-backed state (needs a type guard)
│   ├── useThemeMode.ts       # Theme management with localStorage
│   └── useRecentPlanets.ts   # CRUD for recent planets (MAX_RECENT_PLANETS inlined)
├── utils/
│   ├── routing.ts            # URL parsing and building (home, search, freight, passengers, settings, planet)
│   ├── uwp.ts                # UWP parsing and validation (`parseUwp`)
│   ├── freight.ts            # calculateFreight (DM breakdown + lot rolling)
│   ├── mail.ts               # calculateMail (Mail Run)
│   ├── nearby.ts             # hexDistance, uwpFacts, withDistance, filterWorlds, canRefuel, jumpsFromOrigin
│   ├── passenger.ts          # calculatePassengers
│   ├── travellerMap.ts       # searchWorlds() + fetchWorldZone() + fetchJumpWorlds() → Traveller Map API
│   ├── jumpMapImage.ts       # jumpMapUrl() + jumpMapScale() + projectOnJumpMap() → /api/jumpmap image geometry
│   ├── contractImage.ts      # renderContractImage() → paints a ContractData onto a canvas, returns a PNG blob
│   ├── format.ts             # localeFor() + formatCredits() + formatTons() — the only number formatting in the app
│   ├── planetToWorldInputs.ts # Maps a RecentPlanet to Passenger/Freight world inputs
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
npm run dev       # Start dev server (usually http://localhost:5173)
npm run build     # Build for production (outputs to dist/)
npm run preview   # Preview production build
npm run typecheck # Type check without emitting files (tsc --noEmit)
```

## Key Concepts

### UWP Code Format
A UWP code is 8 characters: `A123456-7`
- Position 0: Starport class (A-E, X)
- Positions 1-6: Hex digits for Size, Atmosphere, Hydrographics, Population, Government, Law Level
- Position 7 (after dash): Tech Level

### URL Routing
- `/` — Home (tools list, `HomeView`)
- `/search` — World search (`SearchView`)
- `/recent` — Visited Worlds (`RecentWorldsView`) — its own view, not an alias
- `/nearby` — Worlds Near Me (`NearbyView`)
- `/passengers` — Passenger Traffic (`PassengerView`)
- `/freight` — Freight Calculator + Mail Run (`FreightView`)
- `/settings` — Settings (`SettingsView`)
- `/planet/{UWP}` — World detail (`PlanetView`, e.g. `/planet/A123456-7`)

The router is hand-rolled (no library) in `utils/routing.ts` and `App.tsx` manages the `ViewType` state plus `popstate` for browser back/forward. The `ViewType` union is duplicated in every view file for locality — when you add a new route/view, update every union (App, Navbar, all view files) plus `parseUrl`/`buildUrl` in `utils/routing.ts`. The Navbar logo calls `goHome` (clears the working UWP/name/zone state and navigates to `/`).

### Freight Calculator (Mongoose 2e rules)

Lives in `src/views/FreightView.tsx`, `src/utils/freight.ts`, `src/constants/freight.ts`, `src/types/freight.ts`.

Flow:
1. User names the ship and declares its cargo bay (**Nave** section, first on the page), then picks origin/destination world properties (population, starport, TL, zone), parsec distance, broker skill effect, on-time delivery.
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

## Visual Design System (Traveller 2026 manual aesthetic)

The whole app must look like an extension of the Mongoose Traveller 2026 Core Rulebook. Always follow these rules when adding or refactoring UI:

### Palette (`src/constants/colors.ts`)
- **Traveller orange `#D4521C`** is the dominant accent. Use `COLORS.primary` for: section header lines, separators, primary buttons, focused/active state, key indicators, the app title color, and any single highlighted element. Avoid combining it with other strong saturated colors — it should stand on its own.
- **Space black `#1A1A18`** and **cream `#F1EFE8`** are the canonical dark/light surfaces (`THEMES.dark.bg` / `THEMES.light.bg`). Never reintroduce blue/slate (`#0f172a`, `#1e293b`, etc.) — those were pre-redesign.
- Semantic colors are muted industrial tones (rust, amber, olive, steel) — already in `COLORS.{secondary, warning, danger, success, info, pink, indigo, rose}`. Never reintroduce vivid web colors (`#3b82f6`, `#10b981`, etc.).
- For raw access to the Traveller swatches use the `TRAVELLER` const (`TRAVELLER.orange`, `TRAVELLER.spaceBlack`, `TRAVELLER.cream`). Mirror swatches are also available as CSS variables: `--traveller-orange`, `--traveller-space-black`, `--traveller-cream`.

### Typography
- **Font family is Inter**, loaded once in `index.html` (weights 400 + 500 only). The body sets it as the default — components should use `fontFamily: "inherit"` rather than redeclaring `'Segoe UI', system-ui, sans-serif`.
- **Only two font weights are allowed:** `400` (regular body) and `500` (medium emphasis: titles, labels, button text, totals). Never use `600`, `700`, `800`, `900` or `"bold"`. Visual hierarchy comes from size + color + uppercase + tracking, not weight.
- **Section / capital labels** follow the manual style: `textTransform: "uppercase"`, `letterSpacing: 1–2px`, `fontWeight: 500`, colored in `COLORS.primary` when prominent.
- The page header (`.app-title`) is solid `--traveller-orange`, uppercase, letter-spacing 2px — do not reintroduce gradients.

### Distinctive layout patterns
- **Orange left-border info block** — already the contract of `Section` (`borderLeft: 4px solid color`). Use `Section` for any grouped block; pass `color={COLORS.primary}` (or another industrial section color) for the accent.
- **Dark headers with orange top accent** — when you need a "section header" feeling without using `Section`, add a top border `borderTop: 3px solid ${COLORS.primary}` on a dark/cream surface. Reserve for prominent blocks.
- **Tables**: use the `.traveller-table` CSS class in `src/index.css` (solid orange header + zebra rows tinted with orange). Do not roll a new table style — extend `.traveller-table` if you need variants.

### Iconography
- Current inline SVG icons (`src/components/icons/index.tsx`) follow a flat, single-stroke industrial look — keep that style. New icons must be flat, monochrome, 16×16 default with `aria-hidden="true"` and `marginRight: 6`.
- **Tool banners** (`src/components/banners/index.tsx`) are decorative SVG headers, one per tool, rendered above `PageHeader`. Every one shares the same contract: `viewBox="0 0 800 120"`, `aria-hidden="true"`, the `CornerFrame` brackets, a `> TOOL NAME` monospace ticker top-left and a status ticker top-right. `COLORS.primary` is the single accent — everything else is `theme.text` / `theme.textMuted` / `theme.textDimmed` / `theme.border` so the banner flips with the theme. A new tool gets a new banner in this file, drawing whatever that tool actually reasons about.
- If you need an icon that doesn't exist yet, follow the same outline style (Tabler Icons set is the reference family — replicate that visual language; do not import a heavy icon library).

### When in doubt
- Reach for `COLORS.primary` (orange) first.
- Reach for `fontWeight: 500` (never higher) for emphasis.
- Reach for uppercase + tracking for labels, never bold.
- If a UI element does not match the manual's printed-page aesthetic (vivid web colors, gradients, heavy bold, drop shadows, glow effects, neon hovers), it is wrong — refactor it before shipping.

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
  <IconSearch /> Search
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

### Field (`components/ui/Field.tsx`)
```tsx
import { Field, fieldLabelStyle } from "../components/ui/Field";

// EVERY form control gets its caption through Field. It generates an id with
// useId() and puts it on the <label htmlFor>, so the control has an accessible
// name and clicking the caption focuses it.
<Field label={t("freightCargoBay")} theme={theme}>
  {id => <input id={id} type="number" style={inputStyle} value={cargoBay} onChange={...} />}
</Field>

// `label` is a ReactNode, so a caption can carry a live badge:
<Field theme={theme} label={<>{field.label}<span>({n}D6)</span></>}>
  {id => <input id={id} ... />}
</Field>

// Inside a .map(), pass key to the Field — useId keeps each id unique:
{OPTIONS.map(o => <Field key={o} label={o} theme={theme}>{id => ...}</Field>)}

// fieldLabelStyle(theme) is for captions that head something that is NOT a
// single labelable control — a button that opens a dialog, a checkbox group.
// Those use a <span> plus aria-describedby / aria-label, never a bare <label>.
```

A `<label>` is only correct without Field when it *wraps* its control, which is
how the checkbox rows are written (`<label><input type="checkbox" /><span>…</span></label>`).

### Modal (`components/ui/Modal.tsx`) & ContractModal (`components/ContractModal.tsx`)
```tsx
import { Modal } from "../components/ui/Modal";
import { ContractModal } from "../components/ContractModal";

// Modal is the generic overlay dialog: Escape and backdrop clicks close it, the
// panel takes focus on mount. Use it for any new dialog instead of rolling a new
// fixed-position overlay. `panelClassName` exists so print rules can target it.
<Modal theme={theme} title={t("...")} closeLabel={t("close")} onClose={close} footer={<Button …/>}>
  …
</Modal>

// ContractModal renders the exportable contract/invoice shared by the Freight
// and Passenger calculators. It is presentation only: each view builds a
// `ContractData` (types/contract.ts) with every number ALREADY formatted for the
// current language, so `formatCredits`/`formatTons` stay in the views.
<ContractModal theme={theme} lang={lang} t={t} data={contractData} onClose={close} />
```

Sharing as an image goes through `utils/contractImage.ts`, which paints the same
`ContractData` onto a canvas by hand and returns a PNG blob. It does NOT
rasterise the DOM — the SVG `<foreignObject>` trick drops the Inter webfont and
everything in `index.css`. The sheet is always painted light, since a shared
image has no theme to follow. `ContractModal` then hands the blob to
`navigator.share({ files })` where the browser supports it, and falls back to
downloading the PNG.

Printing is handled by the `@media print` block at the bottom of `src/index.css`:
it hides everything except `.contract-sheet` (the modal panel) and repaints it
light, since the dark theme would print unreadable. Anything inside a contract
that must not reach paper gets `className="contract-no-print"`.

### PageHeader (`components/ui/PageHeader.tsx`)
```tsx
import { PageHeader } from "../components/ui/PageHeader";
import { IconSearch } from "../components/icons";

// Centered gradient h1 (uses `.app-title` class) + optional icon.
// Used by Home, Search, Freight, Passenger, Settings views to keep page titles consistent.
// PlanetView keeps its own header because it includes an editable planet name.
<PageHeader title={t("searchTitle")} icon={<IconSearch />} />
```

### Colors (`constants/colors.ts`)
```tsx
import { COLORS, SECTION_COLORS, THEMES } from "../constants/colors";

// NEVER hardcode colors like "#3b82f6" - use constants:
COLORS.primary    // #D4521C — Traveller orange
COLORS.secondary  // #A03B14 — rust
COLORS.warning    // #E8A23C — industrial amber
COLORS.danger     // #B43F1C — deep red-rust
COLORS.success    // #6B8E3D — muted olive
COLORS.info       // #4A6B7D — steel blue
COLORS.pink       // #C66E4E — terracotta
COLORS.indigo     // #3D4E6B — midnight
COLORS.rose       // #8C4F3B — brick

// Section colors for UWP data
SECTION_COLORS.starport     // primary
SECTION_COLORS.size         // info
SECTION_COLORS.atmosphere   // success
SECTION_COLORS.population   // pink
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
  IconSearch, IconPin, IconBox, IconClock, IconUsers, IconMail,
  IconSettings, IconTrash, IconMenu, IconClose,
} from "../components/icons";

// All icons have aria-hidden="true" and consistent sizing (16x16, marginRight: 6).
// Semantic mapping currently used:
//   IconSearch  → Search World (home card, search view header, navbar entry, search button)
//   IconPin     → Visited Worlds (home card, recent view header, navbar entry)
//   IconBox     → Freight Calculator (home card, freight header, navbar entry, calculate button)
//   IconUsers   → Passenger Traffic (home card, passenger header, navbar entry)
//   IconSettings→ Settings (navbar entry, settings view header)
//   IconTrash   → Delete-world action inside RecentWorldsView edit mode
//   IconRadar   → Worlds Near Me (home card, nearby view header, navbar entry, search button)
//   IconRefresh → "New search" reset button at the bottom of FreightView and PassengerView
//   IconClock   → Currently unused in the UI; kept exported for future use
//   IconMail    → Currently unused: `Section` takes a plain string title, so the
//                 Mail Run block inside FreightView carries no icon
//   IconFileText→ "Export contract" button at the bottom of FreightView and PassengerView
//   IconPrinter → Print action inside ContractModal
//   IconCopy    → Copy-as-text action inside ContractModal
//   IconShare   → Share-as-image action inside ContractModal
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

### Number formatting (`utils/format.ts`)
```tsx
import { formatCredits, formatTons, localeFor } from "../utils/format";

// NEVER call toLocaleString directly and NEVER write `lang === "es" ? "es-ES" : "en-US"`
// — that mapping sends Catalan to the English format (comma thousands separator).
formatCredits(25000, lang)  // "Cr 25.000" (es/ca) · "Cr 25,000" (en)
formatTons(12.5, lang)      // "12,5" (es/ca) · "12.5" (en)
```

Both helpers pass `useGrouping: "always"`. Without it, `es-ES` and `ca-ES` carry
`minimumGroupingDigits: 2` from CLDR and only group from five digits up, so
`9000` printed as "9000" right next to `14000` printed as "14.000". That option
is Intl.NumberFormat V3, which is why `tsconfig.json` includes `ES2023.Intl` in
`lib`; browsers without V3 read it as `true` and fall back to the old behaviour
instead of breaking.

Amounts written into `i18n/translations.ts` by hand (the Mail Run notes) must
match what `formatCredits` produces for that language.

### i18n Helpers (`utils/i18n-helpers.ts`)
```tsx
import type { TranslationFunction } from "../types/i18n";
import { isNoneValue, requiresWarning } from "../utils/i18n-helpers";

// NEVER compare against multiple language strings - use helpers:
// BAD:  value !== "None" && value !== "Ninguno"
// GOOD: requiresWarning(value, t)

<Row warn={requiresWarning(ATMO[parsed.at].equip, t)} />
```

### Traveller Map API (`utils/travellerMap.ts`)
```tsx
import { searchWorlds, type WorldSearchResult } from "../utils/travellerMap";

// Calls https://travellermap.com/api/search?q=<query>
// Filters to items with a `World` key (drops Sector/Subsector matches).
// Returns [{ name, uwp, sector, hex }].
// Hex is formatted as HexX+HexY zero-padded to 2 digits each ("1910").
const results: WorldSearchResult[] = await searchWorlds("Regi", abortSignal);
```

### Jump Map Images (`utils/jumpMapImage.ts`)
```tsx
import { jumpMapUrl, jumpMapScale, projectOnJumpMap } from "../utils/jumpMapImage";

// Builds https://travellermap.com/api/jumpmap URLs. Used by PlanetView (plain
// image) and NearbyJumpMap (image + marker overlay). NEVER hand-build this URL.
const src = jumpMapUrl({ sector, hex, jump: 4, scale: 48, style: "print" });

// Pixels per parsec for a given radius. The endpoint takes a hex size, not an
// image size, so this inverts its output-size behaviour to keep every radius
// near 1000 px wide — and below ~1200x1330, past which the server answers
// `500 Failed to allocate bitmap`.
const scale = jumpMapScale(radius);

// Which pixel of the returned image a world falls on, so markers can be drawn
// over it. Pass the image's *measured* naturalWidth/naturalHeight, not a
// predicted size. Origin-relative, so the map's absolute translation drops out.
const { x, y } = projectOnJumpMap(world, origin, scale, width, height);
```

The projection was recovered from the SVG rendering of the same URL and verified
against `/api/jumpworlds` across jumps 1–12, scales 24–200, even/odd origin
columns and sector-crossing maps — every world within half a pixel. It is *not*
a documented contract; if Traveller Map changes its renderer the markers drift,
so keep the derivation comment in that file intact.

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

// The ship name lives in STORAGE_KEYS.shipName and is SHARED by the freight and
// passenger calculators — it is the same ship, so naming it in one names it in
// the other. Like the rest of the ship/crew data it survives the reset button.

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
```

There is no `types/index.ts` barrel — always import from the specific module.

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
5. **NO duplicate Navbar props** - Pass via `commonProps` spread in App.tsx (must include `goHome`)
6. **NO hardcoded game thresholds** - Use `SIZE_RULES`, `LAW_RULES`, etc.
7. **NO multi-language string comparisons** - Use `requiresWarning(value, t)`
8. **NO ad-hoc Traveller Map calls** - Use `searchWorlds()` from `utils/travellerMap.ts` (handles URL, `AbortController`, and Sector/Subsector filtering), and `jumpMapUrl()` from `utils/jumpMapImage.ts` for `/api/jumpmap` image URLs
9. **NO duplicating theme/localStorage logic** - Use `useThemeMode` and `useRecentPlanets` hooks
10. **NO missing ErrorBoundary** - App must be wrapped in ErrorBoundary in main.tsx
11. **NO ad-hoc page titles** - Use `<PageHeader title=... icon=... />` so every page shares the same gradient h1 (PlanetView is the only exception — it has an editable name input header)
12. **NO hardcoded freight tables** - Use `TONS_PER_LOT_DIE`, `POPULATION_DM`, `lotsFromTraffic`, etc. from `constants/freight.ts`
13. **NO live re-rolling of dice during render** - The freight lot d6 are rolled once inside `handleCalculate` on button click; do not call `Math.random` inside `useMemo` or render
14. **NO ad-hoc number formatting** - Use `formatCredits`/`formatTons` from `utils/format.ts`; never call `toLocaleString` in a view
15. **NO `<label>` next to its control** - A `<label>` that neither wraps its control nor carries `htmlFor` leaves the control with no accessible name. Use `<Field>`; wrap the control only for checkboxes

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
npm run typecheck  # Type check - MUST pass with no errors
npm run build      # Build check - MUST succeed
```

`vite build` does not type-check, so the build succeeding proves nothing about
types — both commands have to run. CI runs the same pair before deploying.

### After UI changes:
- `/check-responsive` - Verify responsive design works on all screen sizes
- `/check-a11y` - Verify accessibility compliance

### After updating dependencies:
- `/update-badges` - Sync README.md badges with package.json versions
- **Update the Tech Stack table in this file (CLAUDE.md) too** when a major version of React / TypeScript / Vite / any listed tool changes. Same rule for the README Tech Stack table and the version badges at the top. Docs must reflect the versions that a fresh clone actually installs.

### After bumping version (npm version patch/minor/major):
- `/sync-version` - Sync version in README badges and verify build

### After architecture changes (new tool/view, renamed route, new hook, removed feature):
- Update the tool list in the **Project Overview** section of this file (CLAUDE.md) and the **Available Tools** / **Features** tables in README.md so both docs list every current tool and describe it correctly.
- Update the **Project Structure** tree in CLAUDE.md and the mirrored tree in README.md when you add, remove or rename a file listed there.
- Update the **URL Routing** block in CLAUDE.md when a route is added, removed or repurposed.
- Update the **Iconography** semantic mapping (icons block in CLAUDE.md) when the icon assigned to a tool changes or a new icon is added.
- The pattern the codebase enforces is: **whatever a fresh reader would learn from CLAUDE.md and README.md must still be true after your change.** If a change makes an existing sentence wrong or misleading, edit that sentence in the same commit.

These checks ensure the app works well on mobile devices, is accessible to all users, and documentation stays current.

## Important Notes

- This is an unofficial fan project, not affiliated with Mongoose Publishing
- Game data (starports, atmospheres, freight tables) is from Mongoose Traveller 2e SRD / Core Rulebook
- Planet lookup relies on the public [Traveller Map](https://travellermap.com/doc/api) `/api/search` endpoint (no auth, CORS-enabled) — needs network access, unlike the rest of the app
- The app works offline after initial load (no backend required) except for the Traveller Map search call
- **TypeScript strict mode is mandatory** - Code must compile without errors
- The app is deployed to GitHub Pages; `public/404.html` is the SPA fallback that rewrites unknown paths to `/` so the History-API router can pick them up
