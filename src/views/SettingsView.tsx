import type { FC } from "react";
import type { Theme, ThemeMode } from "../types/theme";
import type { TranslationFunction, LangMode } from "../types/i18n";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { IconSettings } from "../components/icons";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby";

interface SettingsViewProps {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  langMode: LangMode;
  setLangMode: (mode: LangMode) => void;
  view: ViewType;
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
      goHome={goHome}
      navigateTo={navigateTo}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      t={t}
    />
    <main className="wide-main">
      <PageHeader title={t("settings")} icon={<IconSettings />} />

      <div className="two-col-grid">
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
          {(["auto", "ca", "en", "es"] as LangMode[]).map(mode => {
            const labelKey =
              mode === "auto" ? "langAuto"
              : mode === "es" ? "langEs"
              : mode === "ca" ? "langCa"
              : "langEn";
            return (
              <Button
                key={mode}
                variant="option"
                active={langMode === mode}
                theme={theme}
                onClick={() => setLangMode(mode)}
                style={{ flex: 1, minWidth: 80, padding: "12px 16px" }}
              >
                {t(labelKey)}
              </Button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: theme.textDimmed, marginTop: 12 }}>
          {t("langDescription")}
        </div>
      </div>
      </div>

      <Footer theme={theme} t={t} showVersion />
    </main>
  </div>
);
