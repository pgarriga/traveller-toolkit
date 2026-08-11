import type { TechLevelKey } from "../types/game-data";

// Game rule thresholds from Mongoose Traveller 2e
// Centralized to make rules easy to modify

// Size thresholds
export const SIZE_RULES = {
  LOW_GRAVITY_MAX: 6,    // Size 1-6 = low gravity warning
  HIGH_GRAVITY_MIN: 10,  // Size 10+ = high gravity warning
} as const;

// Atmosphere thresholds
export const ATMO_RULES = {
  DANGEROUS_MIN: 11,     // Atmosphere 11+ = dangerous
  EXOTIC_MIN: 10,        // Atmosphere 10+ = exotic liquid warning
} as const;

// Population thresholds
export const POP_RULES = {
  UNINHABITED: 0,        // Population 0 = uninhabited
  SMALL_COLONY_MAX: 3,   // Population 1-3 = small colony
} as const;

// Law level thresholds
export const LAW_RULES = {
  WEAPONS_RESTRICTED_MIN: 4,  // Law 4+ = weapons restricted
  ARMOR_RESTRICTED_MIN: 8,    // Law 8+ = armor restricted
  MARTIAL_LAW_MIN: 9,         // Law 9+ = martial law
  MAX_LEVEL: 9,               // Law table max index
} as const;

// Tech level ranges for descriptions
export const TECH_LEVELS = {
  PRIMITIVE_MAX: 0,
  PREINDUSTRIAL_MAX: 3,
  INDUSTRIAL_MAX: 5,
  PREATOMIC_MAX: 7,
  EARLY_SPACE_MAX: 9,
  EARLY_STELLAR_MAX: 11,
  MID_STELLAR_MAX: 13,
  // 14+ = advanced stellar
} as const;

// Tech level communication thresholds
export const TECH_COMM = {
  NO_TELECOM_MAX: 2,       // TL 0-2 = no telecommunications
  RADIO_PHONE_MIN: 4,      // TL 4-6 = radio/phone
  RADIO_PHONE_MAX: 6,
  FULL_NETWORK_MIN: 9,     // TL 9+ = full network
} as const;

// Helper to get tech level description key
export const getTechLevelKey = (tl: number): TechLevelKey => {
  if (tl <= TECH_LEVELS.PRIMITIVE_MAX) return "primitive";
  if (tl <= TECH_LEVELS.PREINDUSTRIAL_MAX) return "preindustrial";
  if (tl <= TECH_LEVELS.INDUSTRIAL_MAX) return "industrial";
  if (tl <= TECH_LEVELS.PREATOMIC_MAX) return "preatomic";
  if (tl <= TECH_LEVELS.EARLY_SPACE_MAX) return "earlySpace";
  if (tl <= TECH_LEVELS.EARLY_STELLAR_MAX) return "earlyStellar";
  if (tl <= TECH_LEVELS.MID_STELLAR_MAX) return "midStellar";
  return "advancedStellar";
};
