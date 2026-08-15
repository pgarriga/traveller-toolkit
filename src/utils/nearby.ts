import type { StarportClass, ZoneCode } from "../types/uwp";
import type {
  FuelPolicy, NearbyFilters, NearbyUwpFacts, NearbyWorld, ShipProfile,
} from "../types/nearby";
import type { RawNearbyWorld } from "./travellerMap";
import {
  FUEL_STARPORTS, REFINED_STARPORTS, STARPORT_RANK, starportRank,
} from "../constants/nearby";

/**
 * Distance in parsecs between two Traveller Map world-space coordinates.
 *
 * The map is an "odd-q" hex grid: columns run along X and odd columns sit half
 * a hex lower. Converting to cube coordinates makes the distance the usual
 * hex-grid maximum of the three axis deltas.
 *
 * Verified against /api/jumpworlds for jumps 1–6 from Regina, Terra, Zephyr and
 * Marz, including results spanning four sectors: the worlds this returns within
 * N parsecs match the endpoint's own answer exactly.
 */
export const hexDistance = (ax: number, ay: number, bx: number, by: number): number => {
  const toCube = (x: number, y: number): [number, number, number] => {
    const q = x;
    const r = y - (x - (x & 1)) / 2;
    return [q, r, -q - r];
  };
  const a = toCube(ax, ay);
  const b = toCube(bx, by);
  return Math.max(
    Math.abs(a[0] - b[0]),
    Math.abs(a[1] - b[1]),
    Math.abs(a[2] - b[2]),
  );
};

const hexDigit = (c: string | undefined): number | null => {
  if (!c) return null;
  const v = parseInt(c, 16);
  return Number.isNaN(v) ? null : v;
};

/**
 * Pulls out only the UWP fields the filters need.
 *
 * Deliberately not `parseUwp`: that one needs the i18n starport table and
 * rejects the whole code if any digit is odd, while the map serves unsurveyed
 * worlds as e.g. "X???????-?". Here each field degrades to null on its own so a
 * partially unknown world still shows up.
 */
export const uwpFacts = (uwp: string): NearbyUwpFacts => {
  const clean = uwp.replace(/\s/g, "").toUpperCase();
  const sp = clean[0] as StarportClass | undefined;
  const starport = sp && STARPORT_RANK.includes(sp) ? sp : null;
  const dash = clean.lastIndexOf("-");
  return {
    starport,
    hydrographics: hexDigit(clean[3]),
    population: hexDigit(clean[4]),
    techLevel: dash >= 0 ? hexDigit(clean[dash + 1]) : null,
  };
};

/** Stable identity for a world: hexes repeat across sectors. */
export const worldKey = (w: { sector: string; hex: string }): string =>
  `${w.sector}|${w.hex}`;

/**
 * Whether the ship can take on jump fuel here, given how fussy it is about it.
 *
 * Starports A and B sell refined fuel, C and D unrefined; E has no fuel
 * facilities and X is not a starport at all. Only the `wilderness` policy can
 * do anything with those last two, and then only with a gas giant to skim or an
 * ocean to crack. Unsurveyed digits count as nothing — a route must not be
 * promised on data the map does not have.
 */
export const canRefuel = (w: NearbyWorld, policy: FuelPolicy): boolean => {
  const facts = uwpFacts(w.uwp);
  if (facts.starport !== null) {
    if (REFINED_STARPORTS.includes(facts.starport)) return true;
    if (policy !== "refined" && FUEL_STARPORTS.includes(facts.starport)) return true;
  }
  if (policy !== "wilderness") return false;
  if (w.gasGiants > 0) return true;
  return facts.hydrographics !== null && facts.hydrographics > 0;
};

