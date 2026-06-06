import type { FC } from "react";
import type { Theme, ThemeMode } from "../types/theme";
import type { TranslationFunction, LangMode } from "../types/i18n";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { IconSettings } from "../components/icons";

type ViewType = "home" | "decoder" | "saved" | "settings" | "planet" | "freight";

interface SettingsViewProps {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  langMode: LangMode;
  setLangMode: (mode: LangMode) => void;
  view: ViewType;
  resetDecoder: () => void;
  goHome: () => void;
  navigateTo: (view: ViewType) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
}

export const SettingsView: FC<SettingsViewProps> = ({
  theme,
  themeMode,
  setThemeMode,
  langMode,
  setLangMode,
  view,
  resetDecoder,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t
}) => (
  <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "inherit" }}>
    <Navbar
      theme={theme}
      view={view}
      resetDecoder={resetDecoder}
      goHome={goHome}
      navigateTo={navigateTo}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      t={t}
    />
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
      <PageHeader title={t("settings")} icon={<IconSettings />} />

      <div style={{ background: theme.bgCard, borderRadius: 12, padding: 20, marginBottom: 16, border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, marginBottom: 12 }}>{t("theme")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["auto", "light", "dark"] as ThemeMode[]).map(mode => (
            <Button
              key={mode}
              variant="option"
              active={themeMode === mode}
              theme={theme}
              onClick={() => setThemeMode(mode)}
              style={{ flex: 1, minWidth: 80, padding: "12px 16px" }}
            >
              {t(mode === "auto" ? "themeAuto" : mode === "light" ? "themeLight" : "themeDark")}
            </Button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: theme.textDimmed, marginTop: 12 }}>
          {t("themeDescription")}
        </div>
      </div>

      <div style={{ background: theme.bgCard, borderRadius: 12, padding: 20, marginBottom: 16, border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, marginBottom: 12 }}>{t("language")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["auto", "es", "en"] as LangMode[]).map(mode => (
            <Button
              key={mode}
              variant="option"
              active={langMode === mode}
              theme={theme}
              onClick={() => setLangMode(mode)}
              style={{ flex: 1, minWidth: 80, padding: "12px 16px" }}
            >
              {t(mode === "auto" ? "langAuto" : mode === "es" ? "langEs" : "langEn")}
            </Button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: theme.textDimmed, marginTop: 12 }}>
          {t("langDescription")}
        </div>
      </div>

      <Footer theme={theme} t={t} showVersion />
    </main>
  </div>
);
