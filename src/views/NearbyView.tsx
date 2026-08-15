import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import type { RecentPlanet, StarportClass, TravellerMapWorld, ZoneCode } from "../types/uwp";
import type { FuelPolicy, NearbyFilters, NearbyWorld, ShipProfile } from "../types/nearby";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Section } from "../components/ui/Section";
import { Button } from "../components/ui/Button";
import { WorldPicker } from "../components/ui/WorldPicker";
import { Field, fieldLabelStyle } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { NearbyBanner } from "../components/banners";
import { NearbyJumpMap } from "../components/NearbyJumpMap";
import { IconRadar } from "../components/icons";
import { COLORS, SECTION_COLORS } from "../constants/colors";
import { getZoneColor } from "../constants/zones";
import {
  DEFAULT_FILTERS,
  DEFAULT_SHIP,
  DISTANCE_OPTIONS,
  FUEL_POLICY_OPTIONS,
  FUEL_RANGE_OPTIONS,
  JUMP_OPTIONS,
  MAX_JUMP,
  POPULATION_OPTIONS,
  STARPORT_RANK,
  TECH_LEVEL_OPTIONS,
  ZONE_FILTER_OPTIONS,
} from "../constants/nearby";
import { fetchJumpWorlds } from "../utils/travellerMap";
import { filterWorlds, jumpsFromOrigin, withDistance, worldKey } from "../utils/nearby";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby";

