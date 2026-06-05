// Freight calculator constants (Mongoose Traveller 2e Core Rulebook)

import type {
  PopulationTier,
  FreightStarport,
  TechLevelTier,
  FreightZoneTier,
  ParsecDistance,
  LotType,
} from "../types/freight";

export const POPULATION_DM: Record<PopulationTier, number> = {
  low: -4,
  mid: 0,
  high: 2,
  veryHigh: 4,
};

export const STARPORT_DM: Record<FreightStarport, number> = {
  A: 2,
  B: 1,
  C: 0,
  E: -1,
  X: -3,
};

export const TECH_LEVEL_DM: Record<TechLevelTier, number> = {
  low: -1,
  mid: 0,
  high: 2,
};

export const ZONE_DM: Record<FreightZoneTier, number> = {
  green: 0,
  amber: -2,
  red: -6,
};

export const LOT_TYPE_DM: Record<LotType, number> = {
  major: -4,
  minor: 0,
  incidental: 2,
};

// Multiplier applied to each 1D6 die value to get tons of that individual lot.
// Mongoose Traveller 2e: Major lot = 1D × 10 t, Minor = 1D × 5 t, Incidental = 1D × 1 t.
export const TONS_PER_LOT_DIE: Record<LotType, number> = {
  major: 10,
  minor: 5,
  incidental: 1,
};

// Mean tons per lot when actual dice are not provided (mean of 1D6 = 3.5).
export const MEAN_TONS_PER_LOT: Record<LotType, number> = {
  major: 35,
  minor: 17.5,
  incidental: 3.5,
};

export const FREIGHT_RATES_PER_TON: Record<ParsecDistance, number> = {
  1: 1000,
  2: 1600,
  3: 2600,
  4: 4400,
  5: 8500,
  6: 32000,
};

// Traffic table: 2D + DM → number of lots to roll
export const lotsFromTraffic = (roll: number): number => {
  if (roll <= 1) return 0;
  if (roll <= 3) return 1;
  if (roll <= 5) return 2;
  if (roll <= 7) return 3;
  if (roll <= 10) return 4;
  if (roll <= 13) return 5;
  if (roll <= 16) return 6;
  if (roll === 17) return 7;
  if (roll === 18) return 8;
  if (roll === 19) return 9;
  return 10;
};

// Reference late payment multiplier (Core Rulebook variable 1D+4 × 10%; -50% reference)
export const LATE_PAYMENT_MULTIPLIER = 0.5;

export const PARSEC_OPTIONS: ParsecDistance[] = [1, 2, 3, 4, 5, 6];
export const POPULATION_OPTIONS: PopulationTier[] = ["low", "mid", "high", "veryHigh"];
export const STARPORT_OPTIONS: FreightStarport[] = ["A", "B", "C", "E", "X"];
export const TECH_LEVEL_OPTIONS: TechLevelTier[] = ["low", "mid", "high"];
export const ZONE_OPTIONS: FreightZoneTier[] = ["green", "amber", "red"];
