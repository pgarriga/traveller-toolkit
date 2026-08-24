import type { FC, ChangeEvent } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { Language, TranslationFunction } from "../types/i18n";
import type { RecentPlanet, TravellerMapWorld, ZoneCode } from "../types/uwp";
import type {
  FreightInputs,
  FreightResult,
  FreightStarport,
  FreightWorldInputs,
  FreightZoneTier,
  LotResult,
  LotType,
  ParsecDistance,
  PopulationTier,
  TechLevelTier,
} from "../types/freight";
import type { MailInputs, MailResult } from "../types/mail";
import type { ContractData, ContractLine, ContractParty, ContractTotal } from "../types/contract";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ContractModal } from "../components/ContractModal";
import { Section } from "../components/ui/Section";
import { Button } from "../components/ui/Button";
import { JumpCountField, JumpsBreakdown, distributeJumps } from "../components/ui/JumpsEditor";
import { WorldPicker } from "../components/ui/WorldPicker";
import { Field } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { FreightBanner } from "../components/banners";
import { IconBox, IconFileText, IconRefresh } from "../components/icons";
import { COLORS, SECTION_COLORS } from "../constants/colors";
import {
  FREIGHT_RATES_PER_TON,
  PARSEC_OPTIONS,
  POPULATION_OPTIONS,
  STARPORT_OPTIONS,
  TECH_LEVEL_OPTIONS,
  ZONE_OPTIONS,
} from "../constants/freight";
import {
  MAIL_PAYMENT_PER_CONTAINER,
  MAIL_RANK_GROUPS,
  MAIL_RANK_NONE_ID,
  MAIL_SOC_DM_MAX,
  MAIL_SOC_DM_MIN,
  MAIL_TONS_PER_CONTAINER,
  findMailRank,
  rollD6 as rollMailD6,
} from "../constants/mail";
import { STORAGE_KEYS, isFiniteNumber, isString } from "../constants/storage";
import { usePersistentState } from "../hooks/usePersistentState";
import { calculateFreight } from "../utils/freight";
import { calculateMail } from "../utils/mail";
import { planetToFreightWorld } from "../utils/planetToWorldInputs";
import { formatCredits, formatTons } from "../utils/format";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby";