/**
 * Minimum number of jumps from the origin to every reachable world, keyed by
 * `worldKey`.
 *
 * The ship leaves the origin with full tanks and burns one jump's worth of fuel
 * per leg. A world only refills them if the ship can refuel there *and* it sits
 * in an allowed travel zone — an interdicted world is no place to top up.
 *
 * A waypoint does not have to be a fuel stop: the ship crosses a system it
 * cannot refuel at on whatever is left in the tanks, so a `fuelRange` above 1
 * buys reach through empty space. Worlds with no legal route are simply absent
 * from the map.
 *
 * Search state is therefore (world, fuel left) rather than just the world.
 * Topping up is never worse than not doing it, so the ship always refuels where
 * it can and each world carries at most `fuelRange + 1` states. Every jump costs
 * the same, so breadth-first order reaches each world by its shortest route.
 */
export const jumpsFromOrigin = (
  worlds: NearbyWorld[],
  originKey: string,
  ship: ShipProfile,
  allowedZones: readonly ZoneCode[],
): Map<string, number> => {
  const jumps = new Map<string, number>();
  const originIdx = worlds.findIndex(w => worldKey(w) === originKey);
  if (originIdx < 0) return jumps;

  // Neighbour lists up front: the fuel state machine walks the same graph once
  // per fuel level, and recomputing distances inside that loop is the hot path.
  const neighbours: number[][] = worlds.map(() => []);
  for (let i = 0; i < worlds.length; i++) {
    for (let j = i + 1; j < worlds.length; j++) {
      const a = worlds[i];
      const b = worlds[j];
      if (hexDistance(a.worldX, a.worldY, b.worldX, b.worldY) > ship.jump) continue;
      neighbours[i].push(j);
      neighbours[j].push(i);
    }
  }
  const refuels = worlds.map(w => allowedZones.includes(w.zone) && canRefuel(w, ship.fuelPolicy));

  const tank = Math.max(1, ship.fuelRange);
  const stateOf = (world: number, fuel: number): number => world * (tank + 1) + fuel;

  jumps.set(originKey, 0);
  const seen = new Set<number>([stateOf(originIdx, tank)]);
  let frontier: Array<[number, number]> = [[originIdx, tank]];
  let depth = 0;

  while (frontier.length > 0) {
    depth++;
    const next: Array<[number, number]> = [];
    for (const [i, fuel] of frontier) {
      if (fuel <= 0) continue; // stranded: nothing left to jump on
      for (const j of neighbours[i]) {
        const left = refuels[j] ? tank : fuel - 1;
        const state = stateOf(j, left);
        if (seen.has(state)) continue;
        seen.add(state);
        // Breadth-first, so the first sighting of a world is its shortest route.
        const k = worldKey(worlds[j]);
        if (!jumps.has(k)) jumps.set(k, depth);
        next.push([j, left]);
      }
    }
    frontier = next;
  }
  return jumps;
};

/** Adds the distance to each world and sorts nearest first. */
export const withDistance = (
  worlds: RawNearbyWorld[],
  originX: number,
  originY: number,
): NearbyWorld[] =>
  worlds
    .map(w => ({ ...w, distance: hexDistance(originX, originY, w.worldX, w.worldY) }))
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name));

/**
 * Applies the filters. A world with an unknown value for an active filter is
 * excluded: it cannot be shown to satisfy a requirement the player asked for.
 */
export const filterWorlds = (
  worlds: NearbyWorld[],
  filters: NearbyFilters,
  originHex: string,
  originSector: string,
): NearbyWorld[] =>
  worlds.filter(w => {
    // The origin world itself is always in the API response; drop it.
    if (w.hex === originHex && w.sector === originSector) return false;
    if (w.distance > filters.maxDistance) return false;
    if (!filters.zones.includes(w.zone)) return false;

    const facts = uwpFacts(w.uwp);
    if (filters.minStarport !== null) {
      if (facts.starport === null) return false;
      if (starportRank(facts.starport) > starportRank(filters.minStarport)) return false;
    }
    if (filters.minTechLevel !== null) {
      if (facts.techLevel === null || facts.techLevel < filters.minTechLevel) return false;
    }
    if (filters.minPopulation !== null) {
      if (facts.population === null || facts.population < filters.minPopulation) return false;
    }
    return true;
  });
