// i18n type definitions

export type Language = "es" | "en" | "ca";

export type LangMode = "auto" | Language;

// Translation function type
export type TranslationFunction = (key: string) => string;

/**
 * Toda clave de la interfaz. Sale del bloque español de i18n/translations.ts, que
 * es donde se escriben: una lista a mano aquí era una segunda copia de lo mismo,
 * no la comprobaba nadie —`TranslationFunction` recibe un `string`— y había
 * acabado con 63 claves de menos.
 */
export type { TranslationKey } from "../i18n/translations";
