import type { FC, ChangeEvent } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { Language, TranslationFunction } from "../types/i18n";
import type { RecentPlanet, TravellerMapWorld, ZoneCode } from "../types/uwp";
import type {
  ParsecDistance,
  PassengerClass,
  PassengerClassResult,
  PassengerInputs,
  PassengerPopTier,
  PassengerResult,
  PassengerStarport,
  PassengerWorldInputs,
  PassengerZoneTier,
} from "../types/passenger";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Section } from "../components/ui/Section";
import { Button } from "../components/ui/Button";
import { JumpCountField, distributeJumps } from "../components/ui/JumpsEditor";
import { WorldPicker } from "../components/ui/WorldPicker";
import { PageHeader } from "../components/ui/PageHeader";
import { PassengerBanner } from "../components/banners";
import { IconUsers, IconRefresh } from "../components/icons";
import { COLORS, SECTION_COLORS } from "../constants/colors";
import {
  BROKER_EFFECT_MAX,
  BROKER_EFFECT_MIN,
  PARSEC_OPTIONS,
  PASSAGE_PRICES,
  PASSENGER_CLASS_OPTIONS,
  PASSENGER_POP_OPTIONS,
  PASSENGER_STARPORT_OPTIONS,
  PASSENGER_ZONE_OPTIONS,
  STEWARD_SKILL_MAX,
  STEWARD_SKILL_MIN,
} from "../constants/passenger";
import { STORAGE_KEYS, isFiniteNumber } from "../constants/storage";
import { usePersistentState } from "../hooks/usePersistentState";
import { calculatePassengers } from "../utils/passenger";
import { planetToPassengerWorld } from "../utils/planetToWorldInputs";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent";

