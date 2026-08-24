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
  ShipBerths,
} from "../types/passenger";
import type { ContractData, ContractLine, ContractParty } from "../types/contract";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ContractModal } from "../components/ContractModal";
import { Section } from "../components/ui/Section";
import { Button } from "../components/ui/Button";
import { JumpCountField, distributeJumps } from "../components/ui/JumpsEditor";
import { WorldPicker } from "../components/ui/WorldPicker";
import { Field } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { PassengerBanner } from "../components/banners";
import { IconUsers, IconFileText, IconRefresh } from "../components/icons";
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
import { STORAGE_KEYS, isFiniteNumber, isString } from "../constants/storage";
import { usePersistentState } from "../hooks/usePersistentState";
import { calculatePassengers } from "../utils/passenger";
import { planetToPassengerWorld } from "../utils/planetToWorldInputs";
import { formatCredits } from "../utils/format";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby";

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

const berthHintKey = (c: PassengerClass): string => {
  switch (c) {
    case "high": return "shipBerthHighHint";
    case "middle": return "shipBerthMiddleHint";
    case "basic": return "shipBerthBasicHint";
    case "low": return "shipBerthLowHint";
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

// Un DM de 0 no es favorable: se muestra neutro, no en verde.
const dmColor = (value: number, theme: Theme): string =>
  value === 0 ? theme.textDimmed : value < 0 ? COLORS.warning : COLORS.success;

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

const NO_BERTHS: ShipBerths = { high: 0, middle: 0, basic: 0, low: 0 };

const isShipBerths = (raw: unknown): raw is ShipBerths => {
  if (typeof raw !== "object" || raw === null) return false;
  const b = raw as Record<string, unknown>;
  return PASSENGER_CLASS_OPTIONS.every(cls => isFiniteNumber(b[cls]));
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
  // Datos de nave/tripulación: persisten entre sesiones y sobreviven al reset.
  const [shipName, setShipName] = usePersistentState<string>(
    STORAGE_KEYS.shipName, "", isString,
  );
  const [berths, setBerths] = usePersistentState<ShipBerths>(
    STORAGE_KEYS.passengerBerths, NO_BERTHS, isShipBerths,
  );
  const [brokerEffect, setBrokerEffect] = usePersistentState<number>(
    STORAGE_KEYS.passengerBrokerEffect, 0, isFiniteNumber,
  );
  const [stewardSkill, setStewardSkill] = usePersistentState<number>(
    STORAGE_KEYS.passengerStewardSkill, 0, isFiniteNumber,
  );
  const [rolls, setRolls] = useState<RollState>(DEFAULT_ROLLS);
  const [contractOpen, setContractOpen] = useState<boolean>(false);
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
    setContractOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const adjustSelected = (cls: PassengerClass, delta: number, max: number): void => {
    // Se parte del valor ya recortado al tope: si el jugador baja las plazas
    // después de reservar, el "-" tiene que responder al primer clic.
    setSelected(prev => ({ ...prev, [cls]: clampInt(clampInt(prev[cls], 0, max) + delta, 0, max) }));
  };

  // Tope real por clase: lo que ha salido en la tirada y lo que cabe a bordo.
  // Sin plazas de una clase no se puede aceptar a nadie de ella.
  const maxSeats = useMemo<Record<PassengerClass, number>>(() => {
    const out = { ...EMPTY_SELECTION };
    PASSENGER_CLASS_OPTIONS.forEach(cls => {
      const available = calculatedResult?.classes[cls].passengers ?? 0;
      out[cls] = Math.min(available, berths[cls]);
    });
    return out;
  }, [calculatedResult, berths]);

  // Reserva efectiva. Se deriva en vez de guardarse para que bajar las plazas
  // después de haber reservado no deje una venta imposible en pie.
  const booked = useMemo<Record<PassengerClass, number>>(() => {
    const out = { ...EMPTY_SELECTION };
    PASSENGER_CLASS_OPTIONS.forEach(cls => {
      out[cls] = clampInt(selected[cls], 0, maxSeats[cls]);
    });
    return out;
  }, [selected, maxSeats]);

  const selectionTotals = useMemo(() => {
    if (!calculatedResult) return { count: 0, revenue: 0 };
    let count = 0;
    let revenue = 0;
    PASSENGER_CLASS_OPTIONS.forEach(cls => {
      const n = booked[cls];
      count += n;
      revenue += n * calculatedResult.classes[cls].pricePerSeat;
    });
    return { count, revenue };
  }, [calculatedResult, booked]);

  // Factura del pasaje: una línea por cada clase reservada.
  const contractData: ContractData | null = useMemo(() => {
    if (!calculatedResult) return null;

    const party = (role: string, world: PassengerWorldInputs, linkUwp: string | null): ContractParty => {
      const planet = linkUwp ? recentPlanets.find(p => p.uwp === linkUwp) : undefined;
      if (planet) {
        const sector = planet.world?.sector;
        return {
          role,
          name: planet.name || t("unnamed"),
          detail: sector ? `${planet.uwp} · ${sector}` : planet.uwp,
        };
      }
      return {
        role,
        name: t("contractUnlinkedWorld"),
        detail: [world.starport, t(popKey(world.population)), t(zoneKey(world.zone))].join(" · "),
      };
    };

    const lines: ContractLine[] = [];
    PASSENGER_CLASS_OPTIONS.forEach(cls => {
      const seats = booked[cls];
      if (seats === 0) return;
      const price = calculatedResult.classes[cls].pricePerSeat;
      // Con varios saltos, cada tramo es su propia línea, igual que en el
      // resumen: el precio de la tabla es por salto.
      const legs = jumps.length > 1
        ? jumps.map((j, i) => ({
            id: `${cls}-${i}`,
            label: `${t(classKey(cls))} · J-${j}`,
            price: PASSAGE_PRICES[j][cls],
          }))
        : [{ id: cls, label: t(classKey(cls)), price }];
      legs.forEach(leg => lines.push({
        id: leg.id,
        label: leg.label,
        qty: `× ${seats}`,
        rate: formatCredits(leg.price, lang),
        amount: formatCredits(seats * leg.price, lang),
        accent: classColor(cls),
      }));
    });

    return {
      kind: "passenger",
      title: t("contractPassengerTitle"),
      ship: shipName.trim() || null,
      parties: [
        party(t("contractOrigin"), origin, originLinkUwp),
        party(t("contractDestination"), destination, destinationLinkUwp),
      ],
      meta: [
        { label: t("passengerParsecs"), value: String(parsecs) },
        { label: t("routeJumpsLabel"), value: String(jumps.length) },
        { label: t("contractJumpPlan"), value: jumps.map(j => `J-${j}`).join(" + ") },
      ],
      lines,
      total: {
        qty: `× ${selectionTotals.count}`,
        amount: formatCredits(selectionTotals.revenue, lang),
      },
      totals: [],
      notes: [],
    };
  }, [
    calculatedResult, booked, selectionTotals, lang, t, parsecs, jumps, shipName,
    origin, destination, originLinkUwp, destinationLinkUwp, recentPlanets,
  ]);

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
    // El mundo del otro extremo: no se puede elegir dos veces la misma ruta.
    otherLinkUwp: string | null,
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
          excludeUwp={otherLinkUwp}
          onPick={planet => applyPlanet(planet, setWorldRaw, setLinkUwp)}
          onClear={() => setLinkUwp(null)}
          savePlanet={savePlanet}
        />
        <div style={fieldGridStyle}>
          <Field label={t("passengerPopulation")} theme={theme}>
            {id => (
              <select
                id={id}
                style={inputStyle}
                value={world.population}
                onChange={e => handleManual({ ...world, population: e.target.value as PassengerPopTier })}
              >
                {PASSENGER_POP_OPTIONS.map(p => (
                  <option key={p} value={p}>{t(popKey(p))}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("passengerStarport")} theme={theme}>
            {id => (
              <select
                id={id}
                style={inputStyle}
                value={world.starport}
                onChange={e => handleManual({ ...world, starport: e.target.value as PassengerStarport })}
              >
                {PASSENGER_STARPORT_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("passengerZone")} theme={theme}>
            {id => (
              <select
                id={id}
                style={inputStyle}
                value={world.zone}
                onChange={e => handleManual({ ...world, zone: e.target.value as PassengerZoneTier })}
              >
                {PASSENGER_ZONE_OPTIONS.map(z => (
                  <option key={z} value={z}>{t(zoneKey(z))}</option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </Section>
    );
  };

  const renderClassRow = (cls: PassengerClass, classResult: PassengerClassResult) => {
    const color = classColor(cls);
    const hasResult = classResult.dice !== null;
    const diceText = classResult.dice && classResult.dice.length > 0
      ? classResult.dice.join(" + ")
      : null;
    // Con un solo salto no hay nada que desglosar: el precio de la tabla ya
    // es el del viaje entero.
    const perJumpText = jumps.length > 1
      ? jumps.map(j => `J-${j} ${formatCredits(PASSAGE_PRICES[j][cls], lang)}`)
      : [];

    return (
      <div key={cls} style={{ padding: "12px 0", borderTop: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color, fontSize: 14, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
            {t(classKey(cls))}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
              fontFamily: "monospace",
              color: theme.textDimmed,
            }}
          >
            {perJumpText.map((note, i) => (
              <span key={i} style={{ fontSize: 11 }}>{note}</span>
            ))}
            <span style={{ fontSize: 12 }}>
              {t("passengerColPrice")}: {formatCredits(classResult.pricePerSeat, lang)}
            </span>
          </div>
        </div>

        {classResult.rolled2D === null ? (
          <div style={{ fontSize: 12, color: theme.textDimmed, fontStyle: "italic" }}>
            {t("passengerRollsMissing")}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: theme.text, lineHeight: 1.5 }}>
              <span style={{ color: theme.textDimmed }}>2D </span>
              {classResult.rolled2D}
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
              {diceText && <span style={{ color: theme.textDimmed }}> · {diceText}</span>}
            </span>
            {hasResult && (
              classResult.passengers === 0 || classResult.diceCount === 0 ? (
                <span style={{ fontSize: 13, color: COLORS.warning, fontWeight: 500 }}>
                  {t("passengerNoSeats")}
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 500, color: theme.text, fontFamily: "monospace" }}>
                    {classResult.passengers}
                  </span>
                  <span style={{ fontSize: 10, color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {t("passengerColPassengers")}
                  </span>
                </span>
              )
            )}
          </div>
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
        <Section title={t("shipSection")} color={SECTION_COLORS.techLevel} theme={theme}>
          <Field label={t("shipNameLabel")} theme={theme}>
            {id => (
              <input
                id={id}
                type="text"
                style={inputStyle}
                placeholder={t("shipNamePlaceholder")}
                value={shipName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setShipName(e.target.value)}
              />
            )}
          </Field>
          {/* Dos por línea: minmax(0, 1fr) para que el texto largo de las
              pistas no ensanche la columna en pantallas estrechas. */}
          <div style={{ ...fieldGridStyle, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 12 }}>
            {PASSENGER_CLASS_OPTIONS.map(cls => (
              <Field key={cls} label={t(classKey(cls))} theme={theme}>
                {id => (
                  <>
                    <input
                      id={id}
                      type="number"
                      min={0}
                      style={{ ...inputStyle, borderLeft: `3px solid ${classColor(cls)}` }}
                      value={berths[cls]}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setBerths({ ...berths, [cls]: Math.max(0, parseInt(e.target.value, 10) || 0) })
                      }
                    />
                    <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 4 }}>
                      {t(berthHintKey(cls))}
                    </div>
                  </>
                )}
              </Field>
            ))}
          </div>
          <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 10 }}>
            {t("shipBerthsNote")}
          </div>
        </Section>
        <Section title={t("passengerSkillsSection")} color={SECTION_COLORS.atmosphere} theme={theme}>
          <div style={fieldGridStyle}>
            <Field label={t("passengerBrokerEffect")} theme={theme}>
              {id => (
                <>
                  <input
                    id={id}
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
                </>
              )}
            </Field>
            <Field label={t("passengerStewardSkill")} theme={theme}>
              {id => (
                <>
                  <input
                    id={id}
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
                </>
              )}
            </Field>
          </div>
        </Section>

        {renderWorld(t("passengerOriginSection"), origin, setOrigin, originLinkUwp, setOriginLinkUwp, destinationLinkUwp, SECTION_COLORS.starport)}
        {renderWorld(t("passengerDestinationSection"), destination, setDestination, destinationLinkUwp, setDestinationLinkUwp, originLinkUwp, SECTION_COLORS.population)}

        </div>

        <div>
        <Section title={t("passengerRouteSection")} color={SECTION_COLORS.size} theme={theme}>
          <div style={fieldGridStyle}>
            <Field label={t("passengerParsecs")} theme={theme}>
              {id => (
                <select
                  id={id}
                  style={inputStyle}
                  value={parsecs}
                  onChange={e => setParsecs(parseInt(e.target.value, 10) as ParsecDistance)}
                >
                  {PARSEC_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
            </Field>
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

        <Section title={t("passengerDMsSection")} color={COLORS.primary} theme={theme}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {liveResult.breakdown.map((item, idx) => {
              const zero = item.value === 0;
              return (
                <div
                  key={idx}
                  className={zero ? "dm-zero-row" : undefined}
                  style={{
                    display: zero ? undefined : "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    padding: "4px 0",
                    borderBottom: `1px dashed ${theme.border}`,
                  }}
                >
                  <span style={{ color: zero ? theme.textDimmed : theme.text }}>{item.label}</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 500, color: dmColor(item.value, theme) }}>
                    {formatSigned(item.value)}
                  </span>
                </div>
              );
            })}
          </div>
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
          {/* Dos por fila: las cuatro clases forman un cuadro, no una fila de
              tres y una huérfana. */}
          <div style={{ ...fieldGridStyle, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            {PASSENGER_CLASS_OPTIONS.map(cls => {
              const liveDM = liveResult.classes[cls].dm;
              return (
                <Field
                  key={cls}
                  theme={theme}
                  label={
                    <>
                      {t(classRollKey(cls))}
                      <span style={{ color: classColor(cls), marginLeft: 6, fontWeight: 500, fontFamily: "monospace" }}>
                        (DM {formatSigned(liveDM)})
                      </span>
                    </>
                  }
                >
                  {id => (
                    <input
                      id={id}
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
                  )}
                </Field>
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
            {PASSENGER_CLASS_OPTIONS.every(cls => maxSeats[cls] === 0) ? (
              <div style={{ fontSize: 13, color: theme.textDimmed, fontStyle: "italic" }}>
                {/* Distingue "no hay pasaje" de "no tienes dónde meterlo". */}
                {PASSENGER_CLASS_OPTIONS.every(cls => (calculatedResult.classes[cls].passengers ?? 0) === 0)
                  ? t("passengerNoSeats")
                  : t("passengerNoBerths")}
              </div>
            ) : (
              PASSENGER_CLASS_OPTIONS.map(cls => {
                const c = calculatedResult.classes[cls];
                const available = c.passengers ?? 0;
                const max = maxSeats[cls];
                if (max === 0) return null;
                const color = classColor(cls);
                const current = booked[cls];
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
                        {available} {t("passengerAvailable")} · {formatCredits(c.pricePerSeat, lang)}
                        {max < available && ` · ${max} (${t("passengerBerthLimited")})`}
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
                {PASSENGER_CLASS_OPTIONS.flatMap(cls => {
                  const n = booked[cls];
                  if (n === 0) return [];
                  const c = calculatedResult.classes[cls];
                  // Con varios saltos cada tramo es una línea entera: el
                  // precio de la tabla es por salto, y una sola cifra
                  // esconde cómo se reparte el cobro por el camino.
                  const legs = jumps.length > 1
                    ? jumps.map((j, i) => ({
                        key: `${cls}-${i}`,
                        label: `${n} × ${t(classKey(cls))} · J-${j}`,
                        amount: n * PASSAGE_PRICES[j][cls],
                      }))
                    : [{ key: cls, label: `${n} × ${t(classKey(cls))}`, amount: n * c.pricePerSeat }];
                  return legs.map(leg => (
                    <div key={leg.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, padding: "4px 0", borderBottom: `1px dashed ${theme.border}` }}>
                      <span style={{ color: theme.textDimmed }}>{leg.label}</span>
                      <span style={{ fontFamily: "monospace", color: theme.text }}>
                        {formatCredits(leg.amount, lang)}
                      </span>
                    </div>
                  ));
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
          // Las dos acciones finales comparten fila; `flex: 1 1 240px` las
          // apila solas en cuanto la columna no da para las dos.
          <div style={{ margin: "24px 0 8px", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px" }}>
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
            {calculatedResult.hasRolls && (
              <div style={{ flex: "1 1 240px" }}>
                <Button
                  variant="primary"
                  size="lg"
                  theme={theme}
                  onClick={() => setContractOpen(true)}
                  fullWidth
                >
                  <IconFileText />{t("viewContract")}
                </Button>
                <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6, textAlign: "center" }}>
                  {t("viewContractHint")}
                </div>
              </div>
            )}
          </div>
        )}

        {contractOpen && contractData && (
          <ContractModal
            theme={theme}
            t={t}
            data={contractData}
            onClose={() => setContractOpen(false)}
          />
        )}

        <Footer theme={theme} t={t} />
      </main>
    </div>
  );
};