interface FreightViewProps {
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

const DEFAULT_WORLD: FreightWorldInputs = {
  population: "mid",
  starport: "C",
  techLevel: "mid",
  zone: "green",
};

// `rankId` sólo existe para el <select>: el DM lo aporta `rank`, pero un mismo
// número aparece en los tres grupos y hay que recordar cuál eligió el jugador.
type MailUserInputs = Omit<MailInputs, "freightTrafficDM" | "lowTL"> & {
  rankId: string;
};

const DEFAULT_MAIL: MailUserInputs = {
  armed: false,
  rank: 0,
  rankId: MAIL_RANK_NONE_ID,
  socDM: 0,
};

const isMailUserInputs = (raw: unknown): raw is MailUserInputs => {
  if (typeof raw !== "object" || raw === null) return false;
  const m = raw as Record<string, unknown>;
  return (
    typeof m.armed === "boolean" &&
    isFiniteNumber(m.rank) &&
    typeof m.rankId === "string" &&
    isFiniteNumber(m.socDM)
  );
};

const clampInt = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

const parseClampedInt = (raw: string, min: number, max: number, fallback: number): number => {
  if (raw.trim() === "") return fallback;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return clampInt(n, min, max);
};

const populationKey = (p: PopulationTier): string => {
  switch (p) {
    case "low": return "freightPopLow";
    case "mid": return "freightPopMid";
    case "high": return "freightPopHigh";
    case "veryHigh": return "freightPopVeryHigh";
  }
};

const tlKey = (tl: TechLevelTier): string => {
  switch (tl) {
    case "low": return "freightTLLow";
    case "mid": return "freightTLMid";
    case "high": return "freightTLHigh";
  }
};

const zoneKey = (z: FreightZoneTier): string => {
  switch (z) {
    case "green": return "zoneGreen";
    case "amber": return "zoneAmber";
    case "red": return "zoneRed";
  }
};

const lotKey = (type: LotType): string => {
  switch (type) {
    case "major": return "freightLotMajor";
    case "minor": return "freightLotMinor";
    case "incidental": return "freightLotIncidental";
  }
};

const lotDescKey = (type: LotType): string => {
  switch (type) {
    case "major": return "freightLotMajorDesc";
    case "minor": return "freightLotMinorDesc";
    case "incidental": return "freightLotIncidentalDesc";
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

const rollD6Array = (count: number): number[] =>
  Array.from({ length: Math.max(0, count) }, () => Math.floor(Math.random() * 6) + 1);

export const FreightView: FC<FreightViewProps> = ({
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
  const [origin, setOrigin] = useState<FreightWorldInputs>(DEFAULT_WORLD);
  const [destination, setDestination] = useState<FreightWorldInputs>(DEFAULT_WORLD);
  const [originLinkUwp, setOriginLinkUwp] = useState<string | null>(null);
  const [destinationLinkUwp, setDestinationLinkUwp] = useState<string | null>(null);

  const applyPlanet = (
    planet: RecentPlanet,
    setWorld: (w: FreightWorldInputs) => void,
    setLink: (uwp: string | null) => void,
  ): void => {
    const mapped = planetToFreightWorld(planet);
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
  const [cargoBay, setCargoBay] = usePersistentState<number>(
    STORAGE_KEYS.freightCargoBay, 0, isFiniteNumber,
  );
  const [skillEffect, setSkillEffect] = usePersistentState<number>(
    STORAGE_KEYS.freightSkillEffect, 0, isFiniteNumber,
  );
  const [mailExtras, setMailExtras] = usePersistentState<MailUserInputs>(
    STORAGE_KEYS.freightMail, DEFAULT_MAIL, isMailUserInputs,
  );

  const [rollMajorRaw, setRollMajorRaw] = useState<string>("");
  const [rollMinorRaw, setRollMinorRaw] = useState<string>("");
  const [rollIncidentalRaw, setRollIncidentalRaw] = useState<string>("");
  const [onTime, setOnTime] = useState<boolean>(true);
  const [mailRollRaw, setMailRollRaw] = useState<string>("");

  const inputs: FreightInputs = useMemo(() => ({
    origin,
    destination,
    parsecs,
    jumps,
    cargoBay,
    skillEffect,
    rollMajor: parseRollInput(rollMajorRaw),
    rollMinor: parseRollInput(rollMinorRaw),
    rollIncidental: parseRollInput(rollIncidentalRaw),
    diceMajor: [],
    diceMinor: [],
    diceIncidental: [],
    onTime,
  }), [origin, destination, parsecs, jumps, cargoBay, skillEffect, rollMajorRaw, rollMinorRaw, rollIncidentalRaw, onTime]);

  const liveResult = useMemo(() => calculateFreight(inputs, t), [inputs, t]);

  const lowTL = origin.techLevel === "low" || destination.techLevel === "low";
  const mailInputs: MailInputs = useMemo(
    () => ({ ...mailExtras, lowTL, freightTrafficDM: liveResult.baseDM }),
    [mailExtras, lowTL, liveResult.baseDM],
  );
  const liveMail = useMemo(() => calculateMail(mailInputs, t), [mailInputs, t]);

  const [contractOpen, setContractOpen] = useState<boolean>(false);
  const [calculatedResult, setCalculatedResult] = useState<FreightResult | null>(null);
  const [mailResult, setMailResult] = useState<MailResult | null>(null);
  const [selectedLots, setSelectedLots] = useState<Set<string>>(new Set());
  const [mailSelected, setMailSelected] = useState<boolean>(false);

  const lotId = (type: LotType, idx: number): string => `${type}-${idx}`;

  const toggleLot = (type: LotType, idx: number): void => {
    const id = lotId(type, idx);
    setSelectedLots(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCalculate = (): void => {
    const rolledInputs: FreightInputs = {
      ...inputs,
      diceMajor: rollD6Array(liveResult.lots.major.lots ?? 0),
      diceMinor: rollD6Array(liveResult.lots.minor.lots ?? 0),
      diceIncidental: rollD6Array(liveResult.lots.incidental.lots ?? 0),
    };
    setCalculatedResult(calculateFreight(rolledInputs, t));
    const manualMail2D = parseRollInput(mailRollRaw);
    const twoD = manualMail2D ?? rollMailD6() + rollMailD6();
    setMailResult(calculateMail(mailInputs, t, { twoD, containerD: rollMailD6() }));
    setSelectedLots(new Set());
    setMailSelected(false);
  };

  // Limpia la ruta para empezar de cero. NO toca los datos de nave/tripulación
  // (bodega, efecto de habilidad, rango, SOC, nave armada): son sticky.
  const handleReset = (): void => {
    setOrigin(DEFAULT_WORLD);
    setDestination(DEFAULT_WORLD);
    setOriginLinkUwp(null);
    setDestinationLinkUwp(null);
    setParsecs(1);
    setJumpCount(1);
    setRollMajorRaw("");
    setRollMinorRaw("");
    setRollIncidentalRaw("");
    setOnTime(true);
    setMailRollRaw("");
    setCalculatedResult(null);
    setMailResult(null);
    setSelectedLots(new Set());
    setMailSelected(false);
    setContractOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selection = useMemo(() => {
    if (!calculatedResult) return { tons: 0, count: 0, totalTons: 0 };
    let tons = 0;
    let count = 0;
    let totalTons = 0;
    (["major", "minor", "incidental"] as LotType[]).forEach(type => {
      const lot = calculatedResult.lots[type];
      if (!lot.perLotTons) return;
      lot.perLotTons.forEach((tonsOfLot, idx) => {
        totalTons += tonsOfLot;
        if (selectedLots.has(lotId(type, idx))) {
          tons += tonsOfLot;
          count++;
        }
      });
    });
    return { tons, count, totalTons };
  }, [calculatedResult, selectedLots]);

  // Cifras finales de la ruta. Viven fuera del render del Resumen porque el
  // contrato exportable factura exactamente lo mismo que muestra el Resumen.
  const summary = useMemo(() => {
    if (!calculatedResult) return null;
    const cargoRate = calculatedResult.ratePerTon;
    const cargoGross = Math.round(selection.tons * cargoRate);
    const cargoNet = Math.round(cargoGross * calculatedResult.latePaymentMultiplier);
    const mailAccepted = mailSelected && mailResult?.available === true;
    const mailTons = mailAccepted ? mailResult?.cargoTons ?? 0 : 0;
    const mailIncome = mailAccepted ? mailResult?.payment ?? 0 : 0;
    const mailContainers = mailAccepted ? mailResult?.containers ?? 0 : 0;
    const mailRate = MAIL_PAYMENT_PER_CONTAINER / MAIL_TONS_PER_CONTAINER; // Cr 5,000 / t fijo
    const totalTons = selection.tons + mailTons;
    const totalGross = cargoGross + mailIncome;
    const totalNet = cargoNet + mailIncome; // el correo no se ve afectado por la entrega tardía
    const excessTons = Math.max(0, totalTons - calculatedResult.cargoBay);
    return {
      cargoRate, cargoGross, mailAccepted, mailTons, mailIncome, mailContainers,
      mailRate, totalTons, totalGross, totalNet, excessTons,
      fitsInBay: excessTons === 0,
    };
  }, [calculatedResult, selection, mailSelected, mailResult]);

  // Factura de la ruta: cada lote seleccionado es una línea, y el correo entra
  // como una línea más con todos sus contenedores.
  const contractData: ContractData | null = useMemo(() => {
    if (!calculatedResult || !summary) return null;

    const party = (role: string, world: FreightWorldInputs, linkUwp: string | null): ContractParty => {
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
        detail: [
          world.starport,
          t(populationKey(world.population)),
          t(tlKey(world.techLevel)),
          t(zoneKey(world.zone)),
        ].join(" · "),
      };
    };

    const lines: ContractLine[] = [];
    (["major", "minor", "incidental"] as LotType[]).forEach(type => {
      calculatedResult.lots[type].perLotTons?.forEach((tonsOfLot, idx) => {
        if (!selectedLots.has(lotId(type, idx))) return;
        const label = `${t(lotKey(type))} #${idx + 1}`;
        lines.push({
          id: lotId(type, idx),
          label,
          detail: t(lotDescKey(type)),
          qty: `${formatTons(tonsOfLot, lang)} t`,
          rate: `${formatCredits(summary.cargoRate, lang)} /t`,
          amount: formatCredits(Math.round(tonsOfLot * summary.cargoRate), lang),
          accent: COLORS.primary,
        });
      });
    });

    if (summary.mailAccepted) {
      lines.push({
        id: "mail",
        label: t("summaryMail"),
        detail: `${summary.mailContainers} × ${formatTons(MAIL_TONS_PER_CONTAINER, lang)} t`,
        qty: `${formatTons(summary.mailTons, lang)} t`,
        rate: `${formatCredits(summary.mailRate, lang)} /t`,
        amount: formatCredits(summary.mailIncome, lang),
        accent: COLORS.success,
      });
    }

    const totals: ContractTotal[] = [
      {
        // Sin la capacidad de la bodega: es un dato de la nave, no del trato.
        label: t("contractTotalTons"),
        value: `${formatTons(summary.totalTons, lang)} t`,
        warn: !summary.fitsInBay,
      },
      {
        label: t("summaryTotalGross"),
        value: formatCredits(summary.totalGross, lang),
        strong: calculatedResult.onTime,
      },
    ];
    if (!calculatedResult.onTime) {
      totals.push({
        label: t("summaryTotalNet"),
        value: formatCredits(summary.totalNet, lang),
        strong: true,
        warn: true,
      });
    }

    const notes: string[] = [];
    if (!calculatedResult.onTime) notes.push(t("contractNoteLate"));
    if (!summary.fitsInBay) notes.push(t("contractNoteExcess"));

    return {
      kind: "freight",
      title: t("contractFreightTitle"),
      ship: shipName.trim() || null,
      parties: [
        party(t("contractOrigin"), origin, originLinkUwp),
        party(t("contractDestination"), destination, destinationLinkUwp),
      ],
      meta: [
        { label: t("freightParsecs"), value: String(parsecs) },
        { label: t("routeJumpsLabel"), value: String(jumps.length) },
        { label: t("contractJumpPlan"), value: jumps.map(j => `J-${j}`).join(" + ") },
      ],
      lines,
      totals,
      notes,
    };
  }, [
    calculatedResult, summary, selectedLots, lang, t, parsecs, jumps, shipName,
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
    world: FreightWorldInputs,
    setWorldRaw: (w: FreightWorldInputs) => void,
    linkUwp: string | null,
    setLinkUwp: (uwp: string | null) => void,
    color: string,
  ) => {
    const handleManual = (w: FreightWorldInputs): void => {
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
        />
        <div style={fieldGridStyle}>
          <Field label={t("freightPopulation")} theme={theme}>
            {id => (
              <select
                id={id}
                style={inputStyle}
                value={world.population}
                onChange={e => handleManual({ ...world, population: e.target.value as PopulationTier })}
              >
                {POPULATION_OPTIONS.map(p => (
                  <option key={p} value={p}>{t(populationKey(p))}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("freightStarport")} theme={theme}>
            {id => (
              <select
                id={id}
                style={inputStyle}
                value={world.starport}
                onChange={e => handleManual({ ...world, starport: e.target.value as FreightStarport })}
              >
                {STARPORT_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("freightTL")} theme={theme}>
            {id => (
              <select
                id={id}
                style={inputStyle}
                value={world.techLevel}
                onChange={e => handleManual({ ...world, techLevel: e.target.value as TechLevelTier })}
              >
                {TECH_LEVEL_OPTIONS.map(tl => (
                  <option key={tl} value={tl}>{t(tlKey(tl))}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("freightZone")} theme={theme}>
            {id => (
              <select
                id={id}
                style={inputStyle}
                value={world.zone}
                onChange={e => handleManual({ ...world, zone: e.target.value as FreightZoneTier })}
              >
                {ZONE_OPTIONS.map(z => (
                  <option key={z} value={z}>{t(zoneKey(z))}</option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </Section>
    );
  };

  const renderLotCard = (type: LotType, lot: LotResult) => {
    const dash = t("freightDash");
    const stats: Array<{ label: string; value: string; color?: string; mono?: boolean }> = [
      {
        label: t("freightColFinalDM"),
        value: formatSigned(lot.dm),
        color: lot.dm < 0 ? COLORS.warning : COLORS.success,
        mono: true,
      },
      {
        label: t("freightColLots"),
        value: lot.lots !== null ? String(lot.lots) : dash,
      },
      {
        label: t("freightColTons"),
        value: lot.tons !== null ? formatTons(lot.tons, lang) : dash,
      },
    ];
    return (
      <div key={type} style={{ padding: "12px 0", borderTop: `1px solid ${theme.border}` }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10 }}>{t(lotKey(type))}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10 }}>
          {stats.map(stat => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {stat.label}
              </span>
              <span style={{
                fontWeight: 500,
                fontSize: 13,
                fontFamily: stat.mono ? "monospace" : "inherit",
                color: stat.color || theme.text,
              }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
        {lot.perLotTons && lot.perLotTons.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${theme.border}` }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("freightPerLot")}
              </span>
              <span style={{ fontSize: 11, color: theme.textDimmed, fontFamily: "monospace" }}>
                ({t(lotDescKey(type))})
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {lot.perLotTons.map((tonsOfLot, idx) => {
                const isSelected = selectedLots.has(lotId(type, idx));
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleLot(type, idx)}
                    aria-pressed={isSelected}
                    style={{
                      fontSize: 12,
                      fontFamily: "monospace",
                      background: isSelected ? COLORS.primary : COLORS.primary + "22",
                      color: isSelected ? "#fff" : theme.text,
                      border: `1px solid ${isSelected ? COLORS.primary : "transparent"}`,
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    #{idx + 1}: {formatTons(tonsOfLot, lang)} t
                  </button>
                );
              })}
            </div>
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
        <FreightBanner theme={theme} />
        <PageHeader title={t("freightTitle")} icon={<IconBox />} />

        <div className="two-col-grid">
        <div>
        <Section title={t("shipSection")} color={SECTION_COLORS.techLevel} theme={theme}>
          <div style={fieldGridStyle}>
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
            <Field label={t("freightCargoBay")} theme={theme}>
              {id => (
                <input
                  id={id}
                  type="number"
                  min={0}
                  style={inputStyle}
                  value={cargoBay}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCargoBay(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              )}
            </Field>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 12 }}>
            <input
              type="checkbox"
              checked={mailExtras.armed}
              onChange={e => setMailExtras({ ...mailExtras, armed: e.target.checked })}
              style={{ accentColor: COLORS.primary, width: 16, height: 16 }}
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t("mailArmed")}</span>
          </label>
        </Section>
        <Section title={t("freightSkillsSection")} color={SECTION_COLORS.atmosphere} theme={theme}>
          <div style={fieldGridStyle}>
            <Field label={t("freightSkillEffect")} theme={theme}>
              {id => (
                <>
                  <input
                    id={id}
                    type="number"
                    style={inputStyle}
                    value={skillEffect}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const n = parseInt(e.target.value, 10);
                      setSkillEffect(Number.isNaN(n) ? 0 : n);
                    }}
                  />
                  <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 4 }}>
                    {t("freightSkillNote")}
                  </div>
                </>
              )}
            </Field>
          </div>
          {/* Rango y SOC en su propia fila, a dos columnas. */}
          <div style={{ ...fieldGridStyle, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 12 }}>
            <Field label={t("mailRank")} theme={theme}>
              {id => (
                <>
                  <select
                    id={id}
                    style={inputStyle}
                    value={mailExtras.rankId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const picked = findMailRank(e.target.value);
                      setMailExtras({
                        ...mailExtras,
                        rankId: picked ? picked.id : MAIL_RANK_NONE_ID,
                        rank: picked ? picked.rank : 0,
                      });
                    }}
                  >
                    <option value={MAIL_RANK_NONE_ID}>{t("mailRankNone")}</option>
                    {MAIL_RANK_GROUPS.map(group => (
                      <optgroup key={group.service} label={t(group.labelKey)}>
                        {group.options.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.titleKey ? `${o.rank} · ${t(o.titleKey)}` : `${o.rank} · ${t("freightDash")}`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 4 }}>{t("mailRankHint")}</div>
                </>
              )}
            </Field>
            <Field label={t("mailSoc")} theme={theme}>
              {id => (
                <>
                  <input
                    id={id}
                    type="number"
                    min={MAIL_SOC_DM_MIN}
                    max={MAIL_SOC_DM_MAX}
                    style={inputStyle}
                    value={mailExtras.socDM}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setMailExtras({ ...mailExtras, socDM: parseClampedInt(e.target.value, MAIL_SOC_DM_MIN, MAIL_SOC_DM_MAX, 0) })
                    }
                  />
                  <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 4 }}>{t("mailSocHint")}</div>
                </>
              )}
            </Field>
          </div>
        </Section>

        {renderWorld(t("freightOriginSection"), origin, setOrigin, originLinkUwp, setOriginLinkUwp, SECTION_COLORS.starport)}
        {renderWorld(t("freightDestinationSection"), destination, setDestination, destinationLinkUwp, setDestinationLinkUwp, SECTION_COLORS.population)}

        <Section title={t("freightRouteSection")} color={SECTION_COLORS.size} theme={theme}>
          <div style={fieldGridStyle}>
            <Field label={t("freightParsecs")} theme={theme}>
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
          <JumpsBreakdown
            parsecs={parsecs}
            jumpCount={jumpCount}
            theme={theme}
            t={t}
            priceFor={j => FREIGHT_RATES_PER_TON[j]}
            formatPrice={n => formatCredits(n, lang)}
            priceSuffix=" /t"
          />
        </Section>

        </div>

        <div>
        {/* Live DM preview */}
        <Section title={t("freightDMsSection")} color={COLORS.primary} theme={theme}>
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
            <span>{t("freightBaseDM")}</span>
            <span style={{ fontFamily: "monospace", color: liveResult.baseDM < 0 ? COLORS.warning : COLORS.success }}>
              {formatSigned(liveResult.baseDM)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6 }}>{t("freightTrafficNote")}</div>
        </Section>

        <Section title={t("freightLotsCountSection")} color={COLORS.secondary} theme={theme}>
          <div style={{ fontSize: 13, color: theme.textDimmed, marginBottom: 14, lineHeight: 1.5 }}>
            {t("freightLotsCountIntro")}
          </div>
          <div style={fieldGridStyle}>
            {[
              { type: "major" as const, label: t("freightRollMajor"), expected: liveResult.lots.major.lots, rollValue: rollMajorRaw, setRoll: setRollMajorRaw },
              { type: "minor" as const, label: t("freightRollMinor"), expected: liveResult.lots.minor.lots, rollValue: rollMinorRaw, setRoll: setRollMinorRaw },
              { type: "incidental" as const, label: t("freightRollIncidental"), expected: liveResult.lots.incidental.lots, rollValue: rollIncidentalRaw, setRoll: setRollIncidentalRaw },
            ].map(field => (
              <Field
                key={field.type}
                theme={theme}
                label={
                  <>
                    {field.label}
                    {field.expected !== null && (
                      <span style={{ color: COLORS.primary, marginLeft: 6, fontWeight: 500 }}>
                        ({field.expected}D6)
                      </span>
                    )}
                  </>
                }
              >
                {id => (
                  <input
                    id={id}
                    type="number"
                    min={2}
                    max={12}
                    placeholder={t("freightRollPlaceholder")}
                    style={inputStyle}
                    value={field.rollValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.setRoll(e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
          <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 8 }}>
            {t("freightRollHelp")}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={onTime}
              onChange={e => setOnTime(e.target.checked)}
              style={{ accentColor: COLORS.primary, width: 16, height: 16 }}
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t("freightOnTime")}</span>
          </label>
          {!onTime && (
            <div style={{ fontSize: 11, color: COLORS.warning, marginTop: 6, marginLeft: 24 }}>
              {t("freightLateNote")}
            </div>
          )}
        </Section>

        <Section title={t("mailSection")} color={COLORS.danger} theme={theme}>
          <div style={{ fontSize: 13, color: theme.textDimmed, marginBottom: 14, lineHeight: 1.5 }}>
            {t("mailSectionIntro")}
          </div>
          {lowTL && (
            <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 8, fontStyle: "italic" }}>
              {t("mailLowTLAutoNote")}
            </div>
          )}
          <Field label={t("mailRollLabel")} theme={theme} style={{ marginTop: 16 }}>
            {id => (
              <>
                <input
                  id={id}
                  type="number"
                  min={2}
                  max={12}
                  placeholder={t("freightRollPlaceholder")}
                  style={inputStyle}
                  value={mailRollRaw}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMailRollRaw(e.target.value)}
                />
                <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 4 }}>{t("mailRollHelp")}</div>
              </>
            )}
          </Field>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px dashed ${theme.border}` }}>
            {liveMail.breakdown.length === 0 ? (
              <div style={{ fontSize: 12, color: theme.textDimmed }}>{t("freightNoFactors")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {liveMail.breakdown.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                    <span style={{ color: theme.textDimmed }}>{item.label}</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 500, color: item.value < 0 ? COLORS.warning : COLORS.success }}>
                      {formatSigned(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.border}`, fontWeight: 500, fontSize: 13 }}>
              <span>{t("mailTotalDM")}</span>
              <span style={{ fontFamily: "monospace", color: liveMail.totalDM < 0 ? COLORS.warning : COLORS.success }}>
                {formatSigned(liveMail.totalDM)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6 }}>{t("mailRollNote")}</div>
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
            <IconBox />{t("freightCalculate")}
          </Button>
        </div>

        {calculatedResult && (
          <Section title={t("freightRateSection")} color={SECTION_COLORS.atmosphere} theme={theme}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>{t("summaryCargo")}</span>
                  <span style={{ fontSize: 11, color: theme.textDimmed }}>{t("freightRateNote")}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 500, fontFamily: "monospace", color: COLORS.success }}>
                  {formatCredits(calculatedResult.ratePerTon, lang)} /t
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", paddingTop: 10, borderTop: `1px dashed ${theme.border}` }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>{t("summaryMail")}</span>
                  <span style={{ fontSize: 11, color: theme.textDimmed }}>{t("mailRateNote")}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 500, fontFamily: "monospace", color: COLORS.success }}>
                  {formatCredits(MAIL_PAYMENT_PER_CONTAINER / MAIL_TONS_PER_CONTAINER, lang)} /t
                </span>
              </div>
            </div>
          </Section>
        )}

        {calculatedResult && (
          <Section title={t("freightLotsSection")} color={SECTION_COLORS.population} theme={theme}>
            <div>
              {renderLotCard("major", calculatedResult.lots.major)}
              {renderLotCard("minor", calculatedResult.lots.minor)}
              {renderLotCard("incidental", calculatedResult.lots.incidental)}
            </div>
            {!calculatedResult.hasRolls && (
              <div style={{ fontSize: 12, color: theme.textDimmed, marginTop: 10, fontStyle: "italic" }}>
                {t("freightRollsMissing")}
              </div>
            )}
          </Section>
        )}

        {mailResult && (
          <Section
            title={t("mailResultSection")}
            color={mailResult.available ? COLORS.success : COLORS.warning}
            theme={theme}
          >
            <div style={{ fontSize: 12, color: theme.textDimmed, marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
              <span>{t("mailRoll2D")}:</span>
              <span style={{ fontFamily: "monospace", fontWeight: 500, color: theme.text }}>{mailResult.rolled2D}</span>
              <span>+</span>
              <span>{t("mailTotalDM")}:</span>
              <span style={{ fontFamily: "monospace", fontWeight: 500, color: theme.text }}>{formatSigned(mailResult.totalDM)}</span>
              <span>=</span>
              <span style={{ fontFamily: "monospace", fontWeight: 500, color: theme.text, fontSize: 15 }}>{mailResult.finalRoll}</span>
              <span style={{ color: theme.textDimmed }}>({t("mailTarget")} 12+)</span>
            </div>
            {mailResult.available ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 500, color: COLORS.success, marginBottom: 12 }}>
                  {t("mailAvailable")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                  <MailCell theme={theme} label={t("mailContainers")} value={String(mailResult.containers)} mono />
                  <MailCell theme={theme} label={t("mailCargoTons")} value={`${formatTons(mailResult.cargoTons ?? 0, lang)} t`} mono />
                  <MailCell
                    theme={theme}
                    label={t("mailPayment")}
                    value={formatCredits(mailResult.payment ?? 0, lang)}
                    color={COLORS.success}
                    strong
                  />
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${theme.border}` }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {t("mailContainers")}
                    </span>
                    <span style={{ fontSize: 11, color: theme.textDimmed, fontFamily: "monospace" }}>
                      ({formatTons(MAIL_TONS_PER_CONTAINER, lang)} t · {formatCredits(MAIL_PAYMENT_PER_CONTAINER, lang)})
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Array.from({ length: mailResult.containers ?? 0 }, (_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMailSelected(s => !s)}
                        aria-pressed={mailSelected}
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          background: mailSelected ? COLORS.success : COLORS.success + "22",
                          color: mailSelected ? "#fff" : theme.text,
                          border: `1px solid ${mailSelected ? COLORS.success : "transparent"}`,
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        #{idx + 1}: {formatTons(MAIL_TONS_PER_CONTAINER, lang)} t
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: "8px 12px", background: COLORS.primary + "22", borderLeft: `3px solid ${COLORS.primary}`, color: theme.text, fontSize: 12, borderRadius: 4 }}>
                  {t("mailAllOrNothing")}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 16, fontWeight: 500, color: COLORS.warning }}>
                {t("mailUnavailable")}
              </div>
            )}
          </Section>
        )}

        {calculatedResult && (
        <Section title={t("freightSummarySection")} color={SECTION_COLORS.starport} theme={theme}>
          {!calculatedResult.hasRolls ? (
            <div style={{ fontSize: 13, color: theme.textDimmed }}>{t("freightRollsMissing")}</div>
          ) : summary && (() => {
            const {
              cargoRate, cargoGross, mailAccepted, mailTons, mailIncome,
              mailContainers, mailRate, totalTons, totalGross, totalNet,
              excessTons, fitsInBay,
            } = summary;
            const selectionLine =
              selection.count > 0 || mailAccepted
                ? [
                    selection.count > 0 ? `${selection.count} ${t("freightSelectedCount")}` : null,
                    mailAccepted ? `${mailContainers} ${t("mailSelectedContainers")}` : null,
                  ].filter(Boolean).join(" · ")
                : t("freightSelectionHint");
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 12, color: theme.textDimmed, marginBottom: 4 }}>
                  {selectionLine}
                </div>

                <SummaryRow
                  theme={theme}
                  label={t("summaryCargoTons")}
                  value={`${formatTons(selection.tons, lang)} / ${formatTons(selection.totalTons, lang)} t`}
                />
                {mailAccepted && (
                  <SummaryRow
                    theme={theme}
                    label={t("summaryMailTons")}
                    value={`${formatTons(mailTons, lang)} t`}
                  />
                )}
                <SummaryRow
                  theme={theme}
                  label={t("summaryTotalTons")}
                  value={`${formatTons(totalTons, lang)} / ${formatTons(calculatedResult.cargoBay, lang)} t`}
                  strong
                />
                {excessTons > 0 && (
                  <SummaryRow theme={theme} label={t("freightExcessTons")} value={`${formatTons(excessTons, lang)} t`} warn />
                )}

                <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${theme.border}` }}>
                  <BreakdownRow
                    theme={theme}
                    label={t("summaryCargo")}
                    rate={`${formatCredits(cargoRate, lang)} /t`}
                    amount={formatCredits(cargoGross, lang)}
                    detail={`${formatTons(selection.tons, lang)} t`}
                  />
                  {mailAccepted && (
                    <BreakdownRow
                      theme={theme}
                      label={t("summaryMail")}
                      rate={`${formatCredits(mailRate, lang)} /t`}
                      amount={formatCredits(mailIncome, lang)}
                      detail={`${formatTons(mailTons, lang)} t`}
                    />
                  )}
                </div>

                <SummaryRow
                  theme={theme}
                  label={t("summaryTotalGross")}
                  value={formatCredits(totalGross, lang)}
                  strong
                />
                {!calculatedResult.onTime && (
                  <SummaryRow
                    theme={theme}
                    label={t("summaryTotalNet")}
                    value={formatCredits(totalNet, lang)}
                    warn
                    strong
                  />
                )}

                {!fitsInBay && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: COLORS.warning + "22", borderLeft: `3px solid ${COLORS.warning}`, color: COLORS.warning, fontSize: 13, borderRadius: 4 }}>
                    {t("freightExcessWarning")}
                  </div>
                )}
              </div>
            );
          })()}
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

interface SummaryRowProps {
  theme: Theme;
  label: string;
  value: string;
  warn?: boolean;
  strong?: boolean;
}

const SummaryRow: FC<SummaryRowProps> = ({ theme, label, value, warn, strong }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, padding: "4px 0" }}>
    <span style={{ color: theme.textDimmed }}>{label}</span>
    <span style={{
      fontFamily: strong ? "inherit" : "monospace",
      fontWeight: strong ? 700 : 600,
      color: warn ? COLORS.warning : theme.text,
      fontSize: strong ? 15 : 13,
    }}>
      {value}
    </span>
  </div>
);

interface MailCellProps {
  theme: Theme;
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
  strong?: boolean;
}

const MailCell: FC<MailCellProps> = ({ theme, label, value, color, mono, strong }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 10, color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
    <span style={{
      fontFamily: mono ? "monospace" : "inherit",
      fontWeight: strong ? 800 : 700,
      color: color || theme.text,
      fontSize: strong ? 17 : 14,
    }}>
      {value}
    </span>
  </div>
);

interface BreakdownRowProps {
  theme: Theme;
  label: string;
  rate: string;
  amount: string;
  detail: string;
}

const BreakdownRow: FC<BreakdownRowProps> = ({ theme, label, rate, amount, detail }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, padding: "4px 0", gap: 12, flexWrap: "wrap" }}>
    <span style={{ color: theme.textDimmed, minWidth: 60 }}>{label}</span>
    <span style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
      <span style={{ fontFamily: "monospace", color: theme.textDimmed, fontSize: 12 }}>
        {detail} × {rate}
      </span>
      <span style={{ fontFamily: "monospace", color: theme.text, fontWeight: 500 }}>
        = {amount}
      </span>
    </span>
  </div>
);
