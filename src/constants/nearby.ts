// "Worlds near me" constants.

import type { StarportClass, ZoneCode } from "../types/uwp";
import type { FuelPolicy, NearbyFilters, ShipProfile } from "../types/nearby";
import { ZONES } from "./zones";

// /api/jumpworlds accepts jump 0–12 and silently clamps anything higher: a
// request for 20 answers with the same worlds as 12, not more. So 12 is a hard
// ceiling on both the scan radius and the distance filter.
export const MAX_JUMP = 12;
export const DISTANCE_OPTIONS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Best to worst. A world passes "min starport X" when its class is at least
// as good as X, so the comparison runs on this array's index.
export const STARPORT_RANK: readonly StarportClass[] = ["A", "B", "C", "D", "E", "X"];

export const starportRank = (sp: StarportClass | null): number =>
  sp === null ? STARPORT_RANK.length : STARPORT_RANK.indexOf(sp);

export const TECH_LEVEL_OPTIONS: readonly number[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];

// Population is an exponent: digit 3 means thousands, 6 millions, 9 billions.
export const POPULATION_OPTIONS: readonly number[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

export const ZONE_FILTER_OPTIONS: readonly ZoneCode[] = [
  ZONES.GREEN as ZoneCode,
  ZONES.AMBER as ZoneCode,
  ZONES.RED as ZoneCode,
];

// Jump drives run from J-1 to J-6 in the Core Rulebook.
export const JUMP_OPTIONS: readonly number[] = [1, 2, 3, 4, 5, 6];

// Starports selling refined fuel. E has no fuel facilities and X is not a
// starport at all, so neither ever supplies the ship.
export const REFINED_STARPORTS: readonly StarportClass[] = ["A", "B"];

// Starports selling fuel of any grade: A and B refined, C and D unrefined.
export const FUEL_STARPORTS: readonly StarportClass[] = ["A", "B", "C", "D"];

// Jumps a ship can chain before the tanks run dry. The standard hull carries
// fuel for a single jump; extra tankage buys the ability to cross a system
// with nothing worth refuelling at.
export const FUEL_RANGE_OPTIONS: readonly number[] = [1, 2, 3, 4];

// Order runs fussiest to least fussy; the picker lists them in this order.
export const FUEL_POLICY_OPTIONS: readonly FuelPolicy[] = [
  "refined",
  "unrefined",
  "wilderness",
];

export const DEFAULT_SHIP: ShipProfile = {
  jump: 2,
  fuelRange: 1,
  fuelPolicy: "unrefined",
};

export const DEFAULT_FILTERS: NearbyFilters = {
  // 12 is the ceiling: /api/jumpworlds silently clamps `jump` there, so a wider
  // filter would quietly return an incomplete answer rather than a bigger one.
  maxDistance: 10,
  minStarport: null,
  minTechLevel: null,
  minPopulation: null,
  // Red zones are interdicted, so they start unchecked.
  zones: [ZONES.GREEN as ZoneCode, ZONES.AMBER as ZoneCode],
};
