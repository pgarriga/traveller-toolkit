import type { FC, MouseEvent } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import type { RecentPlanet, StarportClass } from "../types/uwp";
import type { AtmosphereData, GovernmentData, StarportData } from "../types/game-data";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { IconClock, IconSearch, IconTrash } from "../components/icons";
import { COLORS, SECTION_COLORS } from "../constants/colors";
import { getZoneColor } from "../constants/zones";
import { getTechLevelKey } from "../constants/gameRules";
import { parseUwp } from "../utils/uwp";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent";

// Compact population ranges from the Mongoose Traveller 2e population table.
// Index = UWP population digit; minimum inhabitants shown Twitter/Instagram style.
const POP_ABBR = [
  "0",
  "1+",
  "100+",
  "1K+",
  "10K+",
  "100K+",
  "1M+",
  "10M+",
  "100M+",
  "1B+",
  "10B+",
  "100B+",
  "1T+",
  "10T+",
  "100T+",
  "1Q+",
] as const;

type SortKey = "recent" | "oldest" | "nameAsc" | "nameDesc" | "tl" | "pop";

const SORT_OPTIONS: readonly SortKey[] = ["recent", "oldest", "nameAsc", "nameDesc", "tl", "pop"];

const SORT_LABEL_KEY: Record<SortKey, "recentSortRecent" | "recentSortOldest" | "recentSortNameAsc" | "recentSortNameDesc" | "recentSortTL" | "recentSortPop"> = {
  recent: "recentSortRecent",
  oldest: "recentSortOldest",
  nameAsc: "recentSortNameAsc",
  nameDesc: "recentSortNameDesc",
  tl: "recentSortTL",
  pop: "recentSortPop",
};

interface RecentWorldsViewProps {
  theme: Theme;
  view: ViewType;
  goHome: () => void;
  navigateTo: (view: ViewType) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
  recentPlanets: RecentPlanet[];
  loadPlanet: (planet: RecentPlanet) => void;
  deletePlanet: (uwp: string) => void;
  STARPORT: Record<StarportClass, StarportData>;
  ATMO: AtmosphereData[];
  GOV: GovernmentData[];
  POP: string[];
}

