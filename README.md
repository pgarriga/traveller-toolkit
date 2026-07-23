# Traveller Toolkit

[![Version](https://img.shields.io/badge/Version-3.7.1-blue?style=flat-square)](https://github.com/pgarriga/traveller-toolkit)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A modern, browser-based set of tools for the **Mongoose Traveller 2nd Edition** tabletop RPG. The home page lists the available tools and you jump into the one you need — no install, no backend, works offline once loaded.

> **Note:** This is an unofficial fan-made tool designed to speed up gameplay and let you focus on what really matters — the fun of your sessions. For accurate and complete information, always refer to the official Mongoose Traveller rulebooks.

## Available Tools

| Route | Tool | What it does |
|-------|------|--------------|
| `/` | **Home** | Lists the available tools as cards. |
| `/search` | **Search World** | Looks up official Traveller worlds by name via the [Traveller Map](https://travellermap.com) API and jumps into the world detail with a full UWP breakdown. |
| `/recent` | **Visited Worlds** | Standalone tool listing the worlds you've visited (persisted in `localStorage`). Sortable and editable — see [Visited Worlds](#visited-worlds) below. |
| `/passengers` | **Passenger Traffic** | Rolls High / Middle / Basic / Low passenger availability with the Mongoose 2e DMs and computes income. |
| `/freight` | **Freight Calculator** | Computes traffic DMs between two worlds, rolls lots automatically, and lets you pick which lots to take up to your cargo bay's capacity. Shows income live as you toggle lots. |
| `/settings` | **Settings** | Theme (auto / light / dark) and language (auto / Spanish / English). |
| `/planet/{UWP}` | **World Detail** | Editable world name + UWP + zone, deep-linkable. |

## Features

### Search World
- **Traveller Map lookup** — Type at least 3 characters and query the [Traveller Map](https://travellermap.com) `/api/search` endpoint.
- **Live results** — Each match shows name, UWP, sector and hex.
- **One-click detail** — Selecting a result jumps into the World Detail view with a full UWP breakdown:
  - Starport class, facilities, and services
  - Planet size, diameter, and gravity
  - Atmosphere type, pressure, and required equipment
  - Hydrographics coverage
  - Population scale
  - Government type and common contraband
  - Law level with weapon and armor restrictions
  - Tech level with era equivalents
  - Travel zone warnings (Green / Amber / Red)

### Freight Calculator (Mongoose 2e Core Rulebook)
- **Per-attribute DM breakdown** — Sums population, starport, tech level, zone, parsec penalty and broker effect for origin and destination, with a live preview as you change inputs.
- **Traffic table** — Enter a 2D roll per lot type (Major / Minor / Incidental) and see how many d6 the program will roll for you (e.g. `(3D6)`).
- **Automatic dice rolling** — The "Calculate lots" button rolls the d6 internally. Each die becomes one lot:
  - Major lot tonnage = die value × 10 t
  - Minor lot tonnage = die value × 5 t
  - Incidental lot tonnage = die value × 1 t
- **Lot selection** — Each rolled lot is a clickable chip. Toggle them on/off; the summary updates live with selected tons vs total, cargo-bay fit, and gross/net income.
- **Late-delivery payment** — Optional toggle applies the reference −50% modifier to net income.
- **Gated output** — The "Price per ton", "Available lots" and "Summary" sections only appear after you press "Calculate lots", so the workflow is configure → calculate → pick.

### Visited Worlds
- **Standalone tool** at `/recent` (its own card on the home page, its own navbar entry).
- **Auto-saves** worlds when you visit them; the list survives reloads via `localStorage` (key: `traveller-recent`).
- **Compact cards** with the world name and UWP on one row, and colored tags for Starport class, Atmosphere, Population (Twitter-style K/M/B ranges), Government type and Tech Level.
- **Sort** by most recent, oldest, name (A→Z / Z→A), tech level or population — dropdown at the top of the list.
- **Edit mode** — toggle "Edit" / "Done" to reveal per-card delete buttons. Card navigation is disabled while editing so you don't open a world by accident.
- **Empty state** offers a shortcut back to Search World.

### General
- **Bilingual** — Spanish and English with auto-detection (`es`, `ca`, `gl`, `eu` → Spanish; everything else → English). Manual override in Settings.
- **Themed** — Auto / light / dark theme. Auto follows your system setting.
- **Mobile responsive** — Designed mobile-first; the navbar collapses to a hamburger menu, and lot cards reflow on small screens.
- **Offline ready** — Works entirely in the browser, no server required after first load.
- **Accessible** — ARIA labels, keyboard navigation, focus trap in the mobile menu, screen-reader-only labels where icons stand in for text.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/pgarriga/traveller-toolkit.git

# Navigate to project directory
cd traveller-toolkit

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

## Usage

### Looking up a world

1. From the home page, open **Search World**.
2. Type at least 3 characters of the world name (e.g. `Regi`) and press **Search**.
3. Pick the world from the results — it opens the World Detail view with the full UWP breakdown and is auto-saved to **Visited Worlds** (`/recent`).

### Calculating freight

1. From the home page, open **Freight Calculator**.
2. Configure **Origin** and **Destination** worlds (population, starport, TL, zone).
3. Set **Route** (parsec distance, free cargo bay tons) and **Skills** (broker / streetwise effect from your Average 8+ check).
4. Watch the **Modifiers (DM)** section update live with the base DM.
5. In **Number of lots**, roll 2D in real life per lot type and type each result. The label next to the input tells you how many d6 the program will roll (e.g. `(4D6)`).
6. Toggle **On-time delivery** if you want full payment (otherwise net income gets the late penalty).
7. Press **Calculate lots**. The program rolls the d6 for you and reveals:
   - **Price per ton** (driven by parsec distance)
   - **Available lots** (each chip is one rolled lot, with tonnage)
   - **Summary** (starts at 0 — select the lots you want)
8. Click lot chips to add them to your cargo. The summary tracks selected tons vs total, cargo-bay fit, and income in real time.
9. Press **Calculate lots** again to re-roll the d6 (selection resets).

### UWP Format

A UWP code consists of 8 characters in the format `XNNNNNN-N`:

| Position | Meaning | Values |
|:--------:|---------|--------|
| 1 | Starport | A-E, X |
| 2 | Size | 0-F (hex) |
| 3 | Atmosphere | 0-F (hex) |
| 4 | Hydrographics | 0-A |
| 5 | Population | 0-C (hex) |
| 6 | Government | 0-F (hex) |
| 7 | Law Level | 0-J (hex) |
| 8 | Tech Level | 0-F+ (hex) |

**Example:** `A788899-C` = Class A Starport, Medium size, Standard atmosphere, 80% water, Billions of inhabitants, Civil Service Bureaucracy, High law, Average Stellar tech.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI Framework |
| [TypeScript 7](https://www.typescriptlang.org/) | Type Safety (strict mode) |
| [Vite 8](https://vitejs.dev/) | Build Tool & Dev Server |
| [Traveller Map API](https://travellermap.com/doc/api) | World search + canonical UWP lookup |

No external UI library, no router library — custom components with inline styles, and a hand-rolled router built on top of the History API (`utils/routing.ts`).

## Internationalization

The app automatically detects your browser language:

- **Spanish**: For browsers set to `es`, `ca`, `gl`, or `eu`
- **English**: For all other languages

All UI elements, labels, and game data are fully translated. You can also override the language manually in Settings.

## Project Structure

```
src/
├── components/
│   ├── icons/          # SVG icon components (IconSearch, IconPin, IconBox, IconUsers, ...)
│   └── ui/             # Button, Section, Row, PageHeader
├── constants/          # colors, zones, gameRules, freight, mail, passenger
├── hooks/              # useThemeMode, useRecentPlanets
├── i18n/               # translations (ES/EN) + game data
├── types/              # theme, uwp, i18n, game-data, freight, mail, passenger
├── utils/              # routing, uwp, freight, mail, passenger, travellerMap, i18n-helpers
├── views/              # HomeView, SearchView, RecentWorldsView,
│                       # FreightView, PassengerView, PlanetView, SettingsView
├── App.tsx             # Main orchestration: view state + routing + popstate
├── index.css           # Global styles + responsive breakpoints
└── main.tsx            # Entry point (wraps App in ErrorBoundary)
```

Detailed architectural notes live in [CLAUDE.md](CLAUDE.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Mongoose Publishing** for the Traveller RPG system and the freight rules used by the calculator
- **Traveller Map** for the search + world data API
- The Traveller community for inspiration

---

<p align="center">
  Made with <a href="https://claude.ai/claude-code">Claude Code</a>
</p>
