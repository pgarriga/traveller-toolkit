// OCR-related constants

// Maximum number of recent planets to store
export const MAX_RECENT_PLANETS = 20;

// Common words to filter out when detecting planet names from OCR
// These are typically headers, labels, or game terminology
const OCR_COMMON_WORDS: ReadonlySet<string> = new Set([
  // Articles and prepositions
  "THE", "AND", "FOR", "WITH", "FROM", "OF", "TO", "IN", "ON", "AT",

  // Travel zones
  "ZONE", "RED", "AMBER", "GREEN", "TRAVEL",

  // UWP terminology
  "UWP", "WORLD", "PLANET", "STARPORT", "CLASS", "SIZE", "ATMOSPHERE",
  "POPULATION", "GOVERNMENT", "LAW", "TECH", "LEVEL", "NAME",
  "PROFILE", "UNIVERSAL", "DATA", "INFO",

  // System terminology
  "SYSTEM", "SECTOR", "SUBSECTOR", "HEX", "COORDINATES",

  // Facilities
  "BASES", "FACILITIES", "NAVAL", "SCOUT", "MILITARY",

  // Trade and allegiance
  "ALLEGIANCE", "REMARKS", "TRADE", "CODES", "GAS", "GIANT",

  // Common descriptors
  "TYPE", "DESCRIPTION", "NOTES", "DETAILS",
]);

// Check if a word should be filtered out
export const isCommonWord = (word: string): boolean => {
  return OCR_COMMON_WORDS.has(word.toUpperCase());
};

// OCR text extraction settings
export const OCR_SETTINGS = {
  // How many characters after UWP to search for planet name
  NAME_SEARCH_LENGTH: 150,

  // How many lines after UWP line to check for name
  NAME_SEARCH_LINES: 4,

  // Min/max length for detected planet names
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 35,
} as const;
