import type { FC, FormEvent, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import type { RecentPlanet, TravellerMapWorld, ZoneCode } from "../types/uwp";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { IconSearch, IconClock, IconTrash } from "../components/icons";
import { COLORS } from "../constants/colors";
import { ZONES, getZoneColor } from "../constants/zones";
import { searchWorlds, type WorldSearchResult } from "../utils/travellerMap";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search";

const MIN_QUERY_LENGTH = 3;

interface SearchViewProps {
  theme: Theme;
  view: ViewType;
  goHome: () => void;
  navigateTo: (view: ViewType, uwp?: string | null) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
  onSelectWorld: (uwp: string, name: string, world: TravellerMapWorld) => void;
  recentPlanets: RecentPlanet[];
  loadPlanet: (planet: RecentPlanet) => void;
  deletePlanet: (uwp: string) => void;
  clearAllPlanets: () => void;
}

export const SearchView: FC<SearchViewProps> = ({
  theme,
  view,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
  onSelectWorld,
  recentPlanets,
  loadPlanet,
  deletePlanet,
  clearAllPlanets,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorldSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= MIN_QUERY_LENGTH && !loading;
  const hasResultsPane = loading || error !== null || results !== null;

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (trimmed.length < MIN_QUERY_LENGTH || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const found = await searchWorlds(trimmed, controller.signal);
      if (!controller.signal.aborted) {
        setResults(found);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Traveller Map search error:", err);
      setError(t("searchError"));
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const greenBorder = getZoneColor(ZONES.GREEN as ZoneCode);

  return (
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
        <PageHeader title={t("searchTitle")} icon={<IconSearch />} />

        <form
          onSubmit={handleSubmit}
          className="narrow-block"
          style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            minLength={MIN_QUERY_LENGTH}
            style={{
              flex: 1,
              minWidth: 200,
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: theme.bgCard,
              color: theme.text,
              fontFamily: "inherit",
              fontSize: 14,
            }}
          />
          <Button
            type="submit"
            variant="primary"
            theme={theme}
            disabled={!canSearch}
          >
            <IconSearch />{t("searchButton")}
          </Button>
        </form>

        <div className="narrow-block" style={{ minHeight: 20, marginBottom: 12, color: theme.textDimmed, fontSize: 13 }}>
          {loading && t("searchLoading")}
          {!loading && error && <span style={{ color: COLORS.danger }}>{error}</span>}
          {!loading && !error && results && (
            <span>{results.length} {t("searchResultsCount")}</span>
          )}
          {!loading && !error && !results && trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH && (
            <span>{t("searchMinChars")}</span>
          )}
        </div>

        {!loading && !error && results && results.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: theme.textDimmed }}>
            {t("searchNoResults")}
          </div>
        )}

        {!loading && !error && results && results.length > 0 && (
          <div className="card-grid">
            {results.map((planet) => {
              const world: TravellerMapWorld = {
                name: planet.name,
                uwp: planet.uwp,
                sector: planet.sector,
                hexX: planet.hexX,
                hexY: planet.hexY,
                sectorX: planet.sectorX,
                sectorY: planet.sectorY,
                sectorTags: planet.sectorTags,
              };
              return (
              <div
                key={`${planet.sector}-${planet.hex}-${planet.uwp}`}
                onClick={() => onSelectWorld(planet.uwp, planet.name, world)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectWorld(planet.uwp, planet.name, world);
                  }
                }}
                style={{
                  background: theme.bgCard,
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  border: `1px solid ${theme.border}`,
                  borderLeft: `3px solid ${greenBorder}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: theme.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {planet.name}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: theme.textDimmed, letterSpacing: 0.5 }}>
                    {planet.uwp}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textDimmed, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {planet.sector} · {planet.hex}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {!hasResultsPane && (
          <section aria-labelledby="recent-heading" style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
              <h2
                id="recent-heading"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: COLORS.primary,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconClock />{t("recentPlanets")}
              </h2>
              {recentPlanets.length > 0 && (
                <Button variant="ghost" size="sm" theme={theme} onClick={clearAllPlanets}>
                  {t("clearAll")}
                </Button>
              )}
            </div>

            {recentPlanets.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: theme.textDimmed, fontSize: 13 }}>
                {t("noRecentPlanets")}
              </div>
            ) : (
              <div className="card-grid">
                {recentPlanets.map((planet) => (
                  <div
                    key={planet.uwp}
                    onClick={() => loadPlanet(planet)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        loadPlanet(planet);
                      }
                    }}
                    style={{
                      background: theme.bgCard,
                      borderRadius: 10,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      border: `1px solid ${theme.border}`,
                      borderLeft: `3px solid ${getZoneColor(planet.zone)}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: theme.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {planet.name}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 12, color: theme.textDimmed, letterSpacing: 0.5 }}>
                        {planet.uwp}
                      </div>
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
          </section>
        )}

        <Footer theme={theme} t={t} />
      </main>
    </div>
  );
};
