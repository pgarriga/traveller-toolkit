import { useState, useEffect } from "react";
import type { Language, LangMode, TranslationFunction } from "../types/i18n";
import { translations, detectLanguage } from "./translations";
import { STORAGE_KEYS } from "../constants/storage";

/**
 * Los modos válidos, sacados del propio tipo en vez de escritos a mano: la lista
 * a mano se quedó sin "ca" cuando se añadió el catalán, así que elegirlo se
 * guardaba bien y se perdía al recargar —volvía a "auto"— sin que nada fallara
 * a la vista. Añadir un idioma no puede volver a dejar esta lista atrás.
 */
const LANG_MODES: readonly string[] = ["auto", "es", "en", "ca"] satisfies readonly LangMode[];

interface UseTranslationReturn {
  t: TranslationFunction;
  lang: Language;
  langMode: LangMode;
  setLangMode: (mode: LangMode) => void;
}

// Translation hook
export function useTranslation(): UseTranslationReturn {
  const [langMode, setLangMode] = useState<LangMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.lang);
    return saved !== null && LANG_MODES.includes(saved) ? (saved as LangMode) : "auto";
  });

  // Held in state rather than re-read at render time: `setLangMode(prev => prev)`
  // sets the same value, so React bails out and the new system language never
  // reaches the UI.
  const [systemLang, setSystemLang] = useState<Language>(detectLanguage);

  const actualLang: Language = langMode === "auto" ? systemLang : langMode;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.lang, langMode);
  }, [langMode]);

  // Registered whatever the mode, so switching back to "auto" already knows the
  // current system language.
  useEffect(() => {
    const handleLangChange = () => setSystemLang(detectLanguage());
    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  // index.html ships lang="en"; without this, screen readers announce the
  // Spanish and Catalan UI with English pronunciation rules.
  useEffect(() => {
    document.documentElement.lang = actualLang;
  }, [actualLang]);

  /**
   * `t` recibe un `string` y no una `TranslationKey` porque media aplicación
   * compone la clave —el `labelKey` de una pieza del catálogo, `shipCrew_${rol}`,
   * el título de una sección—. La tabla sí está tipada, así que el
   * ensanchamiento se hace AQUÍ, en el único sitio donde una clave suelta se
   * encuentra con ella; lo que no exista cae al inglés, y si tampoco, a la
   * propia clave, que en pantalla se ve enseguida.
   */
  const t: TranslationFunction = (key: string): string => {
    const table: Record<string, string | undefined> = translations[actualLang];
    const fallback: Record<string, string | undefined> = translations.en;
    return table[key] ?? fallback[key] ?? key;
  };

  return { t, lang: actualLang, langMode, setLangMode };
}
