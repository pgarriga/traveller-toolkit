# CLAUDE.md

## Project Overview

Traveller Toolkit - A multi-tool web app for the Mongoose Traveller 2nd Edition tabletop RPG. The home page lists the available tools in three blocks — **Navegación** (Search World, Worlds Near Me, Visited Worlds), **Tránsito** (Passenger Traffic, Freight Calculator) and **Naves** — and the user navigates between them. **Naves** is the odd one out: it does not list a tool, it lists the player's fleet — one card per ship, with its name and its type, the active one badged — plus two last cards: one creates a new ship and one **imports** a `.json` exported from a sheet (`shipFromJson` validates it; anything else leaves a message under the block and nothing enters the fleet). The fleet is **created** from there and only from there — `/ship` is the sheet of one ship, not a ship manager, so it carries no list of the others and no way to add or import one. Switching between ships can also be done from the navbar's dropdown, which lists the same fleet. A block with a single tool is fine; the grouping says what each tool is for, not how many there are. Current tools:
- **Search World** — searches official Traveller worlds by name via the [Traveller Map](https://travellermap.com) API (`/api/search`). Selecting a result jumps to World Detail and auto-saves the world to Visited Worlds.
- **Visited Worlds** — standalone tool at `/recent` listing the worlds you've visited (persisted in `localStorage`). Sortable dropdown, Edit/Done toggle for per-card deletion, colored tags per UWP attribute.
- **Worlds Near Me** — standalone tool at `/nearby`. Pick the world you are on, describe your ship (jump rating, fuel range, fuel it accepts), set UWP filters (max distance, minimum starport, TL, population, travel zones) and get the matching worlds, sorted by number of jumps (parsec distance and name break ties, unreachable worlds last). Each result also shows the minimum number of jumps to reach it along a route where the ship never runs out of fuel. `jumpsFromOrigin` searches over `(world, fuel left)` states, not just worlds, so a ship with tankage for several jumps can cross a system with no fuel in it. The `FuelPolicy` (`refined` = starports A/B, `unrefined` = also C/D, `wilderness` = also gas giants and oceans) decides where the ship will refuel; a world it cannot refuel at is still crossed when the fuel range allows. Data comes from the Traveller Map `/api/jumpworlds` endpoint. Below the results table sits a **jump map**: the official `/api/jumpmap` PNG with an SVG ring overlaid on each world that passed the filters (see `utils/jumpMapImage.ts`).
- **Passenger Traffic** — rolls High / Middle / Basic / Low passenger availability with the Mongoose 2e DMs and computes income. The **Nave** section (first on the page) names the ship and declares how many berths it sells of each class; that count caps the seat selection, and 0 means the class cannot be taken at all. An **View contract** button opens a passage contract listing every booked seat, headed by the ship's name.
- **Freight Calculator** — computes traffic DMs, rolls lots, and lets the player pick which lots to buy up to their cargo bay capacity. Includes an integrated Mail Run block. An **View contract** button opens an invoice with the accepted lots and mail containers, headed by the ship's name.
- **My Ship** — standalone tool at `/ship`: a **fleet** of ships, each one an editable sheet reproducing the stat block the rulebook prints, split across four tabs. A ship is **created** before it can be edited — `ShipCreateModal` asks for a name and a type, and the type (one of the 24 rulebook designs, or *personalizada* for a blank sheet) is chosen there and **only** there. Afterwards the sheet shows the type locked and lets the player edit everything else; another type means another ship. Exactly one ship is **active** at a time, and it is the one the Freight and Passenger calculators read. **Perfil** carries the identity (the locked type, name, designation, TL, hull tonnage and hull points), free notes, and then three read-only cards in the order the ship is asked about: **Motores** (thrust and jump number, each with what its rows weigh), **Potencia** and **Bodega de carga** (used and free). There is no summary card: a list of figures already shown on their own tabs said nothing that its own tab did not say better. **Detalles** is the component sheet itself — hull, armour, M-drive, J-drive, power plant, fuel, bridge, computer, sensors, systems, software, weapons, ammunition, craft, staterooms, common areas and cargo, each line with its own tonnage — and, in the accommodation card alone, its own quantity — grouped into ten cards (`SHIP_SECTION_GROUPS`) that keep hull, drives and power plant apart, split the systems into the fixed set every ship carries (bridge, computer, sensors) and the open one it may add to (`systems`), and keep accommodation, cargo and craft apart from each other too. The ship's **total tonnage** (`hullTons`) is edited from Perfil only: that number is the whole ship, not a component, which is why Detalles carries no copy of it. **Tripulación** holds, in that order, the crew the *design* requires (a text line, from the template — it is what the player reads their own list against) and then the roster of who is actually aboard — a real `<table class="traveller-table crew-table">` of name, post and monthly salary, one row per person. Perfil and Detalles lay their content on the same `two-col-grid`, so neither looks wider than the other, but the roster deliberately takes the **whole page width**: it is the ship's muster list, and the more screen there is the more names fit without cramping. Below 640px the table stops being a table (`.crew-table` in `index.css`): the header goes, each row stacks — the name with its bin beside it, the post and the salary underneath — and the placeholders say what each cell is. It is a **sheet, not a designer**: nothing is validated, so a line's tonnage never has to agree with the hull. It carries **almost no money** — no per-line price, no purchase price, no maintenance cost; what the ship cost is not played from here. The one exception is the crew's salary, which is paid every month whether or not the freight pays. Any of the 24 "Common Spacecraft" designs (pp. 189-228) can be the ship's type, from `constants/shipTemplates.ts`, and `constants/shipParts.ts`, a catalogue harvested from those same 24 designs, feeds both each section's "add" menu and the suggestions of every component field. Hull, armour, M-drive, J-drive, power plant, fuel, bridge, computer and sensors (`FIXED_SECTIONS`) have no "add" menu: a ship carries one set of each, so those lines are edited, not added — the section that takes extras one at a time is `systems`, which is why it has a card of its own (**Otros sistemas**) instead of sharing one with the bridge, the computer and the sensors: next to three lines that can only be corrected, the one place where something can be added did not read as one. The delete buttons are off by default behind a **Eliminar filas** toggle that belongs to **one card**, not to the tab: a small bin sitting right beside that section's "+ Añadir" menu (`ShipSectionEditor`'s `removeToggle` slot), because putting a line in and taking one out are the same job and are done from the same place. `removeIn` holds the set of cards currently switched on — removing a line is business of the card the line is in, so a single switch at the top lit bins in all ten to delete one. Every section with a row that can actually go (`sectionCanRemove`) draws the switch beside its own add menu, so nobody has to travel up to another section's line to turn the bins on. They all switch the same thing and light up together, because the column belongs to the card (`showRemove` is the card's, since `ShipRowHeader` is one header for all its rows). A card with nothing to remove — the fixed set: hull, drives, power, core systems — carries no switch at all and never reflows. Hidden, the bins give up their column (`.ship-sheet-row--removable` in `index.css`) so the component name runs the full width and the tonnage sits flush right. Each card decides its three optional columns (remove, power, quantity) **as a card**, because `ShipRowHeader` is one header for all of its rows; a section that drew a column its header lacks would sit out of line. **Bodega** is the manifest: three metrics at the top —the hold the ship has, what is in it and what is left— and under them a table the player fills with what is being carried right now. `ShipSheet.cargoHold` (a `CargoItem[]`) is that list, and it is **not** `sections.cargo`: that row is the *hole*, the tonnage the design gives over to freight, while this is what is inside it this week — which is why loading a design does not touch it, the same reason a new hull does not come crewed. Free space is the hold (`cargoCapacityTons`, summed from Detalles' cargo rows) minus the sum of the manifest, it is allowed to go **negative**, and when it does it turns `COLORS.warning`: overloading is the player's business and the sheet only says so. Perfil repeats the used/free pair in a card of its own, because that is the number looked at before accepting a lot. The sheet also owns the **cargo bay** and the **passenger berths**, but does not edit them: they are typed into the calculator that uses them, and the cargo bay is read back everywhere from Detalles' own rows — see *Ship data ownership* below.

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
│   ├── passenger.ts          # PassengerInputs, PassengerResult, PassengerClass, ShipBerths
│   └── ship.ts               # ShipSheet, Fleet, TurretBuild, TurretMountId, TurretWeaponId, ShipComponent, CrewMember, CargoItem, ShipSectionKey, ShipRatings, ShipPower, ShipCapacity
├── components/
│   ├── icons/
│   │   └── index.tsx         # SVG icon components (IconSearch, IconPin, IconBox, IconUsers, IconSettings, IconTrash, IconRefresh, IconRadar, IconShip, IconMenu, IconClose, IconFileText, IconDownload, IconUpload, IconShare) + toolIcon()
│   ├── banners/
│   │   └── index.tsx         # Decorative per-tool SVG headers (SearchBanner, RecentBanner, NearbyBanner, PassengerBanner, FreightBanner, ShipBanner)
│   ├── ui/
│   │   ├── Button.tsx        # Reusable button with variants
│   │   ├── Modal.tsx         # Overlay dialog (Escape + backdrop close, focused panel)
│   │   ├── Section.tsx       # Card section with colored border
│   │   ├── Row.tsx           # Label-value row for data display
│   │   ├── Field.tsx         # Labelled form control (useId → label htmlFor) + fieldLabelStyle
│   │   ├── PageHeader.tsx    # Shared centered gradient h1 + optional icon
│   │   ├── Tabs.tsx          # ARIA tablist (arrow keys, roving tabindex); the panels are the caller's
│   │   ├── JumpsEditor.tsx   # JumpCountField + JumpsBreakdown + distributeJumps (Freight/Passenger)
│   │   └── WorldPicker.tsx   # Visited-worlds dropdown + inline Traveller Map search
│   ├── ContractModal.tsx     # Printable contract/invoice sheet built from a ContractData
│   ├── ShipCreateModal.tsx   # New-ship form: name + type (the only place the type is chosen)
│   ├── TurretBuilderModal.tsx # Fits a turret: mount + pop-up + one weapon per slot
│   ├── ShipSectionEditor.tsx # One stat-block row of the My Ship sheet (+ ShipRowHeader)
│   ├── NearbyJumpMap.tsx     # Traveller Map jump-map image + filter-match ring overlay
│   ├── Navbar.tsx            # Navigation bar (desktop + mobile, with a11y)
│   ├── Footer.tsx            # Disclaimer footer
│   └── ErrorBoundary.tsx     # Error boundary with fallback UI
├── views/
│   ├── HomeView.tsx          # Tools list (cards in three groups) — landing page at "/"
│   ├── SearchView.tsx        # World search (Traveller Map) — "/search"
│   ├── RecentWorldsView.tsx  # Visited Worlds tool (sort + edit mode) — "/recent"
│   ├── NearbyView.tsx        # Worlds Near Me (jumpworlds + UWP filters) — "/nearby"
│   ├── PlanetView.tsx        # World detail view — "/planet/{UWP}"
│   ├── ShipView.tsx          # My Ship (editable ship sheet) — "/ship"
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
│   ├── tools.ts              # TOOL_GROUPS: the tool list the home index and the navbar menu share
│   ├── storage.ts            # STORAGE_KEYS for every localStorage key (`fleet`, `theme`, `lang`; `ship`/`shipName` are legacy) + isFiniteNumber / isString guards
│   ├── ship.ts               # SHIP_SECTION_GROUPS, FIXED_SECTIONS, QTY_SECTIONS, SENSOR_GRADES, SHIP_TABS, emptySections
│   ├── shipParts.ts          # Component catalogue: My Ship "add" menus + field suggestions
│   ├── turrets.ts            # TURRET_MOUNTS + POP_UP_MOUNT + TURRET_WEAPONS (the two rulebook tables)
│   ├── shipTemplates.ts      # The 24 rulebook designs, as i18n keys + printed numbers
│   └── passenger.ts          # Passenger DMs, class prices, options
├── hooks/
│   ├── usePersistentState.ts # Generic localStorage-backed state (needs a type guard)
│   ├── useThemeMode.ts       # Theme management with localStorage
│   ├── useRecentPlanets.ts   # CRUD for recent planets (MAX_RECENT_PLANETS inlined)
│   └── useShip.ts            # The fleet: create/import/select/delete + the active ship's sheet
├── utils/
│   ├── routing.ts            # URL parsing and building (home, search, freight, passengers, settings, planet)
│   ├── uwp.ts                # UWP parsing and validation (`parseUwp`)
│   ├── freight.ts            # calculateFreight (DM breakdown + lot rolling)
│   ├── mail.ts               # calculateMail (Mail Run)
│   ├── nearby.ts             # hexDistance, withDistance, filterWorlds, jumpsFromOrigin
│   ├── passenger.ts          # calculatePassengers
│   ├── turret.ts             # turretTotals, turretLabel, turretComponent → a fitted turret as a sheet row
│   ├── ship.ts               # emptyShip, newShip, shipTypeName, componentFromPart, withQuantity, cargoCapacityTons, withCargoTons, newCargoItem, cargoUsedTons, shipPowerRequirements, isShipSheet, isFleet
│   ├── travellerMap.ts       # searchWorlds() + fetchWorldZone() + fetchJumpWorlds() → Traveller Map API
│   ├── jumpMapImage.ts       # jumpMapUrl() + jumpMapScale() + projectOnJumpMap() → /api/jumpmap image geometry
│   ├── contractImage.ts      # renderContractImage() → paints a ContractData onto a canvas, returns a PNG blob
│   ├── download.ts           # saveFile() — the one anchor dance, shared by the contract image and the ship export
│   ├── shipExport.ts         # shipJsonFile() + shipFromJson() → the sheet as a .json, and back
│   ├── format.ts             # formatCredits() + formatTons() — the only number formatting in the app
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
- `/ship` — My Ship (`ShipView`)
- `/freight` — Freight Calculator + Mail Run (`FreightView`)
- `/settings` — Settings (`SettingsView`)
- `/planet/{UWP}` — World detail (`PlanetView`, e.g. `/planet/A123456-7`)

The router is hand-rolled (no library) in `utils/routing.ts` and `App.tsx` manages the `ViewType` state plus `popstate` for browser back/forward. The `ViewType` union is duplicated in every view file for locality — when you add a new route/view, update every union (App, Navbar, all view files) plus `parseUrl`/`buildUrl` in `utils/routing.ts`. A new **tool** goes in `constants/tools.ts` (`TOOL_GROUPS`), which is the one list behind both places navigation is shown: the home index and the navbar's dropdown. They had a copy each and drifted — the menu listed Visited Worlds last, beside Settings, while the index had it with the navigation tools. The index adds what only it needs (a description and an accent per card, in `TOOL_CARDS`). The **ships** group carries no tools at all (`tools: []`): it lists the **fleet**, which is not known ahead of time, so whoever draws it puts the ships in — the index as a card per ship plus create and import, the menu as an entry per ship that selects it and opens its sheet. There is no generic "Mi nave" entry, because it does not say which of yours it is. Settings is in neither list: it is not a tool, so the menu puts it after a rule and the index does not show it at all. The Navbar logo calls `goHome` (clears the working UWP/name/zone state and navigates to `/`).

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

### My Ship (the ship sheet)

Lives in `src/views/ShipView.tsx`, `src/components/ShipSectionEditor.tsx`,
`src/hooks/useShip.ts`, `src/utils/ship.ts`, `src/constants/{ship,shipParts,shipTemplates}.ts`,
`src/types/ship.ts`.

**A ship is created, then edited.** `ShipCreateModal` asks for the two things
that have to exist before there is a ship at all: a name and a type. The type is
one of the 24 rulebook designs — which fills the whole sheet in — or *nothing*
(`templateId: null`), which starts it blank. It is chosen **once**: the sheet
then prints it as a read-only row with a hint saying so, and there is no design
loader any more. Changing it would replace every component of a sheet the player
has already edited, which is not editing a ship, it is creating another one — so
that is exactly what the UI offers. Do not re-add a template picker to the sheet.

**There is a fleet, and one active ship.** `Fleet` (`types/ship.ts`) is
`{ ships, activeId }` under `STORAGE_KEYS.fleet`, and `useShip()` is the only
door to it: `createShip` / `importShip` / `selectShip` / `deleteShip`, plus
`setShip` and the capacity setters, which all act on the **active** ship. `ship` is `null` while
the fleet is empty — `ShipView` then shows nothing but the invitation to create
one, and the two calculators replace their **Nave** fields with the same button.
There is one active ship rather than a per-calculator choice because Freight and
Passenger ask "how big is my hold?", and that question has to have one answer.

The fleet is created and imported **from the home page**, and listed —for
switching— there and in the navbar's dropdown, which shows one entry per ship
instead of a generic "Mi nave". `ShipView` is the sheet of the active ship and
nothing else: it never lists the other ships, and its only call to `createShip`
is the empty-fleet invitation, because until a ship exists there is no sheet to
draw. Do not put a ship switcher or a "new ship" button back into the sheet.

`Navbar` therefore calls `useShip()` itself. Two live components on the same
`usePersistentState` key used to drift apart —each keeps its own copy— so the
hook now notifies the others from its write effect, and they take the new value
if their own type guard accepts it. Without that, renaming a ship in the sheet
left the navbar showing the old name until something unmounted it.

The two actions that belong to **this** ship rather than to the fleet live in
**Perfil only**, right-aligned just above the Notas card, as small `ghost`
buttons: they are used once in a while, and at full width across the foot of
every tab they shouted over the sheet. **Exportar nave** downloads it and
**Eliminar nave** (the only one carrying `COLORS.danger`, on its text) removes
it. Deleting activates the next ship, or —if it was the last one— drops the view
back to the create screen on its own, because there is then no sheet to draw.

**It is a sheet, not a designer.** It reproduces the layout of the rulebook's
stat block and lets the player edit every cell: no tonnage rule is applied, no
total is enforced, and a row's tonnage does not have to agree with the hull.
There is no card adding the rows up either — `shipTotals` existed for one and
went with it — so treat any request to "fix" a tonnage total by computing it as
a change of scope, not a bug fix.

**The one exception is the power requirements**, which the sheet does compute
(`shipPowerRequirements` in `utils/ship.ts`), because the rulebook states them as
closed formulas rather than as a design budget: 20% of hull tonnage for basic
ship systems, 10% of hull tonnage per point of Thrust (×0.25 at Thrust 0, nothing
at all for a reaction drive) and per jump number, plus whatever the sensor grade
and the individual weapons draw. The result is rounded **up** — that is what the
book does (the 95 t passenger shuttle needs 9.5 and its sheet prints 10). It is
still a read-out: it answers "does the plant cover this?" but enforces nothing —
a ship that does not power its own drives saves and loads like any other — and
the box is not editable, because every input it needs is a field of its own.

The box reads as a row of **metrics**, not label-value rows: what the plant
produces — its tonnage times the energy per ton of its type (`POWER_PLANTS`) — as
one large orange figure on the `.metric-grid--lead` tile, with the five-way
breakdown of what each system draws plain underneath. That breakdown asks for
five columns by number (`.metric-grid--breakdown`), not by minimum width: sized
by width, the card's own width decided how many fitted and the sensors dropped to
a second row on their own.

**There is deliberately no single total of what the ship needs**, and `ShipPower`
has no `total` field to render one. Adding the five up would assume the ship runs
everything at once, which it does not: the rulebook expects power to be diverted
from the rest of the ship in order to jump, so the sum would be wrong the moment
the ship did anything.

What the box does total is `ShipPower.modes`, the **two configurations the ship
is actually flown in**, each with what the plant produces printed beside it:

| Mode | What draws power |
|------|------------------|
| **Modo combate** | everything except the jump: basic + m-drive + sensors + weapons |
| **Modo salto** | the jump drive and basic systems, with the rest shut down |

Those two, and only those two, are compared against the plant (`powerMode` in
`ShipView`): within it the figure is `COLORS.success`, over it `COLORS.warning`
(amber, not red: a ship that cannot jump with its guns hot is an ordinary ship,
and `COLORS.primary` is spoken for as the sheet's accent), and with no power
plant chosen it stays `theme.text`, because a blank sheet has nothing to fail
against. It is the one comparison on the whole sheet and it is
still not a validation — nothing stops the player saving a ship that cannot power
its own jump. Do not add a third mode, a sum of the five, or a warning that
blocks anything.

The inputs live in `ShipSheet.ratings` (`thrust`, `reaction`, `jump`, `sensors`,
`powerPlant`), edited from those sections' own rows in Detalles, plus `hullTons`
and the `power` on each weapon/ammunition row — which a fitted turret computes
from the mount and weapon tables, and which `ShipPart.power` seeds on the lines
that are still free text. `ShipSheet`
no longer stores a `power` block and `ShipTemplate` no longer transcribes one:
the numbers the book prints are reproduced from the ratings instead of copied.
All 24 reproduce their printed plant output exactly, and every design whose
printed sheet gives a weapons figure comes out exactly right (patrol corvette 28,
mercenary cruiser 8, launch 1); the handful that differ are listed, with the
reason, at the top of `shipTemplates.ts`.

The rows of the drives, the power plant and the sensors carry **no free-text
name**: a selector fills that cell (`ratingCell` in `ShipSectionEditor`), because
those lines *are* their rating ("Propulsión 2", "Salto-2", "Fusión (NT12)",
"Grado militar") and a text field beside the selector could only contradict the
number the calculation uses. Picking an option writes that same name as the row's
label, and `shipFromTemplate` writes it too, so a loaded design and a hand-picked
one read identically.

Picking a Thrust or a jump number also **prefills that row's tonnage** from the
drive-potential tables (`M_DRIVE_RATINGS` / `J_DRIVE_RATINGS`): a percentage of
the hull, plus `J_DRIVE_BASE_TONS` for the jump drive. That is a prefill, not a
rule — the cell stays editable, and nothing recomputes it behind the player's
back, not even a later change to `hullTons`. The percentages reproduce 23 of the
24 printed m-drive tonnages and 12 of the 13 jump ones (the odd one out is the
donosev, whose own line contradicts itself); the flat 5 t is not in the table but
is what every one of those twelve sheets adds.

`hullTons` is the ship's whole tonnage, not a component's, so it is **not** one
of the rows: it is a field of its own, edited from Perfil. Putting it in the hull
row's `tons` cell would count the ship twice.

**Exporting is the sheet itself, not a rendering of it.** `shipJsonFile`
(`utils/shipExport.ts`) writes the stored `ShipSheet` as JSON with no wrapper
around it, so the file is exactly what `isShipSheet` already validates — and that
is all the import needs to know. `shipFromJson`, in the same file, is the way
back: parse, validate, and hand the sheet a **new id**, because importing another
player's ship —or your own twice— would otherwise put two ships under one key in
the fleet, and then neither the list nor `activeId` knows which one it means.
What the file lacks (a section, the hold, the salary: whatever was added since it
was exported) is not filled in there — `normalise` in `useShip` already does that
for every ship in the fleet. Exporting is an action of **this** ship, so it lives
in Perfil; importing founds a ship, so it lives with the fleet, on the home page.

**Weapons are fitted, not picked off a list.** The rulebook crosses two tables —
four mounts (fixed, single, double, triple, `TURRET_MOUNTS`) plus the pop-up
extra, and five turret weapons (`TURRET_WEAPONS`), both in `constants/turrets.ts`
— and a turret holds up to three of them, which may differ. The **barbette** is
a fifth entry in the same mount list, but it is not a mount that gets filled: it
is five tons that *are* a weapon, chosen from its own table
(`BARBETTE_WEAPONS`, the eight the manual prints). That is what `weapons:
"barbette"` selects and what `namedByWeapon` means — the row is called "Barbeta
de partículas", not "Barbeta (barbeta de partículas)", and it has no weapon
line under it because its weapon is already its name. A menu of ready-made
pieces cannot offer that, so the weapons section's **+ Añadir** is the same
control every other section has with different entries inside it: **Montar
torreta** and **Montar barbeta** (`builders`), which open the same dialog
(`TurretBuilderModal`) on one table or the other instead of inserting a part.
Pick the mount, fill each slot, and `utils/turret.ts` turns it into a row. Adding
is adding — two orange buttons where every other card has a menu made the weapons
card read as something else — but the rule holds: a section that passes
`builders` never offers the catalogue, because that is not how a weapon gets onto
the sheet. The prices of both tables are **not**
transcribed, for the same reason as everywhere else on this sheet.

**A fitted turret is the one row on the sheet that is not free text.** The row
keeps the whole choice in `ShipComponent.turret` (a `TurretBuild`), and Detalles
draws it read-only **in the same field boxes as every other row** —same
background, same border, the text greyed to say it is not typed (`readOnlyCell`)—:
the mount on its own line with the tonnage and the *total* power, and under it one
line per weapon fitted, dimmed and box-less (`subCell`), each with its own power.
Without those boxes its numbers floated loose beside the ones that are written by
hand, and the weapons card read as if it came from another sheet.
Clicking the mount reopens the same dialog on that turret and saving replaces the
row in place, keeping its id. Nothing about it is typed by hand, because the
name, the tonnage and the power all come out of the choice — a text field beside
them could only contradict it, which is the same reason the drives carry a
selector instead of a name. Every other weapon line (from a template, from the
catalogue, written by hand) stays free text, and `ShipComponent.turret` is
`undefined` there.

The pop-up mount is a `+1 t, +0 Power, TL10` on top of a turret, and that is how
`POP_UP_MOUNT` stores it — but it is **not** a checkbox in the dialog. What a
player buys is "a pop-up double turret", so each turret appears twice in the one
mount list, and the variant's name is a translation key of its own
(`popUpLabelKey`): Spanish puts the adjective after the noun and English before
it, so a "{mount} + suffix" assembled in code could only be right in one of
them. The fixed mount has no variant — it is built into the hull, which is the
opposite of popping out to shoot.

**There is no money on the component sheet.** No price per line, no purchase
price, no maintenance cost, and `ShipComponent` has no `price` field to put one
in. This is a deliberate product decision, not an omission: the sheet answers
"what does the ship carry, and how much room does it take". Do not reintroduce a
price column, and do not transcribe the rulebook's prices into
`shipTemplates.ts`.

The **crew's salary** (`CrewMember.salary`, in credits per month) is the single
exception, and it is not the same kind of number: what the hull cost is a fact
about a purchase nobody at the table replays, while the payroll comes due every
month whether or not the run paid. Nothing sums it and nothing compares it with
the freight income — it is a datum of each person, like their post.

Three layers, and they only meet once:

1. `constants/shipTemplates.ts` — the 24 rulebook designs as **i18n keys plus the
   printed numbers**, plus each design's `thrust`/`jump`/`sensors` ratings. No
   prose is written in Spanish here.
2. `constants/shipParts.ts` — the catalogue behind each section's "add" menu
   and behind the `<datalist>` suggestions of every component field, harvested
   from those same 24 designs. `tons`/`price` are **per unit** and only
   prefill a new row.
3. `types/ship.ts` — the saved sheet, where every label is **plain text**.

`shipFromTemplate` / `componentFromPart` (in `utils/ship.ts`) are the bridge:
they translate once, at load or insert time, and from then on the sheet is the
player's own document. The weapons section takes a different road at that same
moment (`materialiseWeapon`): a catalogue part that carries a `turret` recipe
(`ShipPart.turret`) becomes a **fitted turret**, not text — the mount from the
recipe, the named weapon repeated in *every* slot the mount has (a triple
pulse-laser turret is three pulse lasers, which is how the book prints it), and
one row per unit of the `×N`. A design that carries an empty mount keeps it
empty: the manual sells them that way, and the player decides what goes in.
The one figure this moved is the gazelle's weapons power, 26 → 56, because its
two particle barbettes now draw the 15 each that their own table gives them. This is why **switching language does not retranslate a
saved sheet** — the same reason it does not rewrite the name the player gave the
ship. Do not add render-time translation of component labels.

**Two different crews.** `ShipSheet.crew` is a text line saying what the *design*
requires ("Piloto, astronavegante, ingeniero") and comes from the template;
`ShipSheet.crewList` is the roster of who is actually aboard —name, post and
monthly salary per person— which only the player fills in. Loading a template overwrites the first and leaves the second
alone — a new hull does not fire anybody. Do not collapse the two: a ship flown
short-handed is the normal case at the table, and the sheet has to be able to
say so.

**Only the accommodation counts units.** `ShipComponent.qty` exists for the two
sections in `QTY_SECTIONS` (`staterooms`, `commonAreas`) and nowhere else:
staterooms, luxury staterooms and low berths are identical repeated pieces — 4 t
each, 0.5 t a low berth — and what changes at the table is *how many*, not what
one takes up. Those rows get a **Cant.** column in Detalles, and the "×10" the
manual prints inside the name becomes that cell instead of part of the label
(`templateComponentLabel(…, withCount: false)`).

`ShipComponent.tons` is still the line's **total**, there as everywhere else.
Typing a quantity multiplies it by what one unit took up, and that unit tonnage
is **not stored**: it comes from dividing the line's total by the quantity it had
("Camarote ×4 · 16 t" → 4 t each), a sum that always agrees because both figures
are saved. A third field could contradict the other two, which is what the rest
of the sheet avoids. It is a calculation on keystroke, not a rule: the total cell
stays editable, a hand-corrected total survives the next quantity change, and
nothing recomputes either number behind the player's back. See `withQuantity` in
`utils/ship.ts`; a sheet saved before the column existed gets its quantity parsed
out of the label once, by `withCountFromLabel`, from `useShip`'s `normalise`.

Everywhere else there is deliberately **no quantity**: the "×2" is part of the
label, as the manual prints it, and a separate multiplier could only contradict
the line's tonnage. Weapons resolve it the other way still: a template's "Torreta
triple (láser de pulsos) ×2" is *two turrets*, so it materialises as two rows of
one turret each. A turret is a thing you fit, aim and lose, not a quantity.

Template data is transcribed **as printed**, not as it should add up. 19 of the
24 designs sum to exactly their hull tonnage; the other five leave space
unassigned in the book itself (the System Defence Boat 4.15 t, the light fighter
0.4 t, the modular cutter 2 t, the passenger shuttle 8 t, and the ferry prints no
cargo figure at all for its 69.15 free tons). Those stay as they are. The only
amendments are where the PDF extraction lost or transposed a value — the slow
pinnace's M-drive columns, for one — and each carries a comment saying so.

### Ship data ownership

The ship's **name**, **cargo bay** and **passenger berths** are properties of the
ship, not of the route being calculated, so there is exactly one copy of each —
and since there is a fleet, all three live *inside* the ship they belong to:

| Datum | Lives in | Edited from |
|-------|----------|-------------|
| Name | `ShipSheet.name` | My Ship, Freight, Passenger |
| Cargo bay (tons) | `ShipSheet.sections.cargo` — summed, not stored | My Ship (Detalles), Freight |
| Berths per class | `ShipSheet.capacity.berths` | Passenger |

All three belong to the **active** ship, all three read and write through
`useShip()`, and the whole fleet is one `STORAGE_KEYS.fleet` entry. The
calculators kept their own input fields, but those fields edit the ship — typing
a cargo bay in Freight changes the sheet.

**The cargo bay is not a stored number.** It is `cargoCapacityTons(ship)`, the
sum of the rows in the `cargo` section — the line the rulebook prints, "Bodega
81 t". It used to be a field of its own *as well*, and that meant two numbers for
one thing: editing the row left the field lying, and nobody could tell which of
the two they were reading. Perfil, the Bodega tab and the Freight calculator all
read that sum now, so changing the row in Detalles changes all three at once.

Freight still has its input, and typing in it writes `withCargoTons` into the
**first** cargo row (creating it, named, if the ship had none). The first and not
all of them: a player who has split the hold into several lines —hold, cold
hold— has a split of their own, and spreading a total over it would be inventing
one. The first row takes whatever the others do not, never below zero.

`ShipTemplate` no longer carries a `cargoTons` either, for the same reason: all
24 designs printed it identically to their own cargo row.

The berths stay a field, because a stateroom cannot be summed into passage
classes: the rulebook does not split one. My Ship has no Capacidades card — it
printed the same numbers a second time, in the one tab where nothing else is a
calculator input. Do not put it back.

`STORAGE_KEYS.ship`, `STORAGE_KEYS.shipName`, `STORAGE_KEYS.freightCargoBay` and
`STORAGE_KEYS.passengerBerths` are **legacy**: `useShip` reads them once, when no
fleet exists yet, and turns whatever it finds into the player's first ship, so
nobody who used an earlier version finds their ship gone. A sheet nobody ever
touched (the blank one that saved itself just by opening the tool) is *not*
migrated — it would start the fleet with a ship the player never created. Never
write to those four keys again.

Picking a design as the ship's type keeps the berths it was created with: the
rulebook does not split staterooms between passage classes, so seeding berths
from a design would be inventing a rule the sheet does not have.

### i18n System
- Auto-detects language from `navigator.language`
- Catalan: ca · Spanish: es, gl, eu · English: everything else
- Translations in `src/i18n/` with `useTranslation()` hook
- **`TranslationKey` is derived, not written.** It is `keyof typeof es` in
  `i18n/translations.ts`, and `types/i18n.ts` only re-exports it. The Spanish
  block is where the UI is written, so its keys *are* the app's keys. English and
  Catalan are annotated `Record<TranslationKey, string>`, so a forgotten
  translation does not compile. (The hand-written union that used to live in
  `types/i18n.ts` was a second copy of the same list, nothing enforced it —`t`
  takes a `string`— and it had drifted 63 keys behind.)
- `t` still takes a `string`, because half the app composes its key
  (`shipCrew_${role}`, a catalogue part's `labelKey`, a section's title). The
  widening happens once, inside `useTranslation`, where a loose key meets the
  typed table. Tightening `t` to `TranslationKey` would mean typing every
  `labelKey` in the constants too — worth doing, not yet done.

### Data Persistence
- The fleet (every ship's sheet plus which one is active) is stored in `localStorage` key: `traveller-fleet`
- `usePersistentState` writes through on `set`, not only in its effect: deleting a ship and going home in the same click unmounts the component in that commit, and neither its effect nor a queued state updater it never re-renders to apply would run. A **plain value** is therefore written to `localStorage` outside React, at event time; only a functional update writes from inside the updater, since it needs the previous value. `useShip`'s `createShip`/`selectShip`/`deleteShip` pass plain values for exactly this reason
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

// All views MUST use this for the disclaimer, and it goes OUTSIDE <main>, in a
// root that carries `className="page-shell"`:
//   <div className="page-shell" style={{ background: theme.bg, ... }}>
//     <Navbar … />
//     <main className="wide-main"> … </main>
//     <Footer theme={theme} t={t} />
//   </div>
// `.page-shell` (index.css) makes the view a flex column of 100dvh whose <main>
// takes the slack, which is what keeps the footer at the bottom of the window on
// a short page instead of floating halfway up it. A view root without that class
// gets a footer that hangs wherever the content ends. The rule gives <main>
// `width: 100%` too, and that line is load-bearing: `.wide-main` centres itself
// with `margin: 0 auto`, and a flex item with both cross-axis margins on `auto`
// does not stretch — it shrinks to its content. Without it every page was as
// wide as whatever it happened to contain.
// It is a full-width band (top rule, card background, centered inner block of
// 720px) and it centres itself, so inside `.wide-main` it would shrink to the
// content column and stop reading as a page footer.
<Footer theme={theme} t={t} />
```

The band carries, centered: the app name in
uppercase orange with the version beside it in a pill (`sr-only` reads it as
"Versión 4.0.0", the pill shows "v4.0.0"), and the disclaimer. **The version is
always on**, in every view — there is no `showVersion` prop any more, because
Settings was the one place nobody looks when they want to say which version they
have open.

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

The contract leaves the app as a PNG, and `utils/contractImage.ts` paints that
image by hand onto a canvas from the same `ContractData`. It does NOT rasterise
the DOM — the SVG `<foreignObject>` trick drops the Inter webfont and everything
in `index.css`. The sheet is always painted light, since a shared image has
no theme to follow. `ContractModal` either saves that PNG or hands it to
`navigator.share({ files })`, falling back to the same download where the
browser cannot share files.

The `@media print` block at the bottom of `src/index.css` has no button behind
it: it is there so the browser's own print command, with the contract open,
produces the sheet alone rather than the page behind a dark overlay. It hides
everything except `.contract-sheet` (the modal panel) and repaints it light.
Controls that must not reach paper carry `className="contract-no-print"`.

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
  IconSearch, IconPin, IconBox, IconUsers,
  IconSettings, IconTrash, IconMenu, IconClose,
} from "../components/icons";

// All icons have aria-hidden="true" and consistent sizing (16x16, marginRight: 6).
// Semantic mapping currently used:
//   IconSearch  → Search World (home card, search view header, navbar entry, search button)
//   IconPin     → Visited Worlds (home card, recent view header, navbar entry)
//   IconBox     → Freight Calculator (home card, freight header, navbar entry, calculate button)
//   IconUsers   → Passenger Traffic (home card, passenger header, navbar entry)
//   IconSettings→ Settings (navbar entry, settings view header)
//   IconTrash   → Delete actions: a world in RecentWorldsView edit mode, a ship
//                 or a crew member in ShipView, a row in the Detalles sheet
//   IconShip    → My Ship (fleet cards on home, ship view header, navbar entry,
//                 create-ship button and the create form's confirm button)
//   IconRadar   → Worlds Near Me (home card, nearby view header, navbar entry, search button)
//   IconRefresh → "New search" reset button at the bottom of FreightView and PassengerView
//   IconFileText→ "View contract" button at the bottom of FreightView and PassengerView
//   IconDownload→ Download actions: the contract image in ContractModal, the
//                 ship's .json in My Ship's Perfil tab
//   IconUpload  → Import a ship: the fleet card on the home page
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
formatTons(22.85, lang, 2)  // "22,85" — ship sheets need two decimals, lots do not
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

// The ship name belongs to the ACTIVE ship inside STORAGE_KEYS.fleet, and the
// freight and passenger calculators read it from there — it is the same ship, so
// naming it in one names it in the other. Like the rest of the ship/crew data it
// survives the reset button.

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
11. **NO ad-hoc page titles** - Use `<PageHeader title=... icon=... />` so every page shares the same gradient h1 (PlanetView is the only exception — it has an editable name input header). The title is normally the tool's name; My Ship passes the **active ship's name** instead, falling back to the tool's when it has none, because that page is the sheet of one ship and the navbar already says which tool it is
12. **NO hardcoded freight tables** - Use `TONS_PER_LOT_DIE`, `POPULATION_DM`, `lotsFromTraffic`, etc. from `constants/freight.ts`
13. **NO live re-rolling of dice during render** - The freight lot d6 are rolled once inside `handleCalculate` on button click; do not call `Math.random` inside `useMemo` or render
14. **NO ad-hoc number formatting** - Use `formatCredits`/`formatTons` from `utils/format.ts`; never call `toLocaleString` in a view
15. **NO `<label>` next to its control** - A `<label>` that neither wraps its control nor carries `htmlFor` leaves the control with no accessible name. Use `<Field>`; wrap the control only for checkboxes
16. **NO computing anything on the ship sheet except the power requirements (including the two mode totals it checks against the plant) and the accommodation quantity** - My Ship validates nothing and derives nothing else (see *My Ship* above). The tonnage total is a read-out, not a constraint; the power box is computed from `ShipSheet.ratings` and is not editable; the only other sum is `withQuantity`, which multiplies an accommodation line's tons when the player types a quantity and leaves the cell editable afterwards
17. **NO money on the ship sheet** - No price column, no purchase price, no maintenance. `ShipComponent` has no `price` field on purpose
18. **NO second copy of the ship's name, cargo bay or berths** - They belong to the active ship, through `useShip()`; see *Ship data ownership*. Never re-add a `usePersistentState` for them in a calculator
18b. **NO way to change a ship's type after it is created** - The type is `ShipCreateModal`'s job and nothing else's. The sheet prints it locked; a different type is a different ship
19. **NO Spanish prose in `shipTemplates.ts`** - Template labels are i18n keys, materialised once by `shipFromTemplate`

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
