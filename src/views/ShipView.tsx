import type { CSSProperties, ChangeEvent, FC } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { Language, TranslationFunction } from "../types/i18n";
import type { PassengerClass } from "../types/passenger";
import type { ShipComponent, ShipPower, ShipSectionKey, ShipSheet } from "../types/ship";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Section } from "../components/ui/Section";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Row } from "../components/ui/Row";
import { PageHeader } from "../components/ui/PageHeader";
import { ShipBanner } from "../components/banners";
import { ShipRowHeader, ShipSectionEditor } from "../components/ShipSectionEditor";
import { IconShip } from "../components/icons";
import { COLORS, SECTION_COLORS } from "../constants/colors";
import { SHIP_SECTION_GROUPS, sectionTitleKey } from "../constants/ship";
import { PASSENGER_CLASS_OPTIONS } from "../constants/passenger";
import type { ShipTemplate } from "../constants/shipTemplates";
import { SHIP_TEMPLATES, findTemplate } from "../constants/shipTemplates";
import { useShip } from "../hooks/useShip";
import { componentFromPart, isShipEmpty, shipFromTemplate, shipTotals } from "../utils/ship";
import { formatCredits, formatMCr, formatTons } from "../utils/format";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby" | "ship" | "ship";

interface ShipViewProps {
  theme: Theme;
  lang: Language;
  view: ViewType;
  goHome: () => void;
  navigateTo: (view: ViewType, uwp?: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
}

/** El manual separa sus diseños en astronaves y "naves pequeñas". */
const isSmallCraft = (template: ShipTemplate): boolean => template.designationKey === "shipTplSmallCraft";

const POWER_FIELDS: readonly { key: keyof ShipPower; labelKey: string }[] = [
  { key: "basic", labelKey: "shipPowerBasic" },
  { key: "mDrive", labelKey: "shipPowerMDrive" },
  { key: "jDrive", labelKey: "shipPowerJDrive" },
  { key: "sensors", labelKey: "shipPowerSensors" },
  { key: "weapons", labelKey: "shipPowerWeapons" },
];

const BERTH_LABEL_KEY: Record<PassengerClass, string> = {
  high: "passengerClassHigh",
  middle: "passengerClassMiddle",
  basic: "passengerClassBasic",
  low: "passengerClassLow",
};

/** "" en un campo numérico es el "—" del manual, no un cero. */
const parseNullableNumber = (raw: string): number | null => {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const ShipView: FC<ShipViewProps> = ({
  theme,
  lang,
  view,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
}) => {
  const { name, setName, ship, setShip, setCargoTons, setBerths } = useShip();
  const [pendingTemplate, setPendingTemplate] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  const totals = useMemo(() => shipTotals(ship), [ship]);

  const inputStyle: CSSProperties = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    color: theme.text,
    fontSize: 14,
    width: "100%",
    fontFamily: "inherit",
  };

  const fieldGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  };

  const patch = (changes: Partial<ShipSheet>): void => setShip(prev => ({ ...prev, ...changes }));

  const setPower = (key: keyof ShipPower, value: number | null): void =>
    setShip(prev => ({ ...prev, power: { ...prev.power, [key]: value } }));

  const addComponent = (section: ShipSectionKey, partId: string | null): void =>
    setShip(prev => ({
      ...prev,
      sections: { ...prev.sections, [section]: [...prev.sections[section], componentFromPart(partId, t)] },
    }));

