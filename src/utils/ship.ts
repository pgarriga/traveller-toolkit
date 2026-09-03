// Construcción y lectura de la ficha de "Mi nave".
//
// Aquí es donde una plantilla del manual (claves de i18n + números) se convierte
// en una ficha de texto plano: a partir de ese momento la ficha es del jugador y
// nada la vuelve a traducir.

import type { ShipComponent, ShipSectionKey, ShipSheet, ShipTotals } from "../types/ship";
import type { ShipBerths } from "../types/passenger";
import type { ShipTemplate, TemplateComponent, CrewEntry } from "../constants/shipTemplates";
import type { TranslationFunction } from "../types/i18n";
import { SHIP_SECTION_KEYS, emptySections } from "../constants/ship";
import { findPart } from "../constants/shipParts";

export const NO_BERTHS: ShipBerths = { high: 0, middle: 0, basic: 0, low: 0 };

/**
 * Identificador de fila. `crypto.randomUUID` no está en todos los contextos
 * (http:// en LAN, navegadores viejos), y una fila sin key rompe las listas de
 * React, así que hay un contador de respaldo.
 */
let fallbackId = 0;
export const componentId = (): string => {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `c${Date.now().toString(36)}-${(fallbackId++).toString(36)}`;
};

/** Rellena los huecos {n}/{j} de un patrón de i18n: "({n} toneladas/día)". */
const fill = (pattern: string, vars: Record<string, string | number> | undefined): string =>
  vars === undefined
    ? pattern
    : Object.entries(vars).reduce((acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)), pattern);

/** Nombre + coletilla + "×N" + nota, tal y como el manual escribe la línea. */
export const templateComponentLabel = (component: TemplateComponent, t: TranslationFunction): string => {
  const part = component.part === undefined ? undefined : findPart(component.part);
  const base = part ? t(part.labelKey) : component.key ? t(component.key) : "";
  const spec = component.spec === undefined ? "" : `${component.join ?? " "}${component.spec}`;
  const patterned = component.specKey === undefined ? "" : ` ${fill(t(component.specKey), component.specVars)}`;
  const count = component.count === undefined ? "" : ` ×${component.count}`;
  // Las notas que empiezan por coma ya traen su separador: "4 semanas, S-3" +
  // ", más lanzadera" no debe salir con un espacio suelto delante de la coma.
  const noteText = component.noteKey === undefined ? "" : t(component.noteKey);
  const note = noteText === "" ? "" : noteText.startsWith(",") ? noteText : ` ${noteText}`;
  return `${base}${spec}${patterned}${count}${note}`.trim();
};

const materialiseComponent = (component: TemplateComponent, t: TranslationFunction): ShipComponent => ({
  id: componentId(),
  label: templateComponentLabel(component, t),
  tons: component.tons ?? null,
  price: component.price ?? null,
});

/**
 * "Piloto, astronavegante, ingeniero ×2, médico".
 *
 * Solo el primer oficio va en mayúscula, como en el manual: los nombres de los
 * oficios están traducidos en mayúscula porque también se usan solos.
 */
export const crewLabel = (crew: CrewEntry[], t: TranslationFunction): string =>
  crew
    .map((entry, index) => {
      const role = t(`shipCrew_${entry.role}`);
      const name = index === 0 ? role : role.toLocaleLowerCase();
      return entry.count === undefined ? name : `${name} ×${entry.count}`;
    })
    .join(", ");

/** Ficha en blanco: mismas secciones, sin ninguna fila. */
export const emptyShip = (): ShipSheet => ({
  designation: "",
  templateId: null,
  tl: null,
  hullTons: null,
  hullPoints: null,
  crew: "",
  maintenance: null,
  purchasePrice: null,
  power: { basic: null, mDrive: null, jDrive: null, sensors: null, weapons: null },
  sections: emptySections(),
  capacity: { cargoTons: 0, berths: { ...NO_BERTHS } },
  notes: "",
});

/**
 * Carga un diseño del manual sobre una ficha.
 *
 * El nombre que el jugador le haya puesto a su nave y las plazas de pasajero se
 * conservan: lo primero porque es suyo y lo segundo porque el manual no reparte
 * los camarotes entre clases de pasaje, así que inventar un reparto sería
 * meterle reglas a una ficha que no las tiene.
 */