interface NearbyViewProps {
  theme: Theme;
  view: ViewType;
  goHome: () => void;
  navigateTo: (view: ViewType, uwp?: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
  recentPlanets: RecentPlanet[];
  savePlanet: (uwp: string, name: string, zone: ZoneCode, world?: TravellerMapWorld) => void;
  onSelectWorld: (uwp: string, name: string, world: TravellerMapWorld) => void;
}

const zoneKey = (z: ZoneCode): string =>
  z === "A" ? "zoneAmber" : z === "R" ? "zoneRed" : "zoneGreen";

const policyKey = (p: FuelPolicy): string =>
  p === "refined" ? "nearbyPolicyRefined"
    : p === "wilderness" ? "nearbyPolicyWilderness"
      : "nearbyPolicyUnrefined";

// Sentence appended to the results legend so the table explains the rule in force.
const policyLegendKey = (p: FuelPolicy): string =>
  p === "refined" ? "nearbyPolicyRefinedLegend"
    : p === "wilderness" ? "nearbyPolicyWildernessLegend"
      : "nearbyPolicyUnrefinedLegend";

// "1808" -> { x: 18, y: 8 }. The map always pads each half to two digits.
const splitHex = (hex: string): { x: number; y: number } | null => {
  if (!/^\d{4}$/.test(hex)) return null;
  return { x: parseInt(hex.slice(0, 2), 10), y: parseInt(hex.slice(2), 10) };
};

export const NearbyView: FC<NearbyViewProps> = ({
  theme,
  view,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
  recentPlanets,
  savePlanet,
  onSelectWorld,
}) => {
  const [originUwp, setOriginUwp] = useState<string | null>(null);
  const [filters, setFilters] = useState<NearbyFilters>(DEFAULT_FILTERS);
  const [ship, setShip] = useState<ShipProfile>(DEFAULT_SHIP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState<NearbyWorld[] | null>(null);
  const [scannedRadius, setScannedRadius] = useState<number>(DEFAULT_FILTERS.maxDistance);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const origin = useMemo(
    () => recentPlanets.find(p => p.uwp === originUwp) ?? null,
    [recentPlanets, originUwp],
  );
  const originWorld = origin?.world ?? null;
  const originHex = originWorld
    ? `${String(originWorld.hexX).padStart(2, "0")}${String(originWorld.hexY).padStart(2, "0")}`
    : null;

  // The origin as the map returned it. `originWorld` comes from the saved-world
  // record and carries no world-space coordinates; the jump map needs those to
  // place its markers, and only the scan has them.
  const originScanned = useMemo(() => {
    if (!scanned || !originWorld || !originHex) return null;
    return scanned.find(w => w.hex === originHex && w.sector === originWorld.sector) ?? null;
  }, [scanned, originWorld, originHex]);

  // Route lengths are plotted over every scanned world, not just the matches:
  // a world the filters rejected can still be a perfectly good fuel stop.
  const jumps = useMemo(() => {
    if (!scanned || !originWorld || !originHex) return new Map<string, number>();
    return jumpsFromOrigin(
      scanned,
      worldKey({ sector: originWorld.sector, hex: originHex }),
      ship,
      filters.zones,
    );
  }, [scanned, originWorld, originHex, ship, filters.zones]);

  // Filtering is local: one fetch covers the radius and the filters re-apply live.
  const matches = useMemo(() => {
    if (!scanned || !originWorld || !originHex) return [];
    const found = filterWorlds(scanned, filters, originHex, originWorld.sector);
    // Ordered by route length, not parsecs: what the table answers is "how many
    // jumps away is this", and two worlds the same distance out can be one jump
    // or three apart. Distance and name only break ties, and worlds with no
    // route sink to the bottom.
    return found.sort((a, b) => {
      const ja = jumps.get(worldKey(a)) ?? Number.POSITIVE_INFINITY;
      const jb = jumps.get(worldKey(b)) ?? Number.POSITIVE_INFINITY;
      if (ja !== jb) return ja - jb;
      return a.distance - b.distance || a.name.localeCompare(b.name);
    });
  }, [scanned, filters, originHex, originWorld, jumps]);

  const handleSearch = async (): Promise<void> => {
    if (!originWorld || !originHex || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      // Scan wider than the filter asks for: a route to a world 4 parsecs out
      // may need a fuel stop that sits further away than the world itself.
      const radius = Math.min(MAX_JUMP, filters.maxDistance + ship.jump);
      const raw = await fetchJumpWorlds(
        originWorld.sector, originHex, radius, controller.signal,
      );
      const self = raw.find(w => w.hex === originHex && w.sector === originWorld.sector);
      // Distances are measured from the origin's own map coordinates.
      const ox = self?.worldX ?? 0;
      const oy = self?.worldY ?? 0;
      setScanned(withDistance(raw, ox, oy));
      setScannedRadius(radius);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Nearby worlds lookup failed:", err);
      setError(t("nearbyError"));
      setScanned(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const openWorld = (w: NearbyWorld): void => {
    const parts = splitHex(w.hex);
    if (!parts) return;
    onSelectWorld(w.uwp, w.name || w.hex, {
      name: w.name,
      uwp: w.uwp,
      sector: w.sector,
      hexX: parts.x,
      hexY: parts.y,
    });
  };

  const toggleZone = (z: ZoneCode): void => {
    setFilters(f => ({
      ...f,
      zones: f.zones.includes(z) ? f.zones.filter(x => x !== z) : [...f.zones, z],
    }));
  };

  // "1 jump" / "2 jumps" — fuel range reads as a jump count wherever it shows.
  const jumpUnit = (n: number): string =>
    `${n} ${n === 1 ? t("nearbyJumpUnitOne") : t("nearbyJumpUnitMany")}`;

  const inputStyle = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    color: theme.text,
    fontSize: 14,
    width: "100%",
    fontFamily: "inherit",
  } as const;

  const labelStyle = fieldLabelStyle(theme);

  const fieldGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  } as const;

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
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
        <NearbyBanner theme={theme} />
        <PageHeader title={t("nearbyTitle")} icon={<IconRadar />} />

        <Section title={t("nearbyOriginSection")} color={COLORS.primary} theme={theme}>
          <div style={{ fontSize: 13, color: theme.textDimmed, marginBottom: 12, lineHeight: 1.5 }}>
            {t("nearbyOriginHint")}
          </div>
          <WorldPicker
            theme={theme}
            t={t}
            recentPlanets={recentPlanets}
            linkUwp={originUwp}
            onPick={(p: RecentPlanet) => { setOriginUwp(p.uwp); setScanned(null); }}
            onClear={() => { setOriginUwp(null); setScanned(null); }}
            savePlanet={savePlanet}
          />
          {origin && !originWorld && (
            <div style={{ fontSize: 12, color: COLORS.warning, marginTop: 8 }}>
              {t("nearbyOriginNoCoords")}
            </div>
          )}
          {origin && originWorld && (
            <div style={{ fontSize: 12, color: theme.textDimmed, marginTop: 8, fontFamily: "monospace" }}>
              {originWorld.sector} {originHex} · {origin.uwp}
            </div>
          )}
        </Section>

        <Section title={t("nearbyShipSection")} color={SECTION_COLORS.techLevel} theme={theme}>
          <div style={{ fontSize: 13, color: theme.textDimmed, marginBottom: 12, lineHeight: 1.5 }}>
            {t("nearbyShipHint")}
          </div>
          <div className="ship-grid">
            <Field label={t("nearbyJumpRating")} theme={theme}>
              {id => (
                <select
                  id={id}
                  style={inputStyle}
                  value={ship.jump}
                  onChange={e => setShip({ ...ship, jump: parseInt(e.target.value, 10) })}
                >
                  {JUMP_OPTIONS.map(j => (
                    <option key={j} value={j}>J-{j} · {j} {t("nearbyParsecsShort")}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t("nearbyFuelRange")} theme={theme}>
              {id => (
                <select
                  id={id}
                  style={inputStyle}
                  value={ship.fuelRange}
                  onChange={e => setShip({ ...ship, fuelRange: parseInt(e.target.value, 10) })}
                >
                  {FUEL_RANGE_OPTIONS.map(f => (
                    <option key={f} value={f}>{jumpUnit(f)}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t("nearbyFuelPolicy")} theme={theme}>
              {id => (
                <select
                  id={id}
                  style={inputStyle}
                  value={ship.fuelPolicy}
                  onChange={e => setShip({ ...ship, fuelPolicy: e.target.value as FuelPolicy })}
                >
                  {FUEL_POLICY_OPTIONS.map(p => (
                    <option key={p} value={p}>{t(policyKey(p))}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div style={{ fontSize: 12, color: theme.textDimmed, marginTop: 10, lineHeight: 1.5 }}>
            {t("nearbyFuelRangeHint")}
            <br />
            {t(policyLegendKey(ship.fuelPolicy))}
          </div>
        </Section>

        <Section title={t("nearbyFiltersSection")} color={SECTION_COLORS.starport} theme={theme}>
          <div style={fieldGridStyle}>
            <Field label={t("nearbyMaxDistance")} theme={theme}>
              {id => (
                <select
                  id={id}
                  style={inputStyle}
                  value={filters.maxDistance}
                  onChange={e => setFilters({ ...filters, maxDistance: parseInt(e.target.value, 10) })}
                >
                  {DISTANCE_OPTIONS.map(d => (
                    <option key={d} value={d}>{d} {t("nearbyParsecsShort")}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t("nearbyMinStarport")} theme={theme}>
              {id => (
                <select
                  id={id}
                  style={inputStyle}
                  value={filters.minStarport ?? ""}
                  onChange={e => setFilters({
                    ...filters,
                    minStarport: e.target.value === "" ? null : (e.target.value as StarportClass),
                  })}
                >
                  <option value="">{t("nearbyAny")}</option>
                  {STARPORT_RANK.map(sp => (
                    <option key={sp} value={sp}>{sp} {t("nearbyOrBetter")}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t("nearbyMinTechLevel")} theme={theme}>
              {id => (
                <select
                  id={id}
                  style={inputStyle}
                  value={filters.minTechLevel ?? ""}
                  onChange={e => setFilters({
                    ...filters,
                    minTechLevel: e.target.value === "" ? null : parseInt(e.target.value, 10),
                  })}
                >
                  <option value="">{t("nearbyAny")}</option>
                  {TECH_LEVEL_OPTIONS.map(tl => (
                    <option key={tl} value={tl}>{tl}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t("nearbyMinPopulation")} theme={theme}>
              {id => (
                <select
                  id={id}
                  style={inputStyle}
                  value={filters.minPopulation ?? ""}
                  onChange={e => setFilters({
                    ...filters,
                    minPopulation: e.target.value === "" ? null : parseInt(e.target.value, 10),
                  })}
                >
                  <option value="">{t("nearbyAny")}</option>
                  {POPULATION_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <div style={{ marginTop: 14 }}>
            <span style={labelStyle}>{t("nearbyZones")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {ZONE_FILTER_OPTIONS.map(z => (
                <label key={z} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={filters.zones.includes(z)}
                    onChange={() => toggleZone(z)}
                    style={{ accentColor: getZoneColor(z), width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 14, color: getZoneColor(z) }}>{t(zoneKey(z))}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        <div style={{ margin: "20px 0" }}>
          <Button
            variant="primary"
            size="lg"
            theme={theme}
            onClick={handleSearch}
            disabled={!originWorld || loading}
            fullWidth
          >
            <IconRadar />{loading ? t("nearbySearching") : t("nearbySearch")}
          </Button>
          {!originWorld && (
            <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6, textAlign: "center" }}>
              {t("nearbyOriginMissing")}
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: COLORS.danger, fontSize: 14, marginBottom: 16, textAlign: "center" }}>
            {error}
          </div>
        )}

        {scanned && !loading && (
          <Section title={t("nearbyResultsSection")} color={SECTION_COLORS.population} theme={theme}>
            <div style={{ fontSize: 12, color: theme.textDimmed, marginBottom: 12 }}>
              {t("nearbyScanned")
                .replace("{n}", String(scanned.length))
                .replace("{d}", String(scannedRadius))}
              {" · "}
              <span style={{ color: theme.text }}>
                {matches.length} {matches.length === 1 ? t("nearbyMatchCountOne") : t("nearbyMatchCount")}
              </span>
            </div>

            {matches.length === 0 ? (
              <div style={{ fontSize: 13, color: theme.textDimmed, lineHeight: 1.5 }}>
                {t("nearbyNoMatches")}
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table className="traveller-table">
                    <thead>
                      <tr>
                        <th>{t("nearbyColDistance")}</th>
                        <th>{t("nearbyColJumps")}</th>
                        <th>{t("nearbyColWorld")}</th>
                        <th>{t("nearbyColUwp")}</th>
                        <th>{t("nearbyColZone")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map(w => {
                        const hops = jumps.get(worldKey(w));
                        return (
                        <tr
                          key={`${w.sector}-${w.hex}`}
                          onClick={() => openWorld(w)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openWorld(w);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <td style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>
                            {w.distance} {t("nearbyParsecsShort")}
                          </td>
                          <td
                            style={{
                              fontFamily: "monospace",
                              whiteSpace: "nowrap",
                              color: hops === undefined ? COLORS.danger : undefined,
                            }}
                            title={hops === undefined ? t("nearbyNoRouteHint") : undefined}
                          >
                            {hops === undefined ? t("nearbyNoRoute") : hops}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{w.name || "—"}</div>
                            <div style={{ fontSize: 11, color: theme.textDimmed }}>
                              {w.sector} {w.hex}
                            </div>
                          </td>
                          <td style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{w.uwp}</td>
                          <td style={{ color: getZoneColor(w.zone), whiteSpace: "nowrap" }}>
                            {t(zoneKey(w.zone))}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 10, lineHeight: 1.6 }}>
                  {t("nearbyJumpsLegend")
                    .replace("{j}", String(ship.jump))
                    .replace("{f}", jumpUnit(ship.fuelRange))
                    .replace("{p}", t(policyLegendKey(ship.fuelPolicy)))}
                  <br />
                  {t("nearbyOpenHint")}
                </div>
              </>
            )}
          </Section>
        )}

        {scanned && !loading && originScanned && (
          <Section title={t("nearbyMapSection")} color={SECTION_COLORS.size} theme={theme}>
            <NearbyJumpMap
              // Remounting on a new origin drops the previous image's measured
              // size, so markers are never placed against stale dimensions.
              key={worldKey(originScanned)}
              theme={theme}
              t={t}
              origin={originScanned}
              originHex={originScanned.hex}
              matches={matches}
              jumps={jumps}
              radius={filters.maxDistance}
            />
          </Section>
        )}

        <Footer theme={theme} t={t} />
      </main>
    </div>
  );
};
