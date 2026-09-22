import type { CSSProperties, ChangeEvent, FC, ReactNode } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { Language, TranslationFunction } from "../types/i18n";
import type {
  CargoItem,
  CrewMember,
  PowerPlantType,
  SensorGrade,
  ShipComponent,
  ShipPower,
  ShipSectionKey,
  ShipSheet,
} from "../types/ship";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Modal } from "../components/ui/Modal";
import { Section } from "../components/ui/Section";
import { Tabs } from "../components/ui/Tabs";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Row } from "../components/ui/Row";
import { PageHeader } from "../components/ui/PageHeader";
import { ShipBanner } from "../components/banners";
import { ShipRowHeader, ShipSectionEditor } from "../components/ShipSectionEditor";
import { ShipCreateModal } from "../components/ShipCreateModal";
import { TurretBuilderModal } from "../components/TurretBuilderModal";
import { IconDownload, IconShip, IconTrash } from "../components/icons";
import { COLORS, SECTION_COLORS } from "../constants/colors";
import {
  CREW_ROLES,
  J_DRIVE_RATINGS,
  JUMP_OPTIONS,
  M_DRIVE_RATINGS,
  POWER_PLANTS,
  SENSOR_GRADES,
  SHIP_GROUPS_LEFT_COLUMN,
  SHIP_SECTION_GROUPS,
  SHIP_TABS,
  THRUST_OPTIONS,
  crewRoleKey,
  hasQuantity,
  sectionCanRemove,
  jDriveTons,
  isFixedSection,
  mDriveTons,
  sectionTitleKey,
} from "../constants/ship";
import type { CrewRole, ShipTabId } from "../constants/ship";
import type { TurretBuild, TurretKind } from "../types/ship";
import type { ShipTemplate } from "../constants/shipTemplates";
import { useShip } from "../hooks/useShip";
import {
  cargoCapacityTons,
  cargoUsedTons,
  componentFromPart,
  crewMemberFromRole,
  newCargoItem,
  shipPowerRequirements,
  shipTypeName,
} from "../utils/ship";
import { formatTons } from "../utils/format";
import { turretComponent } from "../utils/turret";
import { saveFile } from "../utils/download";
import { shipJsonFile } from "../utils/shipExport";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby" | "ship";

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

/** Sin nave activa no hay nada que calcular; el recuadro no llega a pintarse. */
const NO_POWER: ShipPower = {
  basic: 0,
  mDrive: 0,
  jDrive: 0,
  sensors: 0,
  weapons: 0,
  available: 0,
  modes: { combat: 0, jump: 0 },
};

/**
 * El desglose de potencia, como cifras sueltas. Las etiquetas son cortas a
 * propósito: en un cuadro de métricas el rótulo va en versalitas encima del
 * número, y "Sistemas básicos de la nave" ahí no se lee, se estorba.
 */
const POWER_FIELDS: readonly { key: keyof Omit<ShipPower, "available" | "modes">; labelKey: string }[] = [
  { key: "basic", labelKey: "shipPowerBasicShort" },
  { key: "mDrive", labelKey: "shipPowerMDriveShort" },
  { key: "jDrive", labelKey: "shipPowerJDriveShort" },
  { key: "sensors", labelKey: "shipPowerSensors" },
  { key: "weapons", labelKey: "shipPowerWeapons" },
];

