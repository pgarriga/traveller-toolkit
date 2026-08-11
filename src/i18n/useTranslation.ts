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

  const actualLang: Language = langMode === "auto" ? detectLanguage() : langMode;

  useEffect(() => {
    localStorage.setItem("traveller-lang", langMode);
  }, [langMode]);

  useEffect(() => {
    if (langMode !== "auto") return;
    const handleLangChange = () => {
      // Force re-render when system language changes
      setLangMode(prev => prev);
    };
    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, [langMode]);

  const t: TranslationFunction = (key: string): string => {
    return translations[actualLang]?.[key] || translations.en[key] || key;
  };

  return { t, lang: actualLang, langMode, setLangMode };
}
