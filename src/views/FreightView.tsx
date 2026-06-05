import type { FC, ChangeEvent } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { Language, TranslationFunction } from "../types/i18n";
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
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Section } from "../components/ui/Section";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { IconBox } from "../components/icons";
import { COLORS, SECTION_COLORS } from "../constants/colors";
import {
  PARSEC_OPTIONS,
  POPULATION_OPTIONS,
  STARPORT_OPTIONS,
  TECH_LEVEL_OPTIONS,
  ZONE_OPTIONS,
} from "../constants/freight";
import { calculateFreight } from "../utils/freight";

type ViewType = "home" | "decoder" | "saved" | "settings" | "planet" | "freight";

interface FreightViewProps {
  theme: Theme;
  lang: Language;
  view: ViewType;
  resetDecoder: () => void;
  goHome: () => void;
  navigateTo: (view: ViewType, uwp?: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
}

const DEFAULT_WORLD: FreightWorldInputs = {
  population: "mid",
  starport: "C",
  techLevel: "mid",
  zone: "green",
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

const formatCredits = (n: number, lang: Language): string =>
  `Cr ${n.toLocaleString(lang === "es" ? "es-ES" : "en-US")}`;

const formatTons = (n: number, lang: Language): string =>
  n.toLocaleString(lang === "es" ? "es-ES" : "en-US", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });

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
  resetDecoder,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
}) => {
  const [origin, setOrigin] = useState<FreightWorldInputs>(DEFAULT_WORLD);
  const [destination, setDestination] = useState<FreightWorldInputs>(DEFAULT_WORLD);
  const [parsecs, setParsecs] = useState<ParsecDistance>(1);
  const [cargoBay, setCargoBay] = useState<number>(0);
  const [skillEffect, setSkillEffect] = useState<number>(0);
  const [rollMajorRaw, setRollMajorRaw] = useState<string>("");
  const [rollMinorRaw, setRollMinorRaw] = useState<string>("");
  const [rollIncidentalRaw, setRollIncidentalRaw] = useState<string>("");
  const [onTime, setOnTime] = useState<boolean>(true);

  const inputs: FreightInputs = useMemo(() => ({
    origin,
    destination,
    parsecs,
    cargoBay,
    skillEffect,
    rollMajor: parseRollInput(rollMajorRaw),
    rollMinor: parseRollInput(rollMinorRaw),
    rollIncidental: parseRollInput(rollIncidentalRaw),
    diceMajor: [],
    diceMinor: [],
    diceIncidental: [],
    onTime,
  }), [origin, destination, parsecs, cargoBay, skillEffect, rollMajorRaw, rollMinorRaw, rollIncidentalRaw, onTime]);

  const liveResult = useMemo(() => calculateFreight(inputs, t), [inputs, t]);
  const [calculatedResult, setCalculatedResult] = useState<FreightResult | null>(null);
  const [selectedLots, setSelectedLots] = useState<Set<string>>(new Set());

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
    setSelectedLots(new Set());
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
    fontWeight: 600,
  } as const;

  const fieldGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  } as const;

  const renderWorld = (
    label: string,
    world: FreightWorldInputs,
    setWorld: (w: FreightWorldInputs) => void,
    color: string,
  ) => (
    <Section title={label} color={color} theme={theme}>
      <div style={fieldGridStyle}>
        <div>
          <label style={labelStyle}>{t("freightPopulation")}</label>
          <select
            style={inputStyle}
            value={world.population}
            onChange={e => setWorld({ ...world, population: e.target.value as PopulationTier })}
          >
            {POPULATION_OPTIONS.map(p => (
              <option key={p} value={p}>{t(populationKey(p))}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>{t("freightStarport")}</label>
          <select
            style={inputStyle}
            value={world.starport}
            onChange={e => setWorld({ ...world, starport: e.target.value as FreightStarport })}
          >
            {STARPORT_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>{t("freightTL")}</label>
          <select
            style={inputStyle}
            value={world.techLevel}
            onChange={e => setWorld({ ...world, techLevel: e.target.value as TechLevelTier })}
          >
            {TECH_LEVEL_OPTIONS.map(tl => (
              <option key={tl} value={tl}>{t(tlKey(tl))}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>{t("freightZone")}</label>
          <select
            style={inputStyle}
            value={world.zone}
            onChange={e => setWorld({ ...world, zone: e.target.value as FreightZoneTier })}
          >
            {ZONE_OPTIONS.map(z => (
              <option key={z} value={z}>{t(zoneKey(z))}</option>
            ))}
          </select>
        </div>
      </div>
    </Section>
  );

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
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{t(lotKey(type))}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10 }}>
          {stats.map(stat => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {stat.label}
              </span>
              <span style={{
                fontWeight: 700,
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
                      fontWeight: 600,
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
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
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
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px" }}>
        <PageHeader title={t("freightTitle")} icon={<IconBox />} />

        {renderWorld(t("freightOriginSection"), origin, setOrigin, SECTION_COLORS.starport)}
        {renderWorld(t("freightDestinationSection"), destination, setDestination, SECTION_COLORS.population)}

        <Section title={t("freightRouteSection")} color={SECTION_COLORS.size} theme={theme}>
          <div style={fieldGridStyle}>
            <div>
              <label style={labelStyle}>{t("freightParsecs")}</label>
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
            <div>
              <label style={labelStyle}>{t("freightCargoBay")}</label>
              <input
                type="number"
                min={0}
                style={inputStyle}
                value={cargoBay}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCargoBay(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>
          </div>
        </Section>

        <Section title={t("freightSkillsSection")} color={SECTION_COLORS.atmosphere} theme={theme}>
          <div>
            <label style={labelStyle}>{t("freightSkillEffect")}</label>
            <input
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
          </div>
        </Section>

        {/* Live DM preview */}
        <Section title={t("freightDMsSection")} color={COLORS.primary} theme={theme}>
          {liveResult.breakdown.length === 0 ? (
            <div style={{ fontSize: 13, color: theme.textDimmed }}>{t("freightNoFactors")}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {liveResult.breakdown.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: `1px dashed ${theme.border}` }}>
                  <span style={{ color: theme.text }}>{item.label}</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: item.value < 0 ? COLORS.warning : COLORS.success }}>
                    {formatSigned(item.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `2px solid ${theme.border}`, fontWeight: 700 }}>
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
              <div key={field.type}>
                <label style={labelStyle}>
                  {field.label}
                  {field.expected !== null && (
                    <span style={{ color: COLORS.primary, marginLeft: 6, fontWeight: 700 }}>
                      ({field.expected}D6)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  placeholder={t("freightRollPlaceholder")}
                  style={inputStyle}
                  value={field.rollValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => field.setRoll(e.target.value)}
                />
              </div>
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
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t("freightOnTime")}</span>
          </label>
          {!onTime && (
            <div style={{ fontSize: 11, color: COLORS.warning, marginTop: 6, marginLeft: 24 }}>
              {t("freightLateNote")}
            </div>
          )}
        </Section>

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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 13, color: theme.textDimmed }}>{t("freightRateNote")}</span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: COLORS.success }}>
                {formatCredits(calculatedResult.ratePerTon, lang)}
              </span>
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

        {calculatedResult && (
        <Section title={t("freightSummarySection")} color={SECTION_COLORS.starport} theme={theme}>
          {!calculatedResult.hasRolls ? (
            <div style={{ fontSize: 13, color: theme.textDimmed }}>{t("freightRollsMissing")}</div>
          ) : (() => {
            const grossIncome = Math.round(selection.tons * calculatedResult.ratePerTon);
            const netIncome = Math.round(grossIncome * calculatedResult.latePaymentMultiplier);
            const excessTons = Math.max(0, selection.tons - calculatedResult.cargoBay);
            const fitsInBay = excessTons === 0;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 12, color: theme.textDimmed, marginBottom: 4 }}>
                  {selection.count > 0
                    ? `${selection.count} ${t("freightSelectedCount")}`
                    : t("freightSelectionHint")}
                </div>
                <SummaryRow
                  theme={theme}
                  label={t("freightSelectedTons")}
                  value={`${formatTons(selection.tons, lang)} / ${formatTons(selection.totalTons, lang)} t`}
                />
                <SummaryRow
                  theme={theme}
                  label={t("freightFitTons")}
                  value={`${formatTons(Math.min(selection.tons, calculatedResult.cargoBay), lang)} / ${formatTons(calculatedResult.cargoBay, lang)} t`}
                />
                {excessTons > 0 && (
                  <SummaryRow theme={theme} label={t("freightExcessTons")} value={`${formatTons(excessTons, lang)} t`} warn />
                )}
                <SummaryRow theme={theme} label={t("freightGrossIncome")} value={formatCredits(grossIncome, lang)} strong />
                {!calculatedResult.onTime && (
                  <SummaryRow theme={theme} label={t("freightNetIncome")} value={formatCredits(netIncome, lang)} warn strong />
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
