import type { FC } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction, Language } from "../types/i18n";
import type { TravellerMapWorld, ZoneCode, StarportClass } from "../types/uwp";
import type { StarportData, SizeData, AtmosphereData, GovernmentData } from "../types/game-data";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Section } from "../components/ui/Section";
import { Row } from "../components/ui/Row";
import { COLORS, SECTION_COLORS } from "../constants/colors";
import { ZONES, ZONE_COLORS, getZoneColor } from "../constants/zones";
import {
  SIZE_RULES,
  ATMO_RULES,
  POP_RULES,
  LAW_RULES,
  TECH_COMM,
  getTechLevelKey
} from "../constants/gameRules";
import { requiresWarning } from "../utils/i18n-helpers";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby";

interface ParsedUWP {
  sp: StarportClass;
  sz: number;
  at: number;
  hy: number;
  po: number;
  go: number;
  la: number;
  tl: number;
}

interface PlanetViewProps {
  theme: Theme;
  parsed: ParsedUWP | null;
  uwp: string;
  name: string;
  zoneInput: ZoneCode;
  world?: TravellerMapWorld;
  view: ViewType;
  goHome: () => void;
  navigateTo: (view: ViewType) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
  lang: Language;
  STARPORT: Record<StarportClass, StarportData>;
  SIZE: SizeData[];
  ATMO: AtmosphereData[];
  HYDRO: string[];
  POP: string[];
  GOV: GovernmentData[];
  LAW_WEAPONS: string[];
  LAW_ARMOR: string[];
}