export const RecentWorldsView: FC<RecentWorldsViewProps> = ({
  theme,
  view,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
  recentPlanets,
  loadPlanet,
  deletePlanet,
  STARPORT,
  ATMO,
  GOV,
  POP,
}) => {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [editMode, setEditMode] = useState(false);

  const visiblePlanets = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? recentPlanets.filter(
          (p) =>
            p.name.toLowerCase().includes(needle) || p.uwp.toLowerCase().includes(needle)
        )
      : recentPlanets.slice();

    filtered.sort((a, b) => {
      switch (sort) {
        case "recent":
          return b.timestamp - a.timestamp;
        case "oldest":
          return a.timestamp - b.timestamp;
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "tl": {
          const at = parseUwp(a.uwp, STARPORT)?.tl ?? -1;
          const bt = parseUwp(b.uwp, STARPORT)?.tl ?? -1;
          return bt - at;
        }
        case "pop": {
          const ap = parseUwp(a.uwp, STARPORT)?.po ?? -1;
          const bp = parseUwp(b.uwp, STARPORT)?.po ?? -1;
          return bp - ap;
        }
      }
    });

    return filtered;
  }, [recentPlanets, filter, sort, STARPORT]);

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
        <PageHeader title={t("recentWorldsTitle")} icon={<IconClock />} />

        <section aria-labelledby="recent-heading" style={{ marginTop: 24 }}>
          {recentPlanets.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: theme.textDimmed, fontSize: 13 }}>
              <div style={{ marginBottom: 16 }}>{t("noRecentPlanets")}</div>
              <Button variant="primary" size="md" theme={theme} onClick={() => navigateTo("search")}>
                <IconSearch />{t("searchTitle")}
              </Button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={t("recentFilterPlaceholder")}
                  aria-label={t("recentFilterPlaceholder")}
                  style={{
                    flex: "1 1 200px",
                    minWidth: 180,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: theme.bgCard,
                    color: theme.text,
                    fontFamily: "inherit",
                    fontSize: 14,
                  }}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: COLORS.primary,
                  }}
                >
                  <span aria-hidden="true">{t("recentSortLabel")}</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label={t("recentSortLabel")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      background: theme.bgCard,
                      color: theme.text,
                      fontFamily: "inherit",
                      fontSize: 14,
                      fontWeight: 400,
                      letterSpacing: 0,
                      textTransform: "none",
                    }}
                  >
                    {SORT_OPTIONS.map((key) => (
                      <option key={key} value={key}>
                        {t(SORT_LABEL_KEY[key])}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  aria-pressed={editMode}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${editMode ? COLORS.primary : theme.border}`,
                    background: editMode ? `${COLORS.primary}1F` : theme.bgCard,
                    color: editMode ? COLORS.primary : theme.text,
                    fontFamily: "inherit",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    marginLeft: "auto",
                  }}
                >
                  {editMode ? t("recentEditDone") : t("recentEdit")}
                </button>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: theme.textDimmed,
                  marginBottom: 12,
                  minHeight: 18,
                }}
              >
                {filter.trim().length > 0 &&
                  `${visiblePlanets.length} ${t("recentCount")} ${recentPlanets.length}`}
              </div>

              {visiblePlanets.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: theme.textDimmed, fontSize: 13 }}>
                  {t("recentNoMatches")}
                </div>
              ) : (
                <div className="card-grid card-grid--two">
              {visiblePlanets.map((planet) => {
                const parsed = parseUwp(planet.uwp, STARPORT);
                const popFull = parsed ? POP[parsed.po] : "";
                const popShort = parsed ? POP_ABBR[parsed.po] ?? String(parsed.po) : "";
                const tags = parsed
                  ? [
                      {
                        label: `${t("starport")} ${parsed.sp}`,
                        title: STARPORT[parsed.sp].name,
                        color: SECTION_COLORS.starport,
                      },
                      {
                        label: `${t("atmosphere")} ${ATMO[parsed.at].comp}`,
                        title: ATMO[parsed.at].comp,
                        color: SECTION_COLORS.atmosphere,
                      },
                      {
                        label: `${t("population")} ${popShort}`,
                        title: popFull,
                        color: SECTION_COLORS.population,
                      },
                      {
                        label: `${t("government")} ${GOV[parsed.go].type}`,
                        title: GOV[parsed.go].type,
                        color: COLORS.indigo,
                      },
                      {
                        label: `${t("tl")} ${parsed.tl}`,
                        title: t(getTechLevelKey(parsed.tl)),
                        color: SECTION_COLORS.techLevel,
                      },
                    ]
                  : [];
                return (
                  <div
                    key={planet.uwp}
                    onClick={editMode ? undefined : () => loadPlanet(planet)}
                    role={editMode ? undefined : "button"}
                    tabIndex={editMode ? undefined : 0}
                    onKeyDown={editMode ? undefined : (e) => {
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
                      cursor: editMode ? "default" : "pointer",
                      border: `1px solid ${theme.border}`,
                      borderLeft: `3px solid ${getZoneColor(planet.zone)}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 8,
                          marginBottom: tags.length > 0 ? 8 : 0,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                            flexShrink: 1,
                            fontSize: 15,
                            fontWeight: 500,
                            color: theme.text,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {planet.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: 15,
                            color: theme.textDimmed,
                            letterSpacing: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          {planet.uwp}
                        </div>
                      </div>
                      {tags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {tags.map((tag) => (
                            <span
                              key={tag.label}
                              title={tag.title}
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: 0.3,
                                borderRadius: 6,
                                color: tag.color,
                                background: `${tag.color}1F`,
                                border: `1px solid ${tag.color}55`,
                              }}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {editMode && (
                      <Button
                        variant="icon"
                        theme={theme}
                        onClick={(e: MouseEvent) => {
                          e.stopPropagation();
                          deletePlanet(planet.uwp);
                        }}
                        aria-label={t("delete")}
                      >
                        <IconTrash />
                      </Button>
                    )}
                  </div>
                );
              })}
                </div>
              )}
            </>
          )}
        </section>

        <Footer theme={theme} t={t} />
      </main>
    </div>
  );
};
