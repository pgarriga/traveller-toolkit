import type { CSSProperties, FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Theme } from "../../types/theme";
import type { TranslationFunction } from "../../types/i18n";
import type { RecentPlanet, TravellerMapWorld, ZoneCode } from "../../types/uwp";
import { Button } from "./Button";
import { IconSearch, IconClose } from "../icons";
import { COLORS } from "../../constants/colors";
import { ZONES, getZoneColor } from "../../constants/zones";
import { searchWorlds, fetchWorldZone, type WorldSearchResult } from "../../utils/travellerMap";

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 350;

interface WorldPickerProps {
  theme: Theme;
  t: TranslationFunction;
  recentPlanets: RecentPlanet[];
  linkUwp: string | null;
  onPick: (planet: RecentPlanet) => void;
  onClear: () => void;
  savePlanet: (uwp: string, name: string, zone: ZoneCode, world?: TravellerMapWorld) => void;
  labelStyle: CSSProperties;
}

interface ModalProps {
  theme: Theme;
  t: TranslationFunction;
  recentPlanets: RecentPlanet[];
  onSelectVisited: (planet: RecentPlanet) => void;
  onSelectSearched: (r: WorldSearchResult) => void;
  onClose: () => void;
}

const PickerModal: FC<ModalProps> = ({ theme, t, recentPlanets, onSelectVisited, onSelectSearched, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorldSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      abortRef.current?.abort();
    };
  }, [onClose]);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setError(null);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }
    const handle = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      searchWorlds(trimmed, controller.signal)
        .then((found) => {
          if (!controller.signal.aborted) setResults(found);
        })
        .catch((err: Error) => {
          if (err.name === "AbortError") return;
          console.error("Traveller Map search error:", err);
          setError(t("searchError"));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [trimmed, t]);

  const filteredVisited = useMemo(() => {
    if (!trimmed) return recentPlanets;
    const needle = trimmed.toLowerCase();
    return recentPlanets.filter(p =>
      p.name.toLowerCase().includes(needle) ||
      p.uwp.toLowerCase().includes(needle) ||
      (p.world?.sector ?? "").toLowerCase().includes(needle),
    );
  }, [recentPlanets, trimmed]);

  const visitedUwps = useMemo(
    () => new Set(recentPlanets.map(p => p.uwp.toUpperCase())),
    [recentPlanets],
  );
  const newResults = useMemo(
    () => (results ?? []).filter(r => !visitedUwps.has(r.uwp.toUpperCase())),
    [results, visitedUwps],
  );

  const rowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    background: theme.bgCard,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    color: theme.text,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const sectionLabel: CSSProperties = {
    fontSize: 11,
    color: theme.textDimmed,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 500,
    marginTop: 8,
    marginBottom: 6,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="world-picker-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: 12,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderTop: `3px solid ${COLORS.primary}`,
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <h2
            id="world-picker-title"
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
              color: COLORS.primary,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {t("worldPickerTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            style={{
              background: "transparent",
              border: "none",
              color: theme.text,
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: theme.textDimmed, display: "flex", alignItems: "center" }}>
              <IconSearch />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("worldPickerSearchPlaceholder")}
              aria-label={t("worldPickerSearchPlaceholder")}
              style={{
                width: "100%",
                padding: "10px 12px 10px 34px",
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: theme.bgCard,
                color: theme.text,
                fontFamily: "inherit",
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ minHeight: 16, marginTop: 6, fontSize: 11, color: theme.textDimmed }}>
            {loading && t("searchLoading")}
            {!loading && error && <span style={{ color: COLORS.danger }}>{error}</span>}
            {!loading && !error && trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH && (
              <span>{t("searchMinChars")}</span>
            )}
          </div>
        </div>

        <div style={{ padding: "8px 16px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={sectionLabel}>{t("worldPickerVisited")}</div>
          {filteredVisited.length === 0 ? (
            <div style={{ fontSize: 12, color: theme.textDimmed, fontStyle: "italic", padding: "4px 0" }}>
              {recentPlanets.length === 0 ? t("noRecentPlanets") : t("worldPickerNoVisitedMatch")}
            </div>
          ) : (
            filteredVisited.map(p => (
              <button
                key={`visited-${p.uwp}`}
                type="button"
                onClick={() => onSelectVisited(p)}
                style={{ ...rowStyle, borderLeft: `3px solid ${getZoneColor(p.zone)}` }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.world?.sector ? `${p.world.sector} · ` : ""}<span style={{ fontFamily: "monospace" }}>{p.uwp}</span>
                  </div>
                </div>
              </button>
            ))
          )}

          {trimmed.length >= MIN_QUERY_LENGTH && (
            <>
              <div style={sectionLabel}>{t("worldPickerFromMap")}</div>
              {loading ? (
                <div style={{ fontSize: 12, color: theme.textDimmed, fontStyle: "italic", padding: "4px 0" }}>
                  {t("searchLoading")}
                </div>
              ) : newResults.length === 0 && results !== null ? (
                <div style={{ fontSize: 12, color: theme.textDimmed, fontStyle: "italic", padding: "4px 0" }}>
                  {t("searchNoResults")}
                </div>
              ) : (
                newResults.map(r => (
                  <button
                    key={`search-${r.sector}-${r.hex}-${r.uwp}`}
                    type="button"
                    onClick={() => onSelectSearched(r)}
                    style={{ ...rowStyle, borderLeft: `3px solid ${COLORS.primary}` }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.sector} · {r.hex} · <span style={{ fontFamily: "monospace" }}>{r.uwp}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const WorldPicker: FC<WorldPickerProps> = ({
  theme,
  t,
  recentPlanets,
  linkUwp,
  onPick,
  onClear,
  savePlanet,
  labelStyle,
}) => {
  const [open, setOpen] = useState(false);
  const linkedPlanet = linkUwp
    ? recentPlanets.find(p => p.uwp.toUpperCase() === linkUwp.toUpperCase()) ?? null
    : null;

  const handlePickSearched = (r: WorldSearchResult): void => {
    const world: TravellerMapWorld = {
      name: r.name,
      uwp: r.uwp,
      sector: r.sector,
      hexX: r.hexX,
      hexY: r.hexY,
      sectorX: r.sectorX,
      sectorY: r.sectorY,
      sectorTags: r.sectorTags,
    };
    const existing = recentPlanets.find(p => p.uwp.toUpperCase() === r.uwp.toUpperCase());
    const initialZone: ZoneCode = existing?.zone ?? (ZONES.GREEN as ZoneCode);
    const initialPlanet: RecentPlanet = {
      uwp: r.uwp,
      name: r.name,
      zone: initialZone,
      timestamp: Date.now(),
      world,
    };
    onPick(initialPlanet);
    savePlanet(r.uwp, r.name, initialZone, world);
    setOpen(false);

    fetchWorldZone(r.sector, r.hexX, r.hexY)
      .then(zone => {
        if (zone && zone !== initialZone) {
          onPick({ ...initialPlanet, zone });
          savePlanet(r.uwp, r.name, zone, world);
        }
      })
      .catch((err: Error) => console.error("Failed to fetch world zone:", err));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{t("fromVisited")}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            padding: "8px 12px",
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            color: linkedPlanet ? theme.text : theme.textDimmed,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 14,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {linkedPlanet && (
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: getZoneColor(linkedPlanet.zone),
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {linkedPlanet
              ? `${linkedPlanet.name} · ${linkedPlanet.uwp}`
              : t("worldPickerPlaceholder")}
          </span>
        </button>
        {linkedPlanet && (
          <Button
            variant="ghost"
            theme={theme}
            onClick={onClear}
            aria-label={t("worldPickerClearLink")}
          >
            <IconClose />
          </Button>
        )}
      </div>
      {open && (
        <PickerModal
          theme={theme}
          t={t}
          recentPlanets={recentPlanets}
          onSelectVisited={(planet) => { onPick(planet); setOpen(false); }}
          onSelectSearched={handlePickSearched}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};