export const PlanetView: FC<PlanetViewProps> = ({
  theme,
  parsed,
  uwp,
  name,
  zoneInput,
  world,
  view,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
  lang,
  STARPORT,
  SIZE,
  ATMO,
  HYDRO,
  POP,
  GOV,
  LAW_WEAPONS,
  LAW_ARMOR
}) => {
  // Zone display name helper
  const getZoneName = (zone: ZoneCode): string => {
    if (zone === ZONES.RED) return lang === "es" ? "Roja" : "Red";
    if (zone === ZONES.AMBER) return lang === "es" ? "Ámbar" : "Amber";
    return t("zoneGreen");
  };

  if (!parsed) {
    return null; // Will redirect via useEffect in App
  }

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
        {/* Planet header */}
        <div style={{ background: theme.bgHeader, borderRadius: 12, padding: 20, marginBottom: 16, textAlign: "center" }}>
          <h1
            className="planet-name"
            style={{
              margin: 0,
              borderBottom: `2px solid ${COLORS.primary}44`,
              fontWeight: 500,
              color: name.trim() ? theme.text : theme.textDimmed,
              textAlign: "center",
              width: "100%",
              marginBottom: 4,
              padding: "4px 0",
            }}
          >
            {name.trim() || t("unnamed")}
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontFamily: "monospace", fontSize: 16, color: theme.textMuted, letterSpacing: 2 }}>{uwp.toUpperCase()}</span>
            <span
              aria-label={t("travelZone")}
              style={{
                background: getZoneColor(zoneInput) + "33",
                border: `1px solid ${getZoneColor(zoneInput)}`,
                borderRadius: 6,
                color: getZoneColor(zoneInput),
                padding: "4px 8px",
                fontSize: 12,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {getZoneName(zoneInput)}
            </span>
          </div>
        </div>

        {/* Location / jump map */}
        {world && (() => {
          const hex = `${String(world.hexX).padStart(2, "0")}${String(world.hexY).padStart(2, "0")}`;
          const jumpMapUrl = `https://travellermap.com/api/jumpmap?sector=${encodeURIComponent(world.sector)}&hex=${hex}&jump=4&scale=48&style=print`;
          const travellerMapUrl = `https://travellermap.com/?sector=${encodeURIComponent(world.sector)}&hex=${hex}`;
          return (
            <section
              aria-labelledby="location-heading"
              style={{
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderLeft: `4px solid ${COLORS.primary}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <h2
                  id="location-heading"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: COLORS.primary,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    margin: 0,
                  }}
                >
                  {t("worldLocation")}
                </h2>
                <a
                  href={travellerMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: `1px solid ${COLORS.primary}`,
                    color: COLORS.primary,
                    background: "transparent",
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    textDecoration: "none",
                    fontFamily: "inherit",
                  }}
                >
                  {t("viewOnTravellerMap")} ↗
                </a>
              </div>
              <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12 }}>
                <span>{t("sectorLabel")}: <strong style={{ color: theme.text, fontWeight: 500 }}>{world.sector}</strong></span>
                <span style={{ margin: "0 8px", color: theme.textDimmed }}>·</span>
                <span>{t("hexLabel")}: <strong style={{ color: theme.text, fontWeight: 500, fontFamily: "monospace", letterSpacing: 1 }}>{hex}</strong></span>
              </div>
              <img
                src={jumpMapUrl}
                alt={t("jumpMapAlt")}
                loading="lazy"
                className="jumpmap-image"
                style={{ background: theme.bg }}
              />
            </section>
          );
        })()}

        {/* World profile */}
        <h2
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: COLORS.primary,
            textTransform: "uppercase",
            letterSpacing: 2,
            margin: "24px 0 12px 0",
          }}
        >
          {t("worldProfile")}
        </h2>

        {/* Planet details */}
        <div className="world-profile-grid">
        <Section title={`${t("starport")} — ${t("class")} ${parsed.sp}`} color={SECTION_COLORS.starport} theme={theme}>
          <Row label={t("quality")} value={STARPORT[parsed.sp].name} theme={theme} />
          <Row label={t("fuel")} value={STARPORT[parsed.sp].fuel} theme={theme} />
          <Row label={t("berth")} value={STARPORT[parsed.sp].berth} theme={theme} />
          <Row label={t("services")} value={STARPORT[parsed.sp].services} theme={theme} />
          <Row label={t("possibleBases")} value={STARPORT[parsed.sp].bases} theme={theme} />
        </Section>

        <Section title={`${t("size")} — ${parsed.sz} ${SIZE[parsed.sz] ? `(${SIZE[parsed.sz].d})` : ""}`} color={SECTION_COLORS.size} theme={theme}>
          {SIZE[parsed.sz] && <>
            <Row label={t("diameter")} value={SIZE[parsed.sz].d} theme={theme} />
            <Row label={t("gravity")} value={`${SIZE[parsed.sz].g}g`} theme={theme} />
            {SIZE[parsed.sz].ex && <Row label={t("example")} value={SIZE[parsed.sz].ex} theme={theme} />}
            <Row label={t("description")} value={SIZE[parsed.sz].desc} theme={theme} />
            {parsed.sz <= SIZE_RULES.LOW_GRAVITY_MAX && parsed.sz > 0 && (
              <Row label={`⚠ ${t("gravityWarning")}`} value={t("lowGravity")} warn theme={theme} />
            )}
            {parsed.sz >= SIZE_RULES.HIGH_GRAVITY_MIN && (
              <Row label={`⚠ ${t("gravityWarning")}`} value={t("highGravity")} warn theme={theme} />
            )}
          </>}
        </Section>

        <Section title={`${t("atmosphere")} — ${parsed.at} (${ATMO[parsed.at]?.comp || t("unknown")})`} color={SECTION_COLORS.atmosphere} theme={theme}>
          {ATMO[parsed.at] && <>
            <Row label={t("composition")} value={ATMO[parsed.at].comp} theme={theme} />
            <Row label={t("pressure")} value={ATMO[parsed.at].pres} theme={theme} />
            <Row
              label={t("equipRequired")}
              value={ATMO[parsed.at].equip}
              warn={requiresWarning(ATMO[parsed.at].equip, t)}
              theme={theme}
            />
            <Row label={t("description")} value={ATMO[parsed.at].desc} theme={theme} />
            {parsed.at >= ATMO_RULES.DANGEROUS_MIN && (
              <Row label={`⚠ ${t("danger")}`} value={t("dangerousAtmo")} warn theme={theme} />
            )}
          </>}
        </Section>

        <Section title={`${t("hydrographics")} — ${parsed.hy} (${parsed.hy * 10}%-${Math.min(parsed.hy * 10 + 9, 100)}%)`} color={SECTION_COLORS.hydrographics} theme={theme}>
          <Row label={t("liquidCoverage")} value={HYDRO[parsed.hy] || `${parsed.hy * 10}%`} theme={theme} />
          {parsed.at >= ATMO_RULES.EXOTIC_MIN && parsed.hy > 0 && (
            <Row label={`⚠ ${t("note")}`} value={t("liquidNote")} warn theme={theme} />
          )}
        </Section>

        <Section title={`${t("population")} — ${parsed.po}`} color={SECTION_COLORS.population} theme={theme}>
          <Row label={t("inhabitants")} value={POP[parsed.po] || `${t("level")} ${parsed.po}`} theme={theme} />
          {parsed.po === POP_RULES.UNINHABITED && (
            <Row label={`⚠ ${t("note")}`} value={t("uninhabitedNote")} warn theme={theme} />
          )}
          {parsed.po <= POP_RULES.SMALL_COLONY_MAX && parsed.po > 0 && (
            <Row label={`⚠ ${t("note")}`} value={t("smallColonyNote")} warn theme={theme} />
          )}
        </Section>

        <Section title={`${t("government")} — ${parsed.go} (${GOV[parsed.go]?.type || t("unknown")})`} color={SECTION_COLORS.government} theme={theme}>
          {GOV[parsed.go] && <>
            <Row label={t("type")} value={GOV[parsed.go].type} theme={theme} />
            <Row label={t("description")} value={GOV[parsed.go].desc} theme={theme} />
            <Row
              label={t("commonContraband")}
              value={GOV[parsed.go].contra}
              warn={requiresWarning(GOV[parsed.go].contra, t)}
              theme={theme}
            />
          </>}
        </Section>

        <Section title={`${t("lawLevel")} — ${parsed.la}`} color={SECTION_COLORS.lawLevel} theme={theme}>
          <Row
            label={t("bannedWeapons")}
            value={LAW_WEAPONS[Math.min(parsed.la, LAW_RULES.MAX_LEVEL)] || LAW_WEAPONS[LAW_RULES.MAX_LEVEL]}
            warn={parsed.la >= LAW_RULES.WEAPONS_RESTRICTED_MIN}
            theme={theme}
          />
          <Row
            label={t("bannedArmor")}
            value={LAW_ARMOR[Math.min(parsed.la, LAW_RULES.MAX_LEVEL)] || LAW_ARMOR[LAW_RULES.MAX_LEVEL]}
            warn={parsed.la >= LAW_RULES.ARMOR_RESTRICTED_MIN}
            theme={theme}
          />
          {parsed.la === 0 && <Row label={t("note")} value={t("noRestrictions")} theme={theme} />}
          {parsed.la >= LAW_RULES.MARTIAL_LAW_MIN && (
            <Row label={`⚠ ${t("martialLaw")}`} value={t("allWeaponsArmorBanned")} warn theme={theme} />
          )}
        </Section>

        <Section title={`${t("techLevel")} — ${parsed.tl}`} color={SECTION_COLORS.techLevel} theme={theme}>
          <Row label={t("tl")} value={`${parsed.tl}`} theme={theme} />
          <Row label={t("equivalent")} value={t(getTechLevelKey(parsed.tl))} theme={theme} />
          {parsed.tl <= TECH_COMM.NO_TELECOM_MAX && (
            <Row label={`⚠ ${t("communications")}`} value={t("noTelecom")} warn theme={theme} />
          )}
          {parsed.tl >= TECH_COMM.RADIO_PHONE_MIN && parsed.tl <= TECH_COMM.RADIO_PHONE_MAX && (
            <Row label={t("communications")} value={t("radioPhone")} theme={theme} />
          )}
          {parsed.tl >= TECH_COMM.FULL_NETWORK_MIN && (
            <Row label={t("communications")} value={t("fullNetwork")} theme={theme} />
          )}
        </Section>

        {(zoneInput === ZONES.AMBER || zoneInput === ZONES.RED) && (
          <Section title={`${t("travelZone")} — ${getZoneName(zoneInput)}`} color={ZONE_COLORS[zoneInput]} theme={theme}>
            <Row label={t("code")} value={zoneInput === ZONES.AMBER ? t("amberCaution") : t("redProhibited")} warn theme={theme} />
            <Row label={t("meaning")} value={zoneInput === ZONES.AMBER ? t("amberMeaning") : t("redMeaning")} theme={theme} />
          </Section>
        )}
        </div>

        <div style={{ background: theme.bgCard, borderRadius: 12, padding: 16, textAlign: "center", marginTop: 8 }}>
          <div style={{ fontSize: 11, color: theme.textDimmed, textTransform: "uppercase", marginBottom: 6 }}>{t("worldLine")}</div>
          <code style={{ fontSize: 15, color: COLORS.warning, fontWeight: 500, letterSpacing: 1 }}>
            {name} {uwp.toUpperCase()} {zoneInput}
          </code>
        </div>

        <Footer theme={theme} t={t} />
      </main>
    </div>
  );
};