interface PassengerViewProps {
  theme: Theme;
  lang: Language;
  view: ViewType;
  goHome: () => void;
  navigateTo: (view: ViewType, uwp?: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
  recentPlanets: RecentPlanet[];
  savePlanet: (uwp: string, name: string, zone: ZoneCode, world?: TravellerMapWorld) => void;
}

const DEFAULT_WORLD: PassengerWorldInputs = {
  population: "mid",
  starport: "C",
  zone: "green",
};

const popKey = (p: PassengerPopTier): string => {
  switch (p) {
    case "veryLow": return "freightPopLow";
    case "mid": return "freightPopMid";
    case "high": return "freightPopHigh";
    case "veryHigh": return "freightPopVeryHigh";
  }
};

const zoneKey = (z: PassengerZoneTier): string => {
  switch (z) {
    case "green": return "zoneGreen";
    case "amber": return "zoneAmber";
    case "red": return "zoneRed";
  }
};

const classKey = (c: PassengerClass): string => {
  switch (c) {
    case "high": return "passengerClassHigh";
    case "middle": return "passengerClassMiddle";
    case "basic": return "passengerClassBasic";
    case "low": return "passengerClassLow";
  }
};

const classRollKey = (c: PassengerClass): string => {
  switch (c) {
    case "high": return "passengerRollHigh";
    case "middle": return "passengerRollMiddle";
    case "basic": return "passengerRollBasic";
    case "low": return "passengerRollLow";
  }
};

const classColor = (c: PassengerClass): string => {
  switch (c) {
    case "high": return COLORS.primary;
    case "middle": return COLORS.warning;
    case "basic": return COLORS.info;
    case "low": return COLORS.success;
  }
};

const formatSigned = (n: number): string => (n > 0 ? `+${n}` : `${n}`);

const formatCredits = (n: number, lang: Language): string =>
  `Cr ${n.toLocaleString(lang === "es" ? "es-ES" : "en-US")}`;

const parseRollInput = (raw: string): number | null => {
  if (raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return null;
  return Math.max(2, Math.min(12, n));
};

const clampInt = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

const parseClampedInt = (raw: string, min: number, max: number, fallback: number): number => {
  if (raw.trim() === "") return fallback;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return clampInt(n, min, max);
};

const rollOneD6 = (): number => Math.floor(Math.random() * 6) + 1;
const rollD6Array = (count: number): number[] =>
  Array.from({ length: Math.max(0, count) }, rollOneD6);
const rollTwoD6 = (): number => rollOneD6() + rollOneD6();

interface RollState {
  high: string;
  middle: string;
  basic: string;
  low: string;
}

const DEFAULT_ROLLS: RollState = { high: "", middle: "", basic: "", low: "" };

const EMPTY_SELECTION: Record<PassengerClass, number> = {
  high: 0,
  middle: 0,
  basic: 0,
  low: 0,
};

export const PassengerView: FC<PassengerViewProps> = ({
  theme,
  lang,
  view,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
  recentPlanets,
  savePlanet,
}) => {
  const [origin, setOrigin] = useState<PassengerWorldInputs>(DEFAULT_WORLD);
  const [destination, setDestination] = useState<PassengerWorldInputs>(DEFAULT_WORLD);
  const [originLinkUwp, setOriginLinkUwp] = useState<string | null>(null);
  const [destinationLinkUwp, setDestinationLinkUwp] = useState<string | null>(null);

  const applyPlanet = (
    planet: RecentPlanet,
    setWorld: (w: PassengerWorldInputs) => void,
    setLink: (uwp: string | null) => void,
  ): void => {
    const mapped = planetToPassengerWorld(planet);
    if (!mapped) return;
    setWorld(mapped);
    setLink(planet.uwp);
  };
  const [parsecs, setParsecs] = useState<ParsecDistance>(1);
  const [jumpCount, setJumpCount] = useState<number>(1);
  const jumps = useMemo(() => distributeJumps(parsecs, jumpCount), [parsecs, jumpCount]);
  // Datos de tripulación: persisten entre sesiones y sobreviven al reset.
  const [brokerEffect, setBrokerEffect] = usePersistentState<number>(
    STORAGE_KEYS.passengerBrokerEffect, 0, isFiniteNumber,
  );
  const [stewardSkill, setStewardSkill] = usePersistentState<number>(
    STORAGE_KEYS.passengerStewardSkill, 0, isFiniteNumber,
  );
  const [rolls, setRolls] = useState<RollState>(DEFAULT_ROLLS);
  const [calculatedResult, setCalculatedResult] = useState<PassengerResult | null>(null);
  const [rolling, setRolling] = useState<boolean>(false);
  const [selected, setSelected] = useState<Record<PassengerClass, number>>(EMPTY_SELECTION);

  const liveInputs: PassengerInputs = useMemo(() => ({
    origin,
    destination,
    parsecs,
    jumps,
    brokerEffect,
    stewardSkill,
    rollHigh: parseRollInput(rolls.high),
    rollMiddle: parseRollInput(rolls.middle),
    rollBasic: parseRollInput(rolls.basic),
    rollLow: parseRollInput(rolls.low),
    diceHigh: [],
    diceMiddle: [],
    diceBasic: [],
    diceLow: [],
  }), [origin, destination, parsecs, jumps, brokerEffect, stewardSkill, rolls]);

  const liveResult = useMemo(() => calculatePassengers(liveInputs, t), [liveInputs, t]);

  const handleCalculate = (): void => {
    const auto2D = (manual: number | null): number => manual ?? rollTwoD6();
    const planInputs: PassengerInputs = {
      ...liveInputs,
      rollHigh: auto2D(liveInputs.rollHigh),
      rollMiddle: auto2D(liveInputs.rollMiddle),
      rollBasic: auto2D(liveInputs.rollBasic),
      rollLow: auto2D(liveInputs.rollLow),
    };
    const plan = calculatePassengers(planInputs, t);
    const rolledInputs: PassengerInputs = {
      ...planInputs,
      diceHigh: rollD6Array(plan.classes.high.diceCount ?? 0),
      diceMiddle: rollD6Array(plan.classes.middle.diceCount ?? 0),
      diceBasic: rollD6Array(plan.classes.basic.diceCount ?? 0),
      diceLow: rollD6Array(plan.classes.low.diceCount ?? 0),
    };
    setCalculatedResult(calculatePassengers(rolledInputs, t));
    setSelected(EMPTY_SELECTION);
    setRolling(true);
    window.setTimeout(() => setRolling(false), 500);
  };

  // Limpia la ruta para empezar de cero. NO toca las habilidades de la
  // tripulación (efecto broker/carouse/streetwise, steward): son sticky.
  const handleReset = (): void => {
    setOrigin(DEFAULT_WORLD);
    setDestination(DEFAULT_WORLD);
    setOriginLinkUwp(null);
    setDestinationLinkUwp(null);
    setParsecs(1);
    setJumpCount(1);
    setRolls(DEFAULT_ROLLS);
    setCalculatedResult(null);
    setRolling(false);
    setSelected(EMPTY_SELECTION);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const adjustSelected = (cls: PassengerClass, delta: number, max: number): void => {
    setSelected(prev => ({ ...prev, [cls]: clampInt(prev[cls] + delta, 0, max) }));
  };

  const selectionTotals = useMemo(() => {
    if (!calculatedResult) return { count: 0, revenue: 0 };
    let count = 0;
    let revenue = 0;
    PASSENGER_CLASS_OPTIONS.forEach(cls => {
      const n = selected[cls];
      count += n;
      revenue += n * calculatedResult.classes[cls].pricePerSeat;
    });
    return { count, revenue };
  }, [calculatedResult, selected]);

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

  const labelStyle = {
    display: "block",
    fontSize: 12,
    color: theme.textDimmed,
    marginBottom: 4,
    fontWeight: 500,
  } as const;

  const fieldGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  } as const;

  const renderWorld = (
    label: string,
    world: PassengerWorldInputs,
    setWorldRaw: (w: PassengerWorldInputs) => void,
    linkUwp: string | null,
    setLinkUwp: (uwp: string | null) => void,
    color: string,
  ) => {
    const handleManual = (w: PassengerWorldInputs): void => {
      setWorldRaw(w);
      setLinkUwp(null);
    };
    return (
      <Section title={label} color={color} theme={theme}>
        <WorldPicker
          theme={theme}
          t={t}
          recentPlanets={recentPlanets}
          linkUwp={linkUwp}
          onPick={planet => applyPlanet(planet, setWorldRaw, setLinkUwp)}
          onClear={() => setLinkUwp(null)}
          savePlanet={savePlanet}
          labelStyle={labelStyle}
        />
        <div style={fieldGridStyle}>
          <div>
            <label style={labelStyle}>{t("passengerPopulation")}</label>
            <select
              style={inputStyle}
              value={world.population}
              onChange={e => handleManual({ ...world, population: e.target.value as PassengerPopTier })}
            >
              {PASSENGER_POP_OPTIONS.map(p => (
                <option key={p} value={p}>{t(popKey(p))}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t("passengerStarport")}</label>
            <select
              style={inputStyle}
              value={world.starport}
              onChange={e => handleManual({ ...world, starport: e.target.value as PassengerStarport })}
            >
              {PASSENGER_STARPORT_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t("passengerZone")}</label>
            <select
              style={inputStyle}
              value={world.zone}
              onChange={e => handleManual({ ...world, zone: e.target.value as PassengerZoneTier })}
            >
              {PASSENGER_ZONE_OPTIONS.map(z => (
                <option key={z} value={z}>{t(zoneKey(z))}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>
    );
  };

  const renderClassRow = (cls: PassengerClass, classResult: PassengerClassResult) => {
    const color = classColor(cls);
    const hasResult = classResult.dice !== null;
    const diceSum = classResult.dice?.reduce((s, d) => s + d, 0) ?? null;
    const diceText = classResult.dice && classResult.dice.length > 0
      ? `${classResult.dice.join(" + ")} = ${diceSum}`
      : t("freightDash");
    const perJumpText = jumps.length > 1
      ? jumps.map(j => `J-${j} ${formatCredits(PASSAGE_PRICES[j][cls], lang)}`).join(" + ")
      : null;

    return (
      <div key={cls} style={{ padding: "12px 0", borderTop: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color, fontSize: 14, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
            {t(classKey(cls))}
          </span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: theme.textDimmed }}>
              {t("passengerColPrice")}: {formatCredits(classResult.pricePerSeat, lang)}
            </span>
            {perJumpText && (
              <span style={{ fontFamily: "monospace", fontSize: 11, color: theme.textDimmed }}>
                = {perJumpText}
              </span>
            )}
          </div>
        </div>

        {classResult.rolled2D === null ? (
          <div style={{ fontSize: 12, color: theme.textDimmed, fontStyle: "italic" }}>
            {t("passengerRollsMissing")}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: theme.text, lineHeight: 1.5 }}>
              <span style={{ color: theme.textDimmed }}>2D </span>
              <span>{classResult.rolled2D}</span>
              <span style={{ color: theme.textDimmed }}> + DM </span>
              <span style={{ color: classResult.dm < 0 ? COLORS.warning : COLORS.success }}>
                {formatSigned(classResult.dm)}
              </span>
              <span style={{ color: theme.textDimmed }}> = </span>
              <span style={{ fontWeight: 500 }}>{classResult.finalRoll}</span>
              <span style={{ color: theme.textDimmed }}> → </span>
              <span className={rolling ? "dice-rolling" : undefined} style={{ fontWeight: 500 }}>
                {classResult.diceCount}D6
              </span>
            </div>
            {hasResult ? (
              <>
                <div style={{ fontSize: 12, fontFamily: "monospace", color: theme.textDimmed }}>
                  {t("passengerColDice")}: <span style={{ color: theme.text }}>{diceText}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 10, color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {t("passengerColPassengers")}
                    </span>
                    {classResult.passengers === 0 || classResult.diceCount === 0 ? (
                      <span style={{ fontSize: 14, color: COLORS.warning, fontWeight: 500 }}>
                        {t("passengerNoSeats")}
                      </span>
                    ) : (
                      <span style={{ fontSize: 22, fontWeight: 500, color: theme.text, fontFamily: "monospace" }}>
                        {classResult.passengers}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 10, color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {t("passengerColIncome")}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 500, color: COLORS.success, fontFamily: "monospace" }}>
                      {formatCredits(classResult.income ?? 0, lang)}
                    </span>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    );
  };

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
        <PassengerBanner theme={theme} />
        <PageHeader title={t("passengerTitle")} icon={<IconUsers />} />

        <div className="two-col-grid">
        <div>
        {renderWorld(t("passengerOriginSection"), origin, setOrigin, originLinkUwp, setOriginLinkUwp, SECTION_COLORS.starport)}
        {renderWorld(t("passengerDestinationSection"), destination, setDestination, destinationLinkUwp, setDestinationLinkUwp, SECTION_COLORS.population)}

        <Section title={t("passengerRouteSection")} color={SECTION_COLORS.size} theme={theme}>
          <div style={fieldGridStyle}>
            <div>
              <label style={labelStyle}>{t("passengerParsecs")}</label>
              <select
                style={inputStyle}
                value={parsecs}
                onChange={e => setParsecs(parseInt(e.target.value, 10) as ParsecDistance)}
              >
                {PARSEC_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <JumpCountField
              parsecs={parsecs}
              jumpCount={jumpCount}
              setJumpCount={setJumpCount}
              theme={theme}
              t={t}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: theme.textDimmed, fontWeight: 500, marginBottom: 6 }}>
              {t("routeJumpsBreakdown")} ({t("passengerColPrice")})
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 320 }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "56px repeat(4, minmax(0, 1fr))",
                  gap: 8,
                  padding: "3px 0",
                  fontSize: 10,
                  color: theme.textDimmed,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  <span></span>
                  {PASSENGER_CLASS_OPTIONS.map(cls => (
                    <span key={cls} style={{ textAlign: "right", color: classColor(cls), fontWeight: 500 }}>
                      {t(classKey(cls))}
                    </span>
                  ))}
                </div>
                {jumps.map((j, idx) => (
                  <div key={idx} style={{
                    display: "grid",
                    gridTemplateColumns: "56px repeat(4, minmax(0, 1fr))",
                    gap: 8,
                    alignItems: "baseline",
                    fontSize: 13,
                    fontFamily: "monospace",
                    padding: "3px 0",
                    borderBottom: `1px dashed ${theme.border}`,
                  }}>
                    <span style={{ color: COLORS.primary, fontWeight: 500 }}>J-{j}</span>
                    {PASSENGER_CLASS_OPTIONS.map(cls => (
                      <span key={cls} style={{ color: theme.text, textAlign: "right" }}>
                        {formatCredits(PASSAGE_PRICES[j][cls], lang)}
                      </span>
                    ))}
                  </div>
                ))}
                {jumps.length > 1 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "56px repeat(4, minmax(0, 1fr))",
                    gap: 8,
                    alignItems: "baseline",
                    fontSize: 13,
                    fontFamily: "monospace",
                    padding: "6px 0 0",
                    fontWeight: 500,
                  }}>
                    <span style={{ color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>
                      {t("routeJumpsTotal")}
                    </span>
                    {PASSENGER_CLASS_OPTIONS.map(cls => {
                      const total = jumps.reduce((s, jj) => s + PASSAGE_PRICES[jj][cls], 0);
                      return (
                        <span key={cls} style={{ color: COLORS.success, textAlign: "right" }}>
                          {formatCredits(total, lang)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6 }}>
              {t("routeJumpsHint")}
            </div>
          </div>
        </Section>

        <Section title={t("passengerSkillsSection")} color={SECTION_COLORS.atmosphere} theme={theme}>
          <div style={fieldGridStyle}>
            <div>
              <label style={labelStyle}>{t("passengerBrokerEffect")}</label>
              <input
                type="number"
                min={BROKER_EFFECT_MIN}
                max={BROKER_EFFECT_MAX}
                style={inputStyle}
                value={brokerEffect}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBrokerEffect(parseClampedInt(e.target.value, BROKER_EFFECT_MIN, BROKER_EFFECT_MAX, 0))
                }
              />
              <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 4 }}>
                {t("passengerBrokerNote")}
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t("passengerStewardSkill")}</label>
              <input
                type="number"
                min={STEWARD_SKILL_MIN}
                max={STEWARD_SKILL_MAX}
                style={inputStyle}
                value={stewardSkill}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setStewardSkill(parseClampedInt(e.target.value, STEWARD_SKILL_MIN, STEWARD_SKILL_MAX, 0))
                }
              />
              <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 4 }}>
                {t("passengerStewardNote")}
              </div>
            </div>
          </div>
        </Section>
        </div>

        <div>
        <Section title={t("passengerDMsSection")} color={COLORS.primary} theme={theme}>
          {liveResult.breakdown.length === 0 ? (
            <div style={{ fontSize: 13, color: theme.textDimmed }}>{t("passengerNoFactors")}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {liveResult.breakdown.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: `1px dashed ${theme.border}` }}>
                  <span style={{ color: theme.text }}>{item.label}</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 500, color: item.value < 0 ? COLORS.warning : COLORS.success }}>
                    {formatSigned(item.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `2px solid ${theme.border}`, fontWeight: 500 }}>
            <span>{t("passengerBaseDM")}</span>
            <span style={{ fontFamily: "monospace", color: liveResult.baseDM < 0 ? COLORS.warning : COLORS.success }}>
              {formatSigned(liveResult.baseDM)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6 }}>{t("passengerTrafficNote")}</div>
        </Section>

        <Section title={t("passengerTrafficSection")} color={COLORS.secondary} theme={theme}>
          <div style={{ fontSize: 13, color: theme.textDimmed, marginBottom: 14, lineHeight: 1.5 }}>
            {t("passengerTrafficIntro")}
          </div>
          <div style={fieldGridStyle}>
            {PASSENGER_CLASS_OPTIONS.map(cls => {
              const liveDM = liveResult.classes[cls].dm;
              return (
                <div key={cls}>
                  <label style={labelStyle}>
                    {t(classRollKey(cls))}
                    <span style={{ color: classColor(cls), marginLeft: 6, fontWeight: 500, fontFamily: "monospace" }}>
                      (DM {formatSigned(liveDM)})
                    </span>
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    placeholder={t("passengerRollPlaceholder")}
                    style={inputStyle}
                    value={rolls[cls]}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setRolls({ ...rolls, [cls]: e.target.value })
                    }
                  />
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 8 }}>
            {t("passengerRollHelp")}
          </div>
        </Section>
        </div>
        </div>

        <div style={{ margin: "20px 0" }}>
          <Button
            variant="primary"
            size="lg"
            theme={theme}
            onClick={handleCalculate}
            fullWidth
          >
            <span className={rolling ? "dice-rolling" : undefined}>
              <IconUsers />
            </span>
            {t("passengerCalculate")}
          </Button>
        </div>

        {calculatedResult && (
          <Section title={t("passengerResultsSection")} color={SECTION_COLORS.population} theme={theme}>
            <div>
              {PASSENGER_CLASS_OPTIONS.map(cls => renderClassRow(cls, calculatedResult.classes[cls]))}
            </div>
          </Section>
        )}

        {calculatedResult && calculatedResult.hasRolls && (
          <Section title={t("passengerSelectSection")} color={COLORS.info} theme={theme}>
            <div style={{ fontSize: 13, color: theme.textDimmed, marginBottom: 12, lineHeight: 1.5 }}>
              {t("passengerSelectIntro")}
            </div>
            {PASSENGER_CLASS_OPTIONS.every(cls => (calculatedResult.classes[cls].passengers ?? 0) === 0) ? (
              <div style={{ fontSize: 13, color: theme.textDimmed, fontStyle: "italic" }}>
                {t("passengerNoSeats")}
              </div>
            ) : (
              PASSENGER_CLASS_OPTIONS.map(cls => {
                const c = calculatedResult.classes[cls];
                const max = c.passengers ?? 0;
                if (max === 0) return null;
                const color = classColor(cls);
                const current = selected[cls];
                const counterBtn = {
                  width: 32,
                  height: 32,
                  minHeight: 32,
                  borderRadius: 8,
                  border: `1px solid ${color}`,
                  background: "transparent",
                  color,
                  fontSize: 18,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                } as const;
                const counterBtnDisabled = { ...counterBtn, opacity: 0.35, cursor: "not-allowed" } as const;
                return (
                  <div key={cls} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: `1px solid ${theme.border}`, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ color, fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
                        {t(classKey(cls))}
                      </span>
                      <span style={{ fontSize: 11, color: theme.textDimmed, fontFamily: "monospace" }}>
                        {max} {t("passengerAvailable")} · {formatCredits(c.pricePerSeat, lang)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => adjustSelected(cls, -1, max)}
                        disabled={current === 0}
                        aria-label={t("passengerDecrease")}
                        style={current === 0 ? counterBtnDisabled : counterBtn}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 56, textAlign: "center", fontFamily: "monospace", fontSize: 16, fontWeight: 500, color: theme.text }}>
                        {current} / {max}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustSelected(cls, 1, max)}
                        disabled={current === max}
                        aria-label={t("passengerIncrease")}
                        style={current === max ? counterBtnDisabled : counterBtn}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </Section>
        )}

        {calculatedResult && calculatedResult.hasRolls && (
          <Section title={t("passengerSummarySection")} color={SECTION_COLORS.starport} theme={theme}>
            {selectionTotals.count === 0 ? (
              <div style={{ fontSize: 13, color: theme.textDimmed, fontStyle: "italic" }}>
                {t("passengerSelectNone")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {PASSENGER_CLASS_OPTIONS.map(cls => {
                  const n = selected[cls];
                  if (n === 0) return null;
                  const c = calculatedResult.classes[cls];
                  return (
                    <div key={cls} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, padding: "4px 0", borderBottom: `1px dashed ${theme.border}` }}>
                      <span style={{ color: theme.textDimmed }}>
                        {n} × {t(classKey(cls))}
                      </span>
                      <span style={{ fontFamily: "monospace", color: theme.text }}>
                        {formatCredits(n * c.pricePerSeat, lang)}
                      </span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8, paddingTop: 10, borderTop: `2px solid ${theme.border}` }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {t("passengerTotalSeats")}
                  </span>
                  <span style={{ fontFamily: "monospace", fontWeight: 500, fontSize: 16, color: theme.text }}>
                    {selectionTotals.count} {t("passengerSeatsLabel")}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {t("passengerTotalRevenue")}
                  </span>
                  <span style={{ fontFamily: "monospace", fontWeight: 500, fontSize: 20, color: COLORS.success }}>
                    {formatCredits(selectionTotals.revenue, lang)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6 }}>
                  {t("passengerHelpHint")}
                </div>
              </div>
            )}
          </Section>
        )}

        {calculatedResult && (
          <div style={{ margin: "24px 0 8px" }}>
            <Button
              variant="secondary"
              size="lg"
              theme={theme}
              onClick={handleReset}
              fullWidth
            >
              <IconRefresh />{t("resetCalculator")}
            </Button>
            <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6, textAlign: "center" }}>
              {t("resetCalculatorHint")}
            </div>
          </div>
        )}

        <Footer theme={theme} t={t} />
      </main>
    </div>
  );
};
