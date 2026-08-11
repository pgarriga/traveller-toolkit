import type { TranslationFunction } from "../types/i18n";

// i18n helper functions

// Known "none" values across all supported languages
const NONE_VALUES: ReadonlySet<string> = new Set([
  "none",
  "ninguno",
  "ninguna",
  "cap",        // Catalan
  "ningunha",   // Galician
  "bat ere ez", // Basque
  "-",
  "",
]);

/**
 * Check if a value represents "none" in any supported language
 * Use this instead of comparing against multiple hardcoded strings
 *
 * @param value - The value to check
 * @param t - Optional translation function to also check t("none")
 * @returns True if the value means "none"
 */
const isNoneValue = (value: string | null | undefined, t: TranslationFunction | null = null): boolean => {
  if (!value) return true;

  const normalized = value.toString().toLowerCase().trim();

  // Check against known none values
  if (NONE_VALUES.has(normalized)) return true;

  // Also check against the translated "none" if t function provided
  if (t) {
    const translatedNone = t("none")?.toLowerCase().trim();
    if (normalized === translatedNone) return true;
  }

  return false;
};

/**
 * Check if equipment/contraband requires a warning
 * Returns true if the value is NOT "none" (i.e., something is required/banned)
 */
export const requiresWarning = (value: string | null | undefined, t: TranslationFunction | null = null): boolean => {
  return !isNoneValue(value, t);
};