  const updateComponent = (section: ShipSectionKey, id: string, changes: Partial<ShipComponent>): void =>
    setShip(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: prev.sections[section].map(c => (c.id === id ? { ...c, ...changes } : c)),
      },
    }));

  const removeComponent = (section: ShipSectionKey, id: string): void =>
    setShip(prev => ({
      ...prev,
      sections: { ...prev.sections, [section]: prev.sections[section].filter(c => c.id !== id) },
    }));

  const applyTemplate = (): void => {
    const template = findTemplate(pendingTemplate);
    if (!template) return;
    setShip(prev => shipFromTemplate(template, t, prev));
    setConfirmOpen(false);
  };

  // Cargar un diseño se lleva por delante toda la ficha, así que se confirma —
  // salvo cuando no hay nada que perder porque la ficha aún está en blanco.
  const requestTemplate = (): void => {
    if (pendingTemplate === "") return;
    if (isShipEmpty(ship)) {
      applyTemplate();
      return;
    }
    setConfirmOpen(true);
  };

  const starships = SHIP_TEMPLATES.filter(tpl => !isSmallCraft(tpl));
  const smallCraft = SHIP_TEMPLATES.filter(isSmallCraft);

  const numberField = (
    labelKey: string,
    value: number | null,
    onChange: (value: number | null) => void,
  ) => (
    <Field label={t(labelKey)} theme={theme}>
      {id => (
        <input
          id={id}
          type="number"
          step="any"
          style={inputStyle}
          value={value ?? ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(parseNullableNumber(e.target.value))}
        />
      )}
    </Field>
  );

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
        <ShipBanner theme={theme} />
        <PageHeader title={t("shipTitle")} icon={<IconShip />} />

        <div className="two-col-grid">
          <div>
            <Section title={t("shipTemplateSection")} color={COLORS.primary} theme={theme}>
              <Field label={t("shipTemplateLabel")} theme={theme}>
                {id => (
                  <select
                    id={id}
                    style={inputStyle}
                    value={pendingTemplate}
                    onChange={e => setPendingTemplate(e.target.value)}
                  >
                    <option value="">{t("shipTemplateBlank")}</option>
                    <optgroup label={t("shipTemplateStarships")}>
                      {starships.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>
                          {`${t(tpl.nameKey)} — ${t(tpl.designationKey)}`}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={t("shipTemplateSmallCraft")}>
                      {smallCraft.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>
                          {`${t(tpl.nameKey)} — ${tpl.hullTons} t`}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                )}
              </Field>
              <Button
                variant="primary"
                size="md"
                theme={theme}
                onClick={requestTemplate}
                disabled={pendingTemplate === ""}
                style={{ marginTop: 12 }}
              >
                <IconShip />
                {t("shipTemplateLoad")}
              </Button>
              <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 10, lineHeight: 1.5 }}>
                {t("shipTemplateHint")}
              </div>
            </Section>

            <Section title={t("shipIdentitySection")} color={SECTION_COLORS.techLevel} theme={theme}>
              <Field label={t("shipNameLabel")} theme={theme}>
                {id => (
                  <input
                    id={id}
                    type="text"
                    style={inputStyle}
                    placeholder={t("shipNamePlaceholder")}
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  />
                )}
              </Field>
              <div style={{ ...fieldGridStyle, marginTop: 12 }}>
                <Field label={t("shipDesignation")} theme={theme}>
                  {id => (
                    <input
                      id={id}
                      type="text"
                      style={inputStyle}
                      placeholder={t("shipDesignationPlaceholder")}
                      value={ship.designation}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ designation: e.target.value })}
                    />
                  )}
                </Field>
                {numberField("shipTlLabel", ship.tl, tl => patch({ tl }))}
                {numberField("shipHullTonsLabel", ship.hullTons, hullTons => patch({ hullTons }))}
                {numberField("shipHullPointsLabel", ship.hullPoints, hullPoints => patch({ hullPoints }))}
              </div>
              <Field label={t("shipCrewLabel")} theme={theme} style={{ marginTop: 12 }}>
                {id => (
                  <input
                    id={id}
                    type="text"
                    style={inputStyle}
                    placeholder={t("shipCrewPlaceholder")}
                    value={ship.crew}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ crew: e.target.value })}
                  />
                )}
              </Field>
              <div style={{ ...fieldGridStyle, marginTop: 12 }}>
                {numberField("shipMaintenanceLabel", ship.maintenance, maintenance => patch({ maintenance }))}
                {numberField("shipPurchasePriceLabel", ship.purchasePrice, purchasePrice => patch({ purchasePrice }))}
              </div>
            </Section>

            <Section title={t("shipCapacitySection")} color={SECTION_COLORS.population} theme={theme}>
              <Field label={t("shipCargoTonsLabel")} theme={theme}>
                {id => (
                  <input
                    id={id}
                    type="number"
                    min={0}
                    step="any"
                    style={inputStyle}
                    value={ship.capacity.cargoTons}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCargoTons(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                )}
              </Field>
              <div style={{ ...fieldGridStyle, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 12 }}>
                {PASSENGER_CLASS_OPTIONS.map(cls => (
                  <Field key={cls} label={t(BERTH_LABEL_KEY[cls])} theme={theme}>
                    {id => (
                      <input
                        id={id}
                        type="number"
                        min={0}
                        style={inputStyle}
                        value={ship.capacity.berths[cls]}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setBerths({ ...ship.capacity.berths, [cls]: Math.max(0, parseInt(e.target.value, 10) || 0) })
                        }
                      />
                    )}
                  </Field>
                ))}
              </div>
              <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 10, lineHeight: 1.5 }}>
                {t("shipCapacityHint")}
              </div>
            </Section>

            <Section title={t("shipPowerSection")} color={SECTION_COLORS.lawLevel} theme={theme}>
              <div style={fieldGridStyle}>
                {POWER_FIELDS.map(field => (
                  <div key={field.key}>{numberField(field.labelKey, ship.power[field.key], value => setPower(field.key, value))}</div>
                ))}
              </div>
            </Section>

            <Section title={t("shipNotesSection")} color={SECTION_COLORS.size} theme={theme}>
              <textarea
                aria-label={t("shipNotesSection")}
                placeholder={t("shipNotesPlaceholder")}
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                value={ship.notes}
                onChange={e => patch({ notes: e.target.value })}
              />
            </Section>
          </div>

          <div>
            {SHIP_SECTION_GROUPS.map((group, index) => (
              <Section
                key={group.titleKey}
                title={t(group.titleKey)}
                color={index === 2 ? COLORS.danger : SECTION_COLORS.starport}
                theme={theme}
              >
                <ShipRowHeader theme={theme} t={t} />
                {group.sections.map(sectionKey => (
                  <ShipSectionEditor
                    key={sectionKey}
                    theme={theme}
                    t={t}
                    sectionKey={sectionKey}
                    titleKey={sectionTitleKey(sectionKey)}
                    components={ship.sections[sectionKey]}
                    onAdd={partId => addComponent(sectionKey, partId)}
                    onUpdate={(id, changes) => updateComponent(sectionKey, id, changes)}
                    onRemove={id => removeComponent(sectionKey, id)}
                  />
                ))}
              </Section>
            ))}

            <Section title={t("shipTotalsSection")} color={SECTION_COLORS.atmosphere} theme={theme}>
              <Row
                label={t("shipTotalTons")}
                value={ship.hullTons === null
                  ? `${formatTons(totals.tons, lang, 2)} t`
                  : `${formatTons(totals.tons, lang, 2)} / ${formatTons(ship.hullTons, lang, 2)} t`}
                theme={theme}
              />
              <Row label={t("shipTotalPrice")} value={formatMCr(totals.price, lang)} theme={theme} />
              {ship.purchasePrice !== null && (
                <Row
                  label={t("shipPurchasePriceLabel")}
                  value={formatMCr(ship.purchasePrice, lang)}
                  theme={theme}
                />
              )}
              {ship.maintenance !== null && (
                <Row
                  label={t("shipMaintenanceLabel")}
                  value={formatCredits(ship.maintenance, lang)}
                  theme={theme}
                />
              )}
              <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 10, lineHeight: 1.5 }}>
                {t("shipTotalsHint")}
              </div>
              <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6, lineHeight: 1.5 }}>
                {t("shipSourceNote")}
              </div>
            </Section>
          </div>
        </div>

        <Footer theme={theme} t={t} />
      </main>

      {confirmOpen && (
        <Modal
          theme={theme}
          title={t("shipTemplateLoad")}
          closeLabel={t("close")}
          onClose={() => setConfirmOpen(false)}
          maxWidth={420}
          footer={
            <>
              <Button variant="ghost" size="md" theme={theme} onClick={() => setConfirmOpen(false)}>
                {t("close")}
              </Button>
              <Button variant="primary" size="md" theme={theme} onClick={applyTemplate}>
                {t("shipTemplateLoad")}
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: theme.text }}>
            {t("shipTemplateConfirm")}
          </p>
        </Modal>
      )}
    </div>
  );
};