/** Las líneas que declaran potencia propia: cada arma trae la suya del manual. */
const POWER_SECTIONS: readonly ShipSectionKey[] = ["weapons", "ammo"];

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
  // La flota se gobierna desde el menú, no desde aquí: esta vista es la ficha de
  // UNA nave, la activa. Lo único que hace con la flota es fundarla cuando está
  // vacía, porque hasta entonces no hay ficha que enseñar.
  const { ship, name, setName, createShip, deleteShip, setShip } = useShip();
  const [tab, setTab] = useState<ShipTabId>("profile");
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  /**
   * El diálogo de armamento: null = cerrado, `id: null` = montar una nueva y
   * `kind` dice cuál de las dos tablas se está montando; con `id`, se edita esa
   * fila y la tabla la manda lo que ya lleva puesto.
   */
  const [turretForm, setTurretForm] = useState<{ id: string | null; kind: TurretKind } | null>(null);
  // Las papeleras de la pestaña Detalles se piden: escondidas, el nombre del
  // componente ocupa la fila entera y las toneladas quedan pegadas a la derecha.
  /**
   * Qué tarjetas están en modo eliminar, por su titleKey. Una por una y no un
   * interruptor global: quitar una línea es cosa de la tarjeta en la que está, y
   * el de arriba encendía papeleras en las diez a la vez para borrar una.
   */
  const [removeIn, setRemoveIn] = useState<ReadonlySet<string>>(() => new Set());

  const toggleRemove = (titleKey: string): void =>
    setRemoveIn(prev => {
      const next = new Set(prev);
      if (!next.delete(titleKey)) next.add(titleKey);
      return next;
    });

  const power = useMemo(() => (ship === null ? NO_POWER : shipPowerRequirements(ship)), [ship]);

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

  const hintStyle: CSSProperties = { fontSize: 11, color: theme.textDimmed, marginTop: 10, lineHeight: 1.5 };

  /** El formulario de creación, que se abre desde la flota vacía y desde la llena. */
  const createModal = createOpen && (
    <ShipCreateModal
      theme={theme}
      t={t}
      onClose={() => setCreateOpen(false)}
      onCreate={(shipName: string, template: ShipTemplate | null) => {
        createShip(shipName, template, t);
        setCreateOpen(false);
        // La nave recién creada se lee en Perfil, aunque se estuviera mirando otra pestaña.
        setTab("profile");
      }}
    />
  );

  /**
   * El título de la página es el nombre de la nave: esta pantalla es la ficha de
   * UNA nave, y quien dice de qué herramienta se trata es el menú, que ya está
   * ahí arriba. Sin nombre —o sin nave, que entonces es la pantalla de crear la
   * primera— vuelve el rótulo de la herramienta.
   */
  const pageTitle = name.trim() === "" ? t("shipTitle") : name.trim();

  const chrome = (children: ReactNode) => (
    <div className="page-shell" style={{ background: theme.bg, color: theme.text, fontFamily: "inherit" }}>
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
        <PageHeader title={pageTitle} icon={<IconShip />} />
        {children}
      </main>
      <Footer theme={theme} t={t} />
      {createModal}
    </div>
  );

  // Sin naves no hay ficha que enseñar: la herramienta empieza creando una, que
  // es donde se elige el tipo. A partir de ahí el tipo ya no se toca.
  if (ship === null) {
    return chrome(
      <Section title={t("shipCreateTitle")} color={COLORS.primary} theme={theme}>
        <div style={{ fontSize: 13, color: theme.textDimmed, marginBottom: 12, lineHeight: 1.6 }}>
          {t("shipFleetEmpty")}
        </div>
        <Button variant="primary" size="md" theme={theme} onClick={() => setCreateOpen(true)}>
          <IconShip />
          {t("shipCreateAction")}
        </Button>
        <div style={hintStyle}>{t("shipCreateHint")}</div>
      </Section>,
    );
  }

  const patch = (changes: Partial<ShipSheet>): void => setShip(prev => ({ ...prev, ...changes }));

  const setRating = <K extends keyof ShipSheet["ratings"]>(
    key: K,
    value: ShipSheet["ratings"][K],
  ): void => setShip(prev => ({ ...prev, ratings: { ...prev.ratings, [key]: value } }));

  const addComponent = (section: ShipSectionKey, partId: string | null): void =>
    setShip(prev => ({
      ...prev,
      sections: { ...prev.sections, [section]: [...prev.sections[section], componentFromPart(partId, t, section)] },
    }));

  /**
   * El editor manda el id "" cuando escribes en la línea en blanco que una
   * sección fija enseña sin tener ninguna guardada: ese primer cambio la crea.
   */
  const updateComponent = (section: ShipSectionKey, id: string, changes: Partial<ShipComponent>): void =>
    setShip(prev => {
      const rows = prev.sections[section];
      const next = rows.some(c => c.id === id)
        ? rows.map(c => (c.id === id ? { ...c, ...changes } : c))
        : [...rows, { ...componentFromPart(null, t, section), ...changes }];
      return { ...prev, sections: { ...prev.sections, [section]: next } };
    });

  const removeComponent = (section: ShipSectionKey, id: string): void =>
    setShip(prev => ({
      ...prev,
      sections: { ...prev.sections, [section]: prev.sections[section].filter(c => c.id !== id) },
    }));

  /**
   * Lo que salga del diálogo: una fila nueva, o la misma fila con otra torreta
   * dentro. Se reemplaza entera —nombre, toneladas y potencia— porque los tres
   * salen de la elección y editarlos por separado no está permitido.
   */
  const saveTurret = (build: TurretBuild): void => {
    const editing = turretForm?.id ?? null;
    setShip(prev => {
      const fitted = turretComponent(build, t);
      const weapons =
        editing === null
          ? [...prev.sections.weapons, fitted]
          : prev.sections.weapons.map(row => (row.id === editing ? { ...fitted, id: row.id } : row));
      return { ...prev, sections: { ...prev.sections, weapons } };
    });
    setTurretForm(null);
  };

  /** La torreta que se está editando, para abrir el diálogo con lo que ya tiene. */
  const editingTurret =
    turretForm?.id === undefined || turretForm.id === null
      ? undefined
      : ship.sections.weapons.find(row => row.id === turretForm.id)?.turret;

  const turretKind: TurretKind =
    editingTurret === undefined ? turretForm?.kind ?? "turret" : editingTurret.mount === "barbette" ? "barbette" : "turret";

  /** Una sección del bloque de estadísticas. `showRemove` lo decide su tarjeta. */
  const renderSection = (sectionKey: ShipSectionKey, showRemove: boolean, removeToggle?: ReactNode) => (
    <ShipSectionEditor
      key={sectionKey}
      removeToggle={removeToggle}
      theme={theme}
      t={t}
      sectionKey={sectionKey}
      titleKey={sectionTitleKey(sectionKey)}
      components={ship.sections[sectionKey]}
      fixed={isFixedSection(sectionKey)}
      showRemove={showRemove}
      showPower={POWER_SECTIONS.includes(sectionKey)}
      showQty={hasQuantity(sectionKey)}
      ratingCell={ratingCells[sectionKey]}
      builders={
        sectionKey === "weapons"
          ? [
              { label: t("shipTurretOpen"), onOpen: () => setTurretForm({ id: null, kind: "turret" }) },
              { label: t("shipBarbetteOpen"), onOpen: () => setTurretForm({ id: null, kind: "barbette" }) },
            ]
          : undefined
      }
      onEditTurret={id => setTurretForm({ id, kind: "turret" })}
      onAdd={partId => addComponent(sectionKey, partId)}
      onUpdate={(id, changes) => updateComponent(sectionKey, id, changes)}
      onRemove={id => removeComponent(sectionKey, id)}
    />
  );

  /**
   * Una tarjeta entera: su cabecera de columnas y las secciones que agrupa.
   *
   * Las tres columnas opcionales las decide la TARJETA, no cada sección: la
   * cabecera es una sola para todas sus filas, así que si una sección pintara
   * una columna que la cabecera no tiene, sus filas saldrían descuadradas.
   *
   * Con la de eliminar, además, eso decide a dónde llega el interruptor: solo a
   * las tarjetas que tienen alguna fila que quitar. El juego fijo de la nave
   * —casco, motores, energía, sistemas principales— no puede perder ninguna, así
   * que no se encoge al encenderlo; antes se reajustaba la ficha entera para
   * hacerle sitio a papeleras que no llegaban a salir.
   */
  const renderGroup = (group: (typeof SHIP_SECTION_GROUPS)[number]) => {
    // El interruptor va en TODAS las secciones que tengan algo que quitar, al
    // lado de su propio menú de añadir: el jugador que está mirando las áreas
    // comunes no tiene por qué subir a la línea de los camarotes para encender
    // la papelera. Los botones encienden lo mismo —la columna es de la tarjeta,
    // porque su cabecera es una sola— y por eso se encienden todos a la vez.
    const canRemove = (key: ShipSectionKey): boolean => sectionCanRemove(key, ship.sections[key]);
    const showRemove = group.sections.some(canRemove) && removeIn.has(group.titleKey);
    const showPower = group.sections.some(key => POWER_SECTIONS.includes(key));
    const showQty = group.sections.some(hasQuantity);
    const label = t(showRemove ? "shipRemoveRowsDone" : "shipRemoveRows");
    // Sin rótulo: va pegado a un menú de añadir que ya lleva el suyo, y en diez
    // tarjetas "Eliminar filas" escrito entero gritaría más que la ficha.
    const toggle = (
      <Button
        variant="option"
        size="sm"
        theme={theme}
        active={showRemove}
        aria-pressed={showRemove}
        aria-label={`${label}: ${t(group.titleKey)}`}
        title={label}
        onClick={() => toggleRemove(group.titleKey)}
        // El icono trae seis píxeles de margen a la derecha, que son los que lo
        // separan de su rótulo. Aquí no hay rótulo: se los devolvemos al padding
        // para que la papelera quede centrada.
        style={{ padding: "6px 6px 6px 12px", minHeight: 0 }}
      >
        <IconTrash />
      </Button>
    );
    return (
      <Section
        key={group.titleKey}
        title={t(group.titleKey)}
        color={group.titleKey === "shipGroupWeapons" ? COLORS.danger : SECTION_COLORS.starport}
        theme={theme}
      >
        <ShipRowHeader theme={theme} t={t} showRemove={showRemove} showPower={showPower} showQty={showQty} />
        {group.sections.map(key => renderSection(key, showRemove, canRemove(key) ? toggle : undefined))}
      </Section>
    );
  };

  const addCrewMember = (role: CrewRole | null): void =>
    setShip(prev => ({ ...prev, crewList: [...prev.crewList, crewMemberFromRole(role, t)] }));

  const updateCrewMember = (id: string, changes: Partial<CrewMember>): void =>
    setShip(prev => ({
      ...prev,
      crewList: prev.crewList.map(member => (member.id === id ? { ...member, ...changes } : member)),
    }));

  const addCargoItem = (): void => setShip(prev => ({ ...prev, cargoHold: [...prev.cargoHold, newCargoItem()] }));

  const updateCargoItem = (id: string, changes: Partial<CargoItem>): void =>
    setShip(prev => ({
      ...prev,
      cargoHold: prev.cargoHold.map(item => (item.id === id ? { ...item, ...changes } : item)),
    }));

  const removeCargoItem = (id: string): void =>
    setShip(prev => ({ ...prev, cargoHold: prev.cargoHold.filter(item => item.id !== id) }));

  const removeCrewMember = (id: string): void =>
    setShip(prev => ({ ...prev, crewList: prev.crewList.filter(member => member.id !== id) }));

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


  /**
   * Una cifra del cuadro de potencia: rótulo en versalitas y el número debajo.
   * `lead` es la que encabeza —lo que la planta da—: mismo recuadro que las
   * demás, pero el número en grande y en naranja. El desglose va en el color del
   * texto para que el naranja siga señalando una sola cosa.
   */
  /**
   * Una de las dos configuraciones, con la cifra teñida según si la planta llega.
   *
   * Es la única comparación de toda la ficha, y se hace aquí porque es la única
   * que tiene sentido: contra un total de los cinco sistemas no se compara nada,
   * porque esa nave no existe. Sigue sin ser una validación —nadie impide
   * guardar una nave que no arranca—, es la respuesta a "¿me llega?".
   */
  /**
   * Una casilla de métrica: el rótulo en versalitas encima y la cifra grande
   * debajo, con lo que la acompañe en pequeño al lado.
   *
   * La usan las tres cosas que la ficha calcula —la potencia, las dos
   * configuraciones y la bodega—, y se pintan igual a propósito: son las únicas
   * cifras de la ficha que no ha tecleado nadie.
   */
  const metricTile = (
    key: string,
    label: string,
    value: string | number,
    opts: { lead?: boolean; color?: string; suffix?: string; padding?: string } = {},
  ) => {
    const lead = opts.lead ?? false;
    return (
      <div
        key={key}
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: lead ? "12px 14px" : opts.padding ?? "10px 8px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: "uppercase",
            // El desglose va más apretado: con 1px de tracking "MANIOBRA" no cabe
            // en una quinta parte de la tarjeta y parte en dos líneas.
            letterSpacing: lead ? 1 : 0.5,
            color: theme.textMuted,
          }}
        >
          {label}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
          <span
            style={{
              fontSize: lead ? 30 : 22,
              fontWeight: 500,
              lineHeight: 1,
              // Sin esto los dígitos bailan de ancho y las columnas no cuadran.
              fontVariantNumeric: "tabular-nums",
              color: opts.color ?? (lead ? COLORS.primary : theme.text),
            }}
          >
            {value}
          </span>
          {opts.suffix !== undefined && (
            <span style={{ fontSize: 11, color: theme.textDimmed }}>{opts.suffix}</span>
          )}
        </div>
      </div>
    );
  };

  const powerMetric = (labelKey: string, value: number, lead: boolean) =>
    metricTile(labelKey, t(labelKey), value, { lead, suffix: t("shipPowerUnit") });

  /**
   * Una de las dos configuraciones, con la cifra teñida según si la planta llega.
   *
   * Es la única comparación de toda la ficha, y se hace aquí porque es la única
   * que tiene sentido: contra un total de los cinco sistemas no se compara nada,
   * porque esa nave no existe. Sigue sin ser una validación —nadie impide guardar
   * una nave que no arranca—, es la respuesta a "¿me llega?".
   */
  const powerMode = (labelKey: string, need: number) =>
    metricTile(labelKey, t(labelKey), need, {
      padding: "10px 12px",
      suffix: `/ ${power.available} ${t("shipPowerUnit")}`,
      // Verde si la planta da para esta configuración, ámbar si se queda corta.
      // Ámbar y no rojo porque no es un error: una nave que no puede saltar con
      // las armas calientes es una nave normal, y el naranja fuerte está
      // reservado al acento de la ficha. Sin planta elegida la cifra se queda
      // neutra, que en una ficha en blanco no hay contra qué comparar.
      color: power.available === 0 ? theme.text : need <= power.available ? COLORS.success : COLORS.warning,
    });

  /** "Propulsión 2", "Salto-2": la línea del motor, tal y como la imprime el manual. */
  const thrustLabel = (value: number | "reaction"): string =>
    value === "reaction" ? t("shipThrustReaction") : `${t("shipThrustOption")} ${value}`;
  const jumpLabel = (value: number): string => `${t("shipJumpOption")}-${value}`;

  /**
   * Al elegir una puntuación, sus toneladas: la tabla de potencial las da como un
   * porcentaje del casco. Se rellenan, no se imponen —la casilla sigue siendo del
   * jugador—, y sin tonelaje de casco no hay nada que rellenar.
   */
  const driveTons = (compute: (hull: number) => number): { tons: number } | undefined =>
    ship.hullTons === null ? undefined : { tons: compute(ship.hullTons) };

  /**
   * La casilla del nombre en la línea de cada motor. No se escribe: un motor es
   * su calificación, y de ella salen sus puntos de Potencia, así que un campo de
   * texto libre solo podría contradecir al número con el que se hace la cuenta.
   * El texto de la opción es exactamente el que se guarda como nombre de la fila.
   */
  const ratingCells: Partial<Record<ShipSectionKey, (component: ShipComponent) => ReactNode>> = {
    mDrive: component => (
      <select
        aria-label={t("shipThrustLabel")}
        style={inputStyle}
        value={ship.ratings.reaction ? "reaction" : ship.ratings.thrust ?? ""}
        onChange={e => {
          const { value } = e.target;
          const reaction = value === "reaction";
          setShip(prev => ({
            ...prev,
            ratings: {
              ...prev.ratings,
              reaction,
              thrust: value === "" || reaction ? null : Number(value),
            },
          }));
          updateComponent("mDrive", component.id, {
            label: value === "" ? "" : thrustLabel(reaction ? "reaction" : Number(value)),
            // El motor de reacción tiene su propia tabla de porcentajes, que la
            // ficha no lleva, así que ahí las toneladas se quedan como estén.
            ...(value === "" || reaction ? {} : driveTons(hull => mDriveTons(Number(value), hull))),
          });
        }}
      >
        <option value="">{t("shipRatingNone")}</option>
        {THRUST_OPTIONS.map(n => (
          <option key={n} value={n}>
            {`${thrustLabel(n)} — ${t("shipTlShort")}${M_DRIVE_RATINGS[n]?.tl ?? ""}`}
          </option>
        ))}
        <option value="reaction">{t("shipThrustReaction")}</option>
      </select>
    ),
    powerPlant: component => (
      <select
        aria-label={t("shipPlantLabel")}
        style={inputStyle}
        value={ship.ratings.powerPlant ?? ""}
        onChange={e => {
          const { value } = e.target;
          const plant = POWER_PLANTS.find(p => p.id === value);
          setRating("powerPlant", plant ? (plant.id as PowerPlantType) : null);
          updateComponent("powerPlant", component.id, { label: plant ? t(plant.labelKey) : "" });
        }}
      >
        <option value="">{t("shipRatingNone")}</option>
        {POWER_PLANTS.map(plant => (
          <option key={plant.id} value={plant.id}>
            {`${t(plant.labelKey)} — ${plant.powerPerTon} ${t("shipPowerPerTon")}`}
          </option>
        ))}
      </select>
    ),
    sensors: component => (
      <select
        aria-label={t("shipSensorGradeLabel")}
        style={inputStyle}
        value={ship.ratings.sensors ?? ""}
        onChange={e => {
          const grade = SENSOR_GRADES.find(g => g.id === e.target.value);
          setRating("sensors", grade ? (grade.id as SensorGrade) : null);
          updateComponent("sensors", component.id, { label: grade ? t(grade.labelKey) : "" });
        }}
      >
        <option value="">{t("shipRatingNone")}</option>
        {SENSOR_GRADES.map(grade => (
          <option key={grade.id} value={grade.id}>
            {`${t(grade.labelKey)} — ${grade.power} ${t("shipPowerUnit")}`}
          </option>
        ))}
      </select>
    ),
    jDrive: component => (
      <select
        aria-label={t("shipJumpLabel")}
        style={inputStyle}
        value={ship.ratings.jump ?? ""}
        onChange={e => {
          const { value } = e.target;
          setRating("jump", value === "" ? null : Number(value));
          updateComponent("jDrive", component.id, {
            label: value === "" ? "" : jumpLabel(Number(value)),
            ...(value === "" ? {} : driveTons(hull => jDriveTons(Number(value), hull))),
          });
        }}
      >
        <option value="">{t("shipRatingNone")}</option>
        {JUMP_OPTIONS.map(n => (
          <option key={n} value={n}>
            {`${jumpLabel(n)} — ${t("shipTlShort")}${J_DRIVE_RATINGS[n]?.tl ?? ""}`}
          </option>
        ))}
      </select>
    ),
  };

  const panelProps = (id: ShipTabId) => ({
    role: "tabpanel" as const,
    id: `ship-${id}`,
    "aria-labelledby": `ship-tab-${id}`,
    tabIndex: -1,
  });

  // La bodega: el hueco que la nave tiene, lo que hay metido y lo que queda.
  // Lo que queda puede salir negativo, y se enseña tal cual: la ficha no impide
  // cargar de más, solo lo dice.
  /** Las toneladas que una sección suma, para ponerlas al pie de su cifra. */
  const sectionTons = (key: ShipSectionKey): string => {
    const tons = ship.sections[key].reduce((sum, row) => sum + (row.tons ?? 0), 0);
    return tons === 0 ? "" : `· ${formatTons(tons, lang, 2)} t`;
  };

  const cargoUsed = cargoUsedTons(ship);
  const cargoTotal = cargoCapacityTons(ship);
  const cargoFree = Math.round((cargoTotal - cargoUsed) * 100) / 100;
  const cargoTile = (key: string, value: number, color?: string) =>
    metricTile(key, t(key), formatTons(value, lang, 2), { padding: "10px 12px", suffix: "t", color });

  // La ficha sale tal cual se guarda: el fichero es exactamente lo que el type
  // guard sabe validar. Ver utils/shipExport.ts.
  const exportShip = (): void => saveFile(shipJsonFile(ship, t("shipNamePlaceholder")));

  /**
   * Al borrarla, useShip activa la siguiente de la flota; el jugador se queda en
   * el menú, que es donde vive la flota y donde se elige con cuál sigue. Quedarse
   * en la ficha le enseñaría la nave de al lado sin haberla pedido.
   */
  const removeShip = (): void => {
    deleteShip(ship.id);
    setConfirmDelete(false);
    goHome();
  };

  return chrome(
    <>
      <Tabs
        theme={theme}
        tabs={SHIP_TABS.map(item => ({ id: item.id, label: t(item.labelKey) }))}
        activeId={tab}
        onChange={id => setTab(id as ShipTabId)}
        ariaLabel={t("shipTabsLabel")}
        idPrefix="ship"
      />

      {/* ---------------- Perfil ---------------- */}
      {tab === "profile" && (
        <div {...panelProps("profile")}>
          <div className="two-col-grid">
            <div>
              <Section title={t("shipIdentitySection")} color={SECTION_COLORS.techLevel} theme={theme}>
                {/* El tipo se lee, no se elige: lo decidió el formulario de creación. */}
                <Row label={t("shipTypeLabel")} value={shipTypeName(ship, t)} theme={theme} />
                <div style={{ ...hintStyle, marginTop: 6 }}>{t("shipTypeLockedHint")}</div>
                {/* El crédito va con el tipo, que es de donde sale: los 24
                    diseños son del manual, y el resto de la ficha es del
                    jugador. Vivía en el resumen que ya no existe. */}
                <div style={{ ...hintStyle, marginTop: 4, marginBottom: 12 }}>{t("shipSourceNote")}</div>
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
              </Section>

              {/* Las dos acciones de la nave entera, discretas y solo en Perfil: se
                  usan de tarde en tarde y no tienen por qué competir con la ficha. El
                  rojo de la papelera es el único aviso que necesitan; lo serio lo dice
                  el diálogo de confirmación. */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginBottom: 8 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  theme={theme}
                  onClick={exportShip}
                  title={t("shipExportHint")}
                >
                  <IconDownload />
                  {t("shipExport")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  theme={theme}
                  onClick={() => setConfirmDelete(true)}
                  title={t("shipDeleteHint")}
                  style={{ color: COLORS.danger }}
                >
                  <IconTrash />
                  {t("shipDeleteTitle")}
                </Button>
              </div>

              <Section title={t("shipNotesSection")} color={SECTION_COLORS.size} theme={theme}>
                {/* Alto de sobra: aquí se escribe la historia de la nave, no una
                    línea suelta. Sigue siendo estirable a mano. */}
                <textarea
                  aria-label={t("shipNotesSection")}
                  placeholder={t("shipNotesPlaceholder")}
                  style={{ ...inputStyle, minHeight: 240, resize: "vertical", lineHeight: 1.6 }}
                  value={ship.notes}
                  onChange={e => patch({ notes: e.target.value })}
                />
              </Section>
            </div>

            <div>
              {/* Lo que la nave HACE, que es lo primero que se pregunta de
                  ella: cuánto empuja, hasta dónde salta y cuánto ocupa cada
                  motor. Las cifras salen de las calificaciones y de las filas de
                  Detalles; aquí solo se leen. */}
              <Section title={t("shipEnginesSection")} color={SECTION_COLORS.atmosphere} theme={theme}>
                <div className="metric-grid metric-grid--pair">
                  {metricTile(
                    "shipPowerMDriveShort",
                    t(ship.ratings.reaction ? "shipThrustReaction" : "shipPowerMDriveShort"),
                    ship.ratings.thrust ?? "—",
                    { padding: "10px 12px", suffix: sectionTons("mDrive") },
                  )}
                  {metricTile("shipPowerJDriveShort", t("shipPowerJDriveShort"), ship.ratings.jump ?? "—", {
                    padding: "10px 12px",
                    suffix: sectionTons("jDrive"),
                  })}
                </div>
              </Section>


              <Section title={t("shipPowerSection")} color={SECTION_COLORS.lawLevel} theme={theme}>
                {/* Arriba lo que la planta da; en medio, lo que pide cada
                    sistema por separado —sin un total, que sería una nave con
                    todo encendido a la vez—; y abajo las dos configuraciones
                    que sí se dan, comparadas con la planta. */}
                <div className="metric-grid metric-grid--lead">
                  {powerMetric("shipPowerAvailable", power.available, true)}
                </div>
                <div className="metric-grid metric-grid--breakdown" style={{ marginTop: 10 }}>
                  {POWER_FIELDS.map(field => powerMetric(field.labelKey, power[field.key], false))}
                </div>
                {/* Y debajo, las dos únicas configuraciones con las que se
                    juega: sumar los cinco de arriba describiría una nave que no
                    existe, pero estas dos sí se dan y contra ellas sí se puede
                    preguntar si la planta llega. */}
                <div className="metric-grid metric-grid--pair" style={{ marginTop: 10 }}>
                  {powerMode("shipPowerModeCombat", power.modes.combat)}
                  {powerMode("shipPowerModeJump", power.modes.jump)}
                </div>
              </Section>

              <Section title={t("shipCargoSection")} color={SECTION_COLORS.hydrographics} theme={theme}>
                {/* Las mismas tres cifras que abre la pestaña de bodega, aquí de
                    un vistazo: el perfil es lo que se mira antes de aceptar un
                    flete, y lo que se pregunta es cuánto queda libre. */}
                <div className="metric-grid metric-grid--pair">
                  {cargoTile("shipCargoUsed", cargoUsed)}
                  {cargoTile("shipCargoFree", cargoFree, cargoFree < 0 ? COLORS.warning : COLORS.success)}
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Detalles ---------------- */}
      {tab === "details" && (
        <div {...panelProps("details")}>
          <div className="two-col-grid">
            {/* Repartidas a mano en dos columnas: con `column-count` el
                navegador parte una tarjeta por la mitad entre columnas. */}
            <div>{SHIP_SECTION_GROUPS.slice(0, SHIP_GROUPS_LEFT_COLUMN).map(renderGroup)}</div>
            <div>{SHIP_SECTION_GROUPS.slice(SHIP_GROUPS_LEFT_COLUMN).map(renderGroup)}</div>
          </div>
        </div>
      )}

      {/* ---------------- Bodega ---------------- */}
      {tab === "cargo" && (
        <div {...panelProps("cargo")}>
          <Section title={t("shipCargoHoldSection")} color={SECTION_COLORS.hydrographics} theme={theme}>
            {/* Arriba el hueco, lo metido y lo que queda; debajo, el manifiesto.
                Las tres cifras van juntas porque se leen juntas: lo libre es lo
                único que el jugador mira cuando le ofrecen un lote. */}
            <div className="metric-grid metric-grid--trio" style={{ marginBottom: 12 }}>
              {cargoTile("shipCargoTotal", cargoTotal)}
              {cargoTile("shipCargoUsed", cargoUsed)}
              {/* Ámbar cuando se ha pasado, como en la potencia: no es un error,
                  es una nave sobrecargada, que es cosa del jugador. */}
              {cargoTile("shipCargoFree", cargoFree, cargoFree < 0 ? COLORS.warning : COLORS.success)}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 12, color: theme.textDimmed }}>
                {`${t("shipCargoItems")}: ${ship.cargoHold.length}`}
              </span>
              <Button variant="option" size="sm" theme={theme} onClick={addCargoItem}>
                {`+ ${t("shipCargoAdd")}`}
              </Button>
            </div>

            {ship.cargoHold.length === 0 ? (
              <div style={{ fontSize: 13, color: theme.textDimmed, padding: "8px 2px" }}>
                {t("shipCargoEmpty")}
              </div>
            ) : (
              <table className="traveller-table sheet-table cargo-table">
                <thead>
                  <tr>
                    <th scope="col">{t("shipCargoItemLabel")}</th>
                    <th scope="col">{t("shipColTons")}</th>
                    <th scope="col">
                      <span className="sr-only">{t("shipCargoRemove")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ship.cargoHold.map(item => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          aria-label={t("shipCargoItemLabel")}
                          placeholder={t("shipCargoItemLabel")}
                          style={inputStyle}
                          value={item.label}
                          onChange={e => updateCargoItem(item.id, { label: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          aria-label={t("shipColTons")}
                          placeholder={t("shipColTons")}
                          style={inputStyle}
                          value={item.tons ?? ""}
                          onChange={e => updateCargoItem(item.id, { tons: parseNullableNumber(e.target.value) })}
                        />
                      </td>
                      <td>
                        <Button
                          variant="icon"
                          theme={theme}
                          aria-label={`${t("shipCargoRemove")}: ${item.label}`}
                          onClick={() => removeCargoItem(item.id)}
                        >
                          <IconTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </div>
      )}

      {/* ---------------- Tripulación ---------------- */}
      {tab === "crew" && (
        <div {...panelProps("crew")}>
          {/* Primero lo que el DISEÑO pide —una sola línea, y es contra ella
              contra la que el jugador lee su lista—, y debajo quién lo cubre de
              verdad. Esa segunda va a todo el ancho, y no en media columna como
              Perfil y Detalles: es el rol de la nave, una tabla de gente que se
              lee de un vistazo, y cuanta más pantalla haya más nombres caben
              sin apretarse. */}
          <Section title={t("shipCrewRequiredSection")} color={SECTION_COLORS.techLevel} theme={theme}>
            <Field label={t("shipCrewLabel")} theme={theme}>
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
            <div style={hintStyle}>{t("shipCrewRequiredHint")}</div>
          </Section>
          <Section title={t("shipCrewRosterSection")} color={SECTION_COLORS.population} theme={theme}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 12, color: theme.textDimmed }}>
                {`${t("shipCrewAboard")}: ${ship.crewList.length}`}
              </span>
              <select
                aria-label={t("shipCrewAdd")}
                defaultValue=""
                onChange={e => {
                  const { value } = e.target;
                  if (value === "") return;
                  addCrewMember(value === "custom" ? null : (value as CrewRole));
                  // Vuelve a la invitación para poder añadir dos pilotos.
                  e.target.value = "";
                }}
                style={{ ...inputStyle, width: "auto", maxWidth: 220, fontSize: 12, padding: "6px 8px" }}
              >
                <option value="">{`+ ${t("shipCrewAdd")}`}</option>
                {CREW_ROLES.map(role => (
                  <option key={role} value={role}>
                    {t(crewRoleKey(role))}
                  </option>
                ))}
                <option value="custom">{t("shipAddCustom")}</option>
              </select>
            </div>

            {ship.crewList.length === 0 ? (
              <div style={{ fontSize: 13, color: theme.textDimmed, padding: "8px 2px" }}>
                {t("shipCrewEmpty")}
              </div>
            ) : (
              // Una tabla de verdad, con la cabecera naranja del manual
              // (.traveller-table): son columnas de datos, y así el lector
              // de pantalla canta a qué columna pertenece cada casilla.
              // Los placeholders repiten el título porque en móvil la
              // cabecera desaparece y las filas se apilan.
              <table className="traveller-table sheet-table crew-table">
                <thead>
                  <tr>
                    <th scope="col">{t("shipCrewMemberName")}</th>
                    <th scope="col">{t("shipCrewMemberRole")}</th>
                    <th scope="col">{t("shipCrewMemberSalary")}</th>
                    <th scope="col">
                      <span className="sr-only">{t("shipCrewRemove")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ship.crewList.map(member => (
                    <tr key={member.id}>
                      <td>
                        <input
                          type="text"
                          aria-label={t("shipCrewMemberName")}
                          placeholder={t("shipCrewMemberName")}
                          style={inputStyle}
                          value={member.name}
                          onChange={e => updateCrewMember(member.id, { name: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          aria-label={t("shipCrewMemberRole")}
                          placeholder={t("shipCrewMemberRole")}
                          style={inputStyle}
                          value={member.role}
                          onChange={e => updateCrewMember(member.id, { role: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          aria-label={t("shipCrewMemberSalary")}
                          placeholder={t("shipCrewMemberSalary")}
                          style={inputStyle}
                          value={member.salary ?? ""}
                          onChange={e =>
                            updateCrewMember(member.id, { salary: parseNullableNumber(e.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <Button
                          variant="icon"
                          theme={theme}
                          aria-label={`${t("shipCrewRemove")}: ${member.name || member.role || ""}`}
                          onClick={() => removeCrewMember(member.id)}
                        >
                          <IconTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={hintStyle}>{t("shipCrewRosterHint")}</div>
          </Section>
        </div>
      )}

      {turretForm !== null && (
        <TurretBuilderModal
          theme={theme}
          lang={lang}
          t={t}
          kind={turretKind}
          initial={editingTurret}
          onClose={() => setTurretForm(null)}
          onSave={saveTurret}
        />
      )}

      {confirmDelete && (
        <Modal
          theme={theme}
          title={t("shipDeleteTitle")}
          closeLabel={t("close")}
          onClose={() => setConfirmDelete(false)}
          maxWidth={420}
          footer={
            <>
              <Button variant="ghost" size="md" theme={theme} onClick={() => setConfirmDelete(false)}>
                {t("close")}
              </Button>
              <Button variant="danger" size="md" theme={theme} onClick={removeShip}>
                <IconTrash />
                {t("shipDeleteAction")}
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: theme.text }}>
            {`${t("shipDeleteConfirm")} ${ship.name || t("shipNamePlaceholder")}`}
          </p>
        </Modal>
      )}
    </>,
  );
};
