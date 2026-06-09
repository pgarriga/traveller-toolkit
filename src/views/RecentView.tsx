import type { FC, MouseEvent } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import type { RecentPlanet } from "../types/uwp";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { IconClock, IconTrash } from "../components/icons";
import { getZoneColor } from "../constants/zones";

type ViewType = "home" | "decoder" | "saved" | "settings" | "planet" | "freight" | "passenger";

interface RecentViewProps {
  theme: Theme;
  recentPlanets: RecentPlanet[];
  loadPlanet: (planet: RecentPlanet) => void;
  deletePlanet: (uwp: string) => void;
  clearAllPlanets: () => void;
  view: ViewType;
  resetDecoder: () => void;
  goHome: () => void;
  navigateTo: (view: ViewType) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
}

export const RecentView: FC<RecentViewProps> = ({
  theme,
  recentPlanets,
  loadPlanet,
  deletePlanet,
  clearAllPlanets,
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
      <PageHeader title={t("recentPlanets")} icon={<IconClock />} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ color: theme.textDimmed, fontSize: 13 }}>
          {recentPlanets.length} {t("planetCount")}
        </div>
        {recentPlanets.length > 0 && (
          <Button variant="ghost" size="sm" theme={theme} onClick={clearAllPlanets}>
            {t("clearAll")}
          </Button>
        )}
      </div>

      {recentPlanets.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: theme.textDimmed }}>
          {t("noRecentPlanets")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recentPlanets.map((planet) => (
            <div
              key={planet.uwp}
              onClick={() => loadPlanet(planet)}
              style={{
                background: theme.bgCard,
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                border: `1px solid ${theme.border}`,
                borderLeft: `3px solid ${getZoneColor(planet.zone)}`
              }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: theme.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{planet.name}</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: theme.textDimmed, letterSpacing: 0.5 }}>{planet.uwp}</div>
              </div>
              <Button
                variant="icon"
                theme={theme}
                onClick={(e: MouseEvent) => { e.stopPropagation(); deletePlanet(planet.uwp); }}
                aria-label={t("delete") || "Delete"}
              >
                <IconTrash />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Footer theme={theme} t={t} />
    </main>
  </div>
);
