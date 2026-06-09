// Passenger calculator constants (Mongoose Traveller 2e, Seeking Passengers pp. 239-240).

import type {
  ParsecDistance,
  PassengerClass,
  PassengerPopTier,
  PassengerStarport,
  PassengerZoneTier,
} from "../types/passenger";

export const PASSENGER_POP_DM: Record<PassengerPopTier, number> = {
  veryLow: -4,
  mid: 0,
  high: 1,
  veryHigh: 3,
};

export const PASSENGER_STARPORT_DM: Record<PassengerStarport, number> = {
  A: 2,
  B: 1,
  C: 0,
  D: 0,
  E: -1,
  X: -3,
};

export const PASSENGER_ZONE_DM: Record<PassengerZoneTier, number> = {
  green: 0,
  amber: 1,
  red: -4,
};

export const PASSENGER_CLASS_DM: Record<PassengerClass, number> = {
  high: -4,
  middle: 0,
  basic: 0,
  low: 2,
};

// Passage and Freight table (Cr per seat, per parsec distance).
export const PASSAGE_PRICES: Record<ParsecDistance, Record<PassengerClass, number>> = {
  1: { high: 9000, middle: 6500, basic: 2000, low: 700 },
  2: { high: 14000, middle: 10000, basic: 3000, low: 1300 },
  3: { high: 21000, middle: 14000, basic: 5000, low: 2200 },
  4: { high: 34000, middle: 23000, basic: 8000, low: 3900 },
  5: { high: 60000, middle: 40000, basic: 14000, low: 7200 },
  6: { high: 210000, middle: 130000, basic: 55000, low: 27000 },
};

// Passenger traffic table: 2D + DM → number of d6 to roll for seat count.
export const passengersFromTraffic = (roll: number): number => {
  if (roll <= 1) return 0;
  if (roll <= 3) return 1;
  if (roll <= 6) return 2;
  if (roll <= 10) return 3;
  if (roll <= 13) return 4;
  if (roll <= 15) return 5;
  if (roll === 16) return 6;
  if (roll === 17) return 7;
  if (roll === 18) return 8;
  if (roll === 19) return 9;
  return 10;
};

export const PARSEC_OPTIONS: ParsecDistance[] = [1, 2, 3, 4, 5, 6];
export const PASSENGER_POP_OPTIONS: PassengerPopTier[] = ["veryLow", "mid", "high", "veryHigh"];
export const PASSENGER_STARPORT_OPTIONS: PassengerStarport[] = ["A", "B", "C", "D", "E", "X"];
export const PASSENGER_ZONE_OPTIONS: PassengerZoneTier[] = ["green", "amber", "red"];
export const PASSENGER_CLASS_OPTIONS: PassengerClass[] = ["high", "middle", "basic", "low"];

// Input clamps from the spec.
export const BROKER_EFFECT_MIN = -3;
export const BROKER_EFFECT_MAX = 6;
export const STEWARD_SKILL_MIN = 0;
export const STEWARD_SKILL_MAX = 4;