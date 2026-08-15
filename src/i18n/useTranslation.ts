import { useState, useEffect } from "react";
import type { Language, LangMode, TranslationFunction } from "../types/i18n";
import { translations, detectLanguage } from "./translations";

interface UseTranslationReturn {
  t: TranslationFunction;
  lang: Language;
  langMode: LangMode;
  setLangMode: (mode: LangMode) => void;
}

// Translation hook
export function useTranslation(): UseTranslationReturn {
  const [langMode, setLangMode] = useState<LangMode>(() => {
    const saved = localStorage.getItem("traveller-lang");
    return saved && ["auto", "es", "en"].includes(saved) ? saved as LangMode : "auto";
  });

  // Held in state rather than re-read at render time: `setLangMode(prev => prev)`
  // sets the same value, so React bails out and the new system language never
  // reaches the UI.
  const [systemLang, setSystemLang] = useState<Language>(detectLanguage);

  const actualLang: Language = langMode === "auto" ? systemLang : langMode;

  useEffect(() => {
    localStorage.setItem("traveller-lang", langMode);
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

  const t: TranslationFunction = (key: string): string => {
    return translations[actualLang]?.[key] || translations.en[key] || key;
  };

  return { t, lang: actualLang, langMode, setLangMode };
}
