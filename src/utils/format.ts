// Formato de números compartido por las calculadoras.
//
// Vivía duplicado en FreightView y PassengerView, y ninguna de las dos copias
// contemplaba el catalán: `lang === "es" ? "es-ES" : "en-US"` mandaba `ca` al
// formato inglés, con coma de millar.

import type { Language } from "../types/i18n";

const LOCALES: Record<Language, string> = {
  es: "es-ES",
  ca: "ca-ES",
  en: "en-US",
};

export const localeFor = (lang: Language): string => LOCALES[lang];

// `es-ES` y `ca-ES` traen minimumGroupingDigits = 2 en CLDR: agrupan a partir
// de cinco cifras, así que 9000 salía "9000" y 14000 "14.000" en la misma
// columna. `useGrouping: "always"` fuerza el separador en los dos casos. Los
// navegadores sin Intl.NumberFormat V3 lo leen como `true`, es decir, se
// quedan en el comportamiento anterior en vez de romperse.
const GROUPED: Intl.NumberFormatOptions = { useGrouping: "always" };

export const formatCredits = (n: number, lang: Language): string =>
  `Cr ${n.toLocaleString(localeFor(lang), GROUPED)}`;

// Las toneladas admiten media tonelada, pero nunca más de un decimal.
export const formatTons = (n: number, lang: Language): string =>
  n.toLocaleString(localeFor(lang), {
    ...GROUPED,
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