export const shipFromTemplate = (
  template: ShipTemplate,
  t: TranslationFunction,
  previous: ShipSheet,
): ShipSheet => {
  const sections = emptySections();
  for (const key of SHIP_SECTION_KEYS) {
    const rows = template.components[key];
    if (rows) sections[key] = rows.map(row => materialiseComponent(row, t));
  }

  return {
    designation: t(template.designationKey),
    templateId: template.id,
    tl: template.tl,
    hullTons: template.hullTons,
    hullPoints: template.hullPoints,
    crew: crewLabel(template.crew, t),
    maintenance: template.maintenance,
    purchasePrice: template.purchasePrice,
    power: { ...template.power },
    sections,
    capacity: { cargoTons: template.cargoTons, berths: { ...previous.capacity.berths } },
    notes: previous.notes,
  };
};

/** Fila nueva a partir de una pieza del catálogo, o en blanco si no hay pieza. */
export const componentFromPart = (partId: string | null, t: TranslationFunction): ShipComponent => {
  const part = partId === null ? undefined : findPart(partId);
  return {
    id: componentId(),
    label: part ? t(part.labelKey) : "",
    tons: part?.tons ?? null,
    price: part?.price ?? null,
  };
};

/**
 * Sumas del pie de la ficha. Son informativas: nadie las compara con el casco ni
 * con el precio de compra, que el jugador escribe a mano.
 */
export const shipTotals = (ship: ShipSheet): ShipTotals => {
  let tons = 0;
  let price = 0;
  for (const key of SHIP_SECTION_KEYS) {
    for (const component of ship.sections[key]) {
      tons += component.tons ?? 0;
      price += component.price ?? 0;
    }
  }
  // Las toneladas y los MCr del manual llegan a los dos decimales (22,85 t) y a
  // los cuatro (36,9405 MCr); redondear aquí evita el 0,30000000000000004 de la
  // suma en coma flotante.
  return { tons: Math.round(tons * 100) / 100, price: Math.round(price * 10000) / 10000 };
};

export const isShipEmpty = (ship: ShipSheet): boolean =>
  SHIP_SECTION_KEYS.every(key => ship.sections[key].length === 0);

// --- Type guard de localStorage ------------------------------------------

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === "object" && raw !== null && !Array.isArray(raw);

const isNullableNumber = (raw: unknown): raw is number | null =>
  raw === null || (typeof raw === "number" && Number.isFinite(raw));

const isComponent = (raw: unknown): raw is ShipComponent =>
  isRecord(raw) &&
  typeof raw.id === "string" &&
  typeof raw.label === "string" &&
  isNullableNumber(raw.tons) &&
  isNullableNumber(raw.price);

export const isShipBerths = (raw: unknown): raw is ShipBerths =>
  isRecord(raw) &&
  (["high", "middle", "basic", "low"] as const).every(
    cls => typeof raw[cls] === "number" && Number.isFinite(raw[cls]),
  );

export const isShipSheet = (raw: unknown): raw is ShipSheet => {
  if (!isRecord(raw)) return false;
  if (typeof raw.designation !== "string") return false;
  if (typeof raw.crew !== "string" || typeof raw.notes !== "string") return false;
  if (raw.templateId !== null && typeof raw.templateId !== "string") return false;
  if (!isNullableNumber(raw.tl) || !isNullableNumber(raw.hullTons)) return false;
  if (!isNullableNumber(raw.hullPoints) || !isNullableNumber(raw.maintenance)) return false;
  if (!isNullableNumber(raw.purchasePrice)) return false;

  const power = raw.power;
  if (!isRecord(power)) return false;
  if (!(["basic", "mDrive", "jDrive", "sensors", "weapons"] as const).every(k => isNullableNumber(power[k]))) return false;

  const capacity = raw.capacity;
  if (!isRecord(capacity)) return false;
  if (typeof capacity.cargoTons !== "number" || !Number.isFinite(capacity.cargoTons)) return false;
  if (!isShipBerths(capacity.berths)) return false;

  const sections = raw.sections;
  if (!isRecord(sections)) return false;
  // Una ficha guardada por una versión anterior puede no tener una sección que
  // se añadiese después: se acepta y useShip la rellena vacía.
  return SHIP_SECTION_KEYS.every((key: ShipSectionKey) => {
    const rows = sections[key];
    return rows === undefined || (Array.isArray(rows) && rows.every(isComponent));
  });
};
