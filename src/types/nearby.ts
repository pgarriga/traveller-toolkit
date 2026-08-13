// "Worlds near me" type definitions.
// Data comes from the Traveller Map /api/jumpworlds endpoint.

import type { StarportClass, ZoneCode } from "./uwp";

export interface NearbyWorld {
  name: string;
  uwp: string;
  sector: string;
  hex: string;
  subsector: string;
  zone: ZoneCode;
  allegiance: string;
  stellar: string;
  remarks: string;
  gasGiants: number; // PBG third digit; 0 when absent or unsurveyed
  worldX: number;
  worldY: number;
  distance: number; // parsecs from the origin world
}

// `null` on a numeric field means the UWP digit was not a hex value —
// unsurveyed worlds come back with "?" placeholders.
export interface NearbyUwpFacts {
  starport: StarportClass | null;
  hydrographics: number | null;
  population: number | null;
  techLevel: number | null;
}

/**
 * Where the ship is willing to take on jump fuel. Each rung includes the one
 * above it.
 *
 * - `refined`    — class A and B starports only, the ones selling refined fuel.
 * - `unrefined`  — also class C and D, whose fuel is unrefined.
 * - `wilderness` — also skims it directly from a gas giant or an ocean.
 *
 * A world that cannot fuel the ship is never a barrier on its own: the ship
 * crosses it as long as `fuelRange` covers the next leg.
 */
export type FuelPolicy = "refined" | "unrefined" | "wilderness";

// The player's ship, as far as route planning cares.
export interface ShipProfile {
  jump: number;           // parsecs covered by a single jump
  fuelRange: number;      // jumps the ship can chain on one full tank
  fuelPolicy: FuelPolicy; // where it is willing to take on fuel
}

export interface NearbyFilters {
  maxDistance: number;         // 1–12 parsecs (jumpworlds caps at 12)
  minStarport: StarportClass | null; // null = any; A is the best class
  minTechLevel: number | null; // null = any
  minPopulation: number | null; // null = any
  zones: ZoneCode[];           // travel zones to include
}

export interface NearbySearchState {
  loading: boolean;
  error: string | null;
  origin: NearbyWorld | null;
  worlds: NearbyWorld[];    // every world in range, already sorted by distance
  matches: NearbyWorld[];   // the subset passing the filters
}
