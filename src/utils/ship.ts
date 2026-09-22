// Construcción y lectura de la ficha de "Mi nave".
//
// Aquí es donde una plantilla del manual (claves de i18n + números) se convierte
// en una ficha de texto plano: a partir de ese momento la ficha es del jugador y
// nada la vuelve a traducir.

import type { Fleet, ShipComponent, ShipPower, ShipSectionKey, ShipSheet, TurretBuild } from "../types/ship";
import type { CargoItem, CrewMember, PowerPlantType, SensorGrade } from "../types/ship";
import type { ShipBerths } from "../types/passenger";
import type { ShipTemplate, TemplateComponent, CrewEntry } from "../constants/shipTemplates";
import type { CrewRole } from "../constants/ship";
import { crewRoleKey } from "../constants/ship";
import type { TranslationFunction } from "../types/i18n";
import {
  POWER_BASIC_RATIO,
  POWER_DRIVE_RATIO,
  POWER_THRUST_ZERO,
  POWER_PLANTS,
  SENSOR_GRADES,
  SHIP_SECTION_KEYS,
  emptySections,
  hasQuantity,
  powerPerTon,
  sensorPower,
} from "../constants/ship";
import { findPart } from "../constants/shipParts";
import { findTemplate } from "../constants/shipTemplates";
import { BARBETTE_WEAPONS, TURRET_MOUNTS, TURRET_WEAPONS, findMount } from "../constants/turrets";
import { componentId } from "./id";
import { turretComponent } from "./turret";

export const NO_BERTHS: ShipBerths = { high: 0, middle: 0, basic: 0, low: 0 };

// El generador de ids vive aparte (utils/id.ts) y se reexporta desde aquí, que
// es donde lo busca quien ya lo usaba.
export { componentId };

/** Rellena los huecos {n}/{j} de un patrón de i18n: "({n} toneladas/día)". */
const fill = (pattern: string, vars: Record<string, string | number> | undefined): string =>
  vars === undefined
    ? pattern
    : Object.entries(vars).reduce((acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)), pattern);

/**
 * Nombre + coletilla + "×N" + nota, tal y como el manual escribe la línea.
 *
 * `withCount` en false deja el "×N" fuera: en las secciones que llevan columna
 * de cantidad (el alojamiento) ese número es una celda, y repetirlo dentro del
 * nombre sería escribirlo dos veces en la misma fila.
 */
export const templateComponentLabel = (
  component: TemplateComponent,
  t: TranslationFunction,
  withCount = true,
): string => {
  const part = component.part === undefined ? undefined : findPart(component.part);
  const base = part ? t(part.labelKey) : component.key ? t(component.key) : "";
  const spec = component.spec === undefined ? "" : `${component.join ?? " "}${component.spec}`;
  const patterned = component.specKey === undefined ? "" : ` ${fill(t(component.specKey), component.specVars)}`;
  const count = !withCount || component.count === undefined ? "" : ` ×${component.count}`;
  // Las notas que empiezan por coma ya traen su separador: "4 semanas, S-3" +
  // ", más lanzadera" no debe salir con un espacio suelto delante de la coma.
  const noteText = component.noteKey === undefined ? "" : t(component.noteKey);
  const note = noteText === "" ? "" : noteText.startsWith(",") ? noteText : ` ${noteText}`;
  return `${base}${spec}${patterned}${count}${note}`.trim();
};

/**
 * Las líneas de armamento de una plantilla, ya montadas.
 *
 * Lo que el manual imprime como "Torreta triple (láser de pulsos) ×2" son dos
 * torretas, así que salen dos filas, cada una con sus tres láseres puestos: el
 * arma que nombra la línea se repite en todos los huecos de la montura. Una
 * montura que el diseño trae vacía se queda vacía, y es el jugador quien decide
 * qué le monta —el manual también las vende así—.
 *
 * Las que no son monturas (la barbeta de partículas lo es; un arma suelta escrita
 * a mano no) siguen el camino de siempre y quedan como texto libre.
 */
const materialiseWeapon = (component: TemplateComponent, t: TranslationFunction): ShipComponent[] => {
  const part = component.part === undefined ? undefined : findPart(component.part);
  const recipe = part?.turret;
  if (recipe === undefined) return [materialiseComponent(component, t)];

  const slots = findMount(recipe.mount)?.slots ?? 1;
  const weapons = Array.from({ length: slots }, () => recipe.weapon);
  const build = { mount: recipe.mount, popUp: false, weapons };
  return Array.from({ length: component.count ?? 1 }, () => turretComponent(build, t));
};

const materialiseComponent = (
  component: TemplateComponent,
  t: TranslationFunction,
  section?: ShipSectionKey,
): ShipComponent => {
  const part = component.part === undefined ? undefined : findPart(component.part);
  // El alojamiento cuenta unidades: el "×10" que el manual mete en el nombre es
  // la columna de cantidad de esa fila, y las toneladas transcritas son las del
  // total, como en el resto de la ficha.
  const counts = section !== undefined && hasQuantity(section);
  return {
    id: componentId(),
    label: templateComponentLabel(component, t, !counts),
    qty: counts ? component.count ?? 1 : undefined,
    tons: component.tons ?? null,
    // Las toneladas se transcriben porque el manual las imprime línea a línea;
    // la potencia no se imprime, así que sale de la pieza por el "×N" de la
    // etiqueta, igual que el propio manual la sumaría.
    power: part?.power === undefined ? null : part.power * (component.count ?? 1),
  };
};

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
  id: componentId(),
  name: "",
  designation: "",
  templateId: null,
  tl: null,
  hullTons: null,
  hullPoints: null,
  crew: "",
  crewList: [],
  ratings: { thrust: null, reaction: false, jump: null, sensors: null, powerPlant: null },
  sections: emptySections(),
  capacity: { berths: { ...NO_BERTHS } },
  cargoHold: [],
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
    if (!rows) continue;
    sections[key] =
      key === "weapons"
        ? rows.flatMap(row => materialiseWeapon(row, t))
        : rows.map(row => materialiseComponent(row, t, key));
  }

  // Las líneas que en la ficha manda un selector —planta y sensores, igual que
  // los motores— llevan por nombre el de la opción elegida, y no el que traiga la
  // plantilla: el manual imprime "Fusión 60", pero ese 60 ahora se calcula.
  const setRowLabel = (key: ShipSectionKey, labelKey: string | undefined): void => {
    const row = sections[key][0];
    if (labelKey === undefined || row === undefined) return;
    sections[key][0] = { ...row, label: t(labelKey) };
  };
  setRowLabel("powerPlant", POWER_PLANTS.find(plant => plant.id === template.plant)?.labelKey);
  setRowLabel("sensors", SENSOR_GRADES.find(grade => grade.id === template.sensors)?.labelKey);

  return {
    // La identidad no la trae el diseño: la nave sigue siendo la misma nave.
    id: previous.id,
    name: previous.name,
    designation: t(template.designationKey),
    templateId: template.id,
    tl: template.tl,
    hullTons: template.hullTons,
    hullPoints: template.hullPoints,
    crew: crewLabel(template.crew, t),
    // La tripulación a bordo es de la partida, no del diseño: cargar otro casco
    // no despide a nadie.
    crewList: previous.crewList,
    ratings: {
      thrust: template.thrust,
      reaction: false,
      jump: template.jump,
      sensors: template.sensors,
      powerPlant: template.plant,
    },
    sections,
    capacity: { berths: { ...previous.capacity.berths } },
    // La carga es de la partida, no del diseño: un casco nuevo no viene con la
    // mercancía puesta, igual que no viene con la tripulación dentro.
    cargoHold: previous.cargoHold,
    notes: previous.notes,
  };
};

/**
 * Nave nueva, tal y como sale del formulario de creación: un nombre y un tipo.
 *
 * El tipo es lo único que no se podrá cambiar después, así que se decide aquí:
 * con diseño, la ficha arranca con todo lo que el manual imprime; sin él
 * (`template === null`), arranca en blanco y el jugador la escribe entera.
 */
export const newShip = (
  name: string,
  template: ShipTemplate | null,
  t: TranslationFunction,
): ShipSheet => {
  const blank = emptyShip();
  const sheet = template === null ? blank : shipFromTemplate(template, t, blank);
  return { ...sheet, name: name.trim() };
};

/**
 * El tipo de la nave, para enseñarlo donde no se puede elegir: el nombre del
 * diseño del manual, y si se creó personalizada, la designación que el jugador
 * haya escrito, o el rótulo de "personalizada" si tampoco hay eso.
 */
export const shipTypeName = (ship: ShipSheet, t: TranslationFunction): string => {
  const template = ship.templateId === null ? undefined : findTemplate(ship.templateId);
  if (template) return t(template.nameKey);
  return ship.designation.trim() === "" ? t("shipTypeCustom") : ship.designation.trim();
};

/** Tripulante nuevo: con el oficio ya escrito si se eligió uno del menú. */
export const crewMemberFromRole = (role: CrewRole | null, t: TranslationFunction): CrewMember => ({
  id: componentId(),
  name: "",
  role: role === null ? "" : t(crewRoleKey(role)),
  salary: null,
});

/**
 * La bodega que la nave TIENE: la suma de las filas de la sección de carga.
 *
 * No se guarda en ninguna parte, se suma. La bodega es una línea del bloque de
 * estadísticas como cualquier otra —el manual la imprime ahí, "Bodega 81 t"— y
 * tener además una cifra suelta significaba dos números para lo mismo: cambiar
 * uno dejaba al otro mintiendo, y nadie sabía cuál de los dos estaba leyendo.
 * Perfil, la pestaña de bodega y la calculadora de Carga leen todos de aquí.
 */
export const cargoCapacityTons = (ship: ShipSheet): number =>
  Math.round(ship.sections.cargo.reduce((sum, row) => sum + (row.tons ?? 0), 0) * 100) / 100;

/**
 * Escribir la bodega desde fuera de Detalles (la calculadora de Carga): corrige
 * la primera fila de carga, o crea una si la nave no tenía ninguna.
 *
 * La primera y no todas: si el jugador ha desglosado su bodega en varias líneas
 * —bodega, bodega refrigerada— repartir un total entre ellas sería inventarse su
 * reparto. Teclear ahí corrige la primera y las demás se quedan como estaban.
 */
export const withCargoTons = (
  rows: readonly ShipComponent[],
  tons: number,
  label: string,
): ShipComponent[] => {
  const [first, ...rest] = rows;
  if (first === undefined) return [{ id: componentId(), label, tons }];
  // Las otras filas ya suman lo suyo: la primera se lleva lo que falte. Nunca
  // por debajo de cero: pedir un total menor de lo que ya ocupan las otras no
  // puede dejar una línea con toneladas negativas, que es lo que parecería roto.
  const others = rest.reduce((sum, row) => sum + (row.tons ?? 0), 0);
  return [{ ...first, tons: Math.max(0, Math.round((tons - others) * 100) / 100) }, ...rest];
};

/** Bulto nuevo: en blanco, que lo que lleva la bodega solo lo sabe el jugador. */
export const newCargoItem = (): CargoItem => ({ id: componentId(), label: "", tons: null });

/** Lo que la bodega lleva ocupado. Los bultos sin tonelaje apuntado no suman. */
export const cargoUsedTons = (ship: ShipSheet): number =>
  Math.round(ship.cargoHold.reduce((sum, item) => sum + (item.tons ?? 0), 0) * 100) / 100;

/**
 * Fila nueva a partir de una pieza del catálogo, o en blanco si no hay pieza.
 *
 * En el alojamiento la fila nace con una unidad y las toneladas de una: el
 * catálogo las trae POR UNIDAD (camarote 4 t, litera fría 0,5 t), así que subir
 * la cantidad ya multiplica lo correcto.
 */
export const componentFromPart = (
  partId: string | null,
  t: TranslationFunction,
  section?: ShipSectionKey,
): ShipComponent => {
  const part = partId === null ? undefined : findPart(partId);
  return {
    id: componentId(),
    label: part ? t(part.labelKey) : "",
    qty: section !== undefined && hasQuantity(section) ? 1 : undefined,
    tons: part?.tons ?? null,
    power: part?.power ?? null,
  };
};

/**
 * Cambiar la cantidad de una línea multiplica sus toneladas.
 *
 * Lo que ocupa UNA unidad no se guarda en ninguna parte: sale de dividir el
 * total de la línea entre la cantidad que tenía, y esa cuenta siempre cuadra
 * porque las dos cifras están guardadas ("Camarote ×4 · 16 t" → 4 t cada uno).
 * Guardarlo aparte sería un tercer número que podría contradecir a los otros
 * dos, que es justo lo que el resto de la ficha evita.
 *
 * Es un cálculo al teclear, no una regla: el jugador puede corregir el total a
 * mano —el manual tiene diseños que no cuadran— y la siguiente cantidad respeta
 * su corrección en vez de devolverle el número de la tabla. Una línea sin
 * toneladas (el "—" del manual) se queda sin ellas.
 */
export const withQuantity = (component: ShipComponent, qty: number): Partial<ShipComponent> => {
  const previous = component.qty ?? 1;
  if (component.tons === null || previous <= 0) return { qty };
  return { qty, tons: Math.round((component.tons / previous) * qty * 100) / 100 };
};

/**
 * La cantidad de una ficha guardada antes de que existiera la columna.
 *
 * Esas filas traen el "×10" dentro del nombre, que es como el manual lo imprime
 * y como la ficha lo guardaba: se lo quitamos al nombre y pasa a ser la cantidad,
 * con lo que las toneladas por unidad vuelven a salir de la división. Sin esto,
 * "Camarote ×10 · 40 t" arrancaría con cantidad 1 y subirla a 2 daría 80 t.
 */
export const withCountFromLabel = (component: ShipComponent): ShipComponent => {
  if (component.qty !== undefined) return component;
  const match = /\s*×\s*(\d+)\s*$/.exec(component.label);
  if (match === null) return { ...component, qty: 1 };
  return { ...component, qty: Number(match[1]), label: component.label.slice(0, match.index) };
};

/**
 * Lo que cada sistema pide, en puntos de Potencia, y lo que la planta da.
 *
 *   Sistemas básicos = 20 % del tonelaje del casco.
 *   Motor de maniobra = 10 % del casco × Propulsión (× 0,25 con Propulsión 0).
 *   Motor de salto = 10 % del casco × número de salto.
 *   Sensores = lo que diga su grado en la tabla.
 *   Armas = lo que cada una declare en su línea.
 *
 * Se redondea hacia arriba porque es lo que hace el libro: el transbordador de
 * pasajeros (95 t, Propulsión 1) pide 9,5 y su ficha imprime 10.
 *
 * Un motor de reacción no pide Potencia, y un casco sin tonelaje da 0 en vez de
 * inventarse un número: la ficha no obliga a rellenar nada.
 */
export const shipPowerRequirements = (ship: ShipSheet): ShipPower => {
  const hull = ship.hullTons ?? 0;
  const { thrust, reaction, jump } = ship.ratings;

  const basic = Math.ceil(hull * POWER_BASIC_RATIO);
  const mDrive =
    reaction || thrust === null
      ? 0
      : Math.ceil(hull * POWER_DRIVE_RATIO * (thrust === 0 ? POWER_THRUST_ZERO : thrust));
  const jDrive = jump === null ? 0 : Math.ceil(hull * POWER_DRIVE_RATIO * jump);
  const sensors = sensorPower(ship.ratings.sensors);
  // Las armas y su munición son las únicas líneas que llevan potencia propia.
  const weapons = [...ship.sections.weapons, ...ship.sections.ammo].reduce(
    (sum, component) => sum + (component.power ?? 0),
    0,
  );

  // Lo que la planta produce: sus toneladas por la energía por tonelada de su
  // tipo. Se enseña al lado del total, sin comparar: la ficha no valida nada.
  const rate = powerPerTon(ship.ratings.powerPlant);
  const available = ship.sections.powerPlant.reduce((sum, row) => sum + (row.tons ?? 0) * rate, 0);

  // Sigue sin haber UN total —sumar los cinco supondría una nave con todo
  // encendido a la vez, que no existe—, pero sí las dos configuraciones con las
  // que se juega, que es contra lo que de verdad se comprueba si la planta llega:
  // en combate todo menos el salto, y para saltar el motor de salto y lo básico.
  const modes = {
    combat: basic + mDrive + sensors + weapons,
    jump: basic + jDrive,
  };

  return { basic, mDrive, jDrive, sensors, weapons, modes, available: Math.round(available) };
};


export const isShipEmpty = (ship: ShipSheet): boolean =>
  SHIP_SECTION_KEYS.every(key => ship.sections[key].length === 0);

// --- Type guard de localStorage ------------------------------------------

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === "object" && raw !== null && !Array.isArray(raw);

const isNullableNumber = (raw: unknown): raw is number | null =>
  raw === null || (typeof raw === "number" && Number.isFinite(raw));

const isCrewMember = (raw: unknown): raw is CrewMember =>
  isRecord(raw) &&
  typeof raw.id === "string" &&
  typeof raw.name === "string" &&
  typeof raw.role === "string" &&
  // El sueldo llegó después de las notas que sustituye: una ficha guardada antes
  // no lo trae, se acepta y la fila lo enseña vacío.
  (raw.salary === undefined || isNullableNumber(raw.salary));

const isCargoItem = (raw: unknown): raw is CargoItem =>
  isRecord(raw) && typeof raw.id === "string" && typeof raw.label === "string" && isNullableNumber(raw.tons);

const isPowerPlant = (raw: unknown): raw is PowerPlantType =>
  typeof raw === "string" && POWER_PLANTS.some(plant => plant.id === raw);

const isSensorGrade = (raw: unknown): raw is SensorGrade =>
  typeof raw === "string" && SENSOR_GRADES.some(grade => grade.id === raw);

/** Lo que el diálogo de armamento guardó en la fila; solo lo llevan las torretas. */
const isTurretBuild = (raw: unknown): raw is TurretBuild =>
  isRecord(raw) &&
  TURRET_MOUNTS.some(mount => mount.id === raw.mount) &&
  typeof raw.popUp === "boolean" &&
  Array.isArray(raw.weapons) &&
  raw.weapons.every(
    id =>
      id === null ||
      TURRET_WEAPONS.some(weapon => weapon.id === id) ||
      BARBETTE_WEAPONS.some(weapon => weapon.id === id),
  );

const isComponent = (raw: unknown): raw is ShipComponent =>
  isRecord(raw) &&
  typeof raw.id === "string" &&
  typeof raw.label === "string" &&
  isNullableNumber(raw.tons) &&
  // La cantidad solo la lleva el alojamiento, y se añadió después: una línea sin
  // ella es válida y `withCountFromLabel` se la saca del nombre al leerla.
  (raw.qty === undefined || (typeof raw.qty === "number" && Number.isFinite(raw.qty))) &&
  // La potencia se añadió después: una línea guardada sin ella es válida.
  (raw.power === undefined || isNullableNumber(raw.power)) &&
  // Y la torreta con el diálogo de armamento: una línea sin ella es texto libre.
  (raw.turret === undefined || isTurretBuild(raw.turret));

export const isShipBerths = (raw: unknown): raw is ShipBerths =>
  isRecord(raw) &&
  (["high", "middle", "basic", "low"] as const).every(
    cls => typeof raw[cls] === "number" && Number.isFinite(raw[cls]),
  );

export const isShipSheet = (raw: unknown): raw is ShipSheet => {
  if (!isRecord(raw)) return false;
  // Identidad y nombre llegaron con la flota: la ficha única que guardó una
  // versión anterior no los trae, se acepta y useShip los rellena al migrarla.
  if (raw.id !== undefined && typeof raw.id !== "string") return false;
  if (raw.name !== undefined && typeof raw.name !== "string") return false;
  if (typeof raw.designation !== "string") return false;
  if (typeof raw.crew !== "string" || typeof raw.notes !== "string") return false;
  // Una ficha guardada antes de que existiera la pestaña de tripulación no trae
  // la lista; se acepta y useShip la rellena vacía.
  if (raw.crewList !== undefined && !(Array.isArray(raw.crewList) && raw.crewList.every(isCrewMember))) return false;
  // La bodega llegó con su propia pestaña: una ficha anterior no la trae.
  if (raw.cargoHold !== undefined && !(Array.isArray(raw.cargoHold) && raw.cargoHold.every(isCargoItem))) {
    return false;
  }
  if (raw.templateId !== null && typeof raw.templateId !== "string") return false;
  if (!isNullableNumber(raw.tl) || !isNullableNumber(raw.hullTons)) return false;
  if (!isNullableNumber(raw.hullPoints)) return false;

  // Una ficha guardada antes de que la potencia se calculase trae el recuadro
  // `power` escrito a mano y no trae `ratings`: se acepta, y useShip la rellena
  // con las calificaciones en blanco. El viejo `power` se queda ahí, ignorado.
  const ratings = raw.ratings;
  if (ratings !== undefined) {
    if (!isRecord(ratings)) return false;
    if (!isNullableNumber(ratings.thrust) || !isNullableNumber(ratings.jump)) return false;
    if (typeof ratings.reaction !== "boolean") return false;
    if (ratings.sensors !== null && !isSensorGrade(ratings.sensors)) return false;
    if (ratings.powerPlant !== undefined && ratings.powerPlant !== null && !isPowerPlant(ratings.powerPlant)) {
      return false;
    }
  }

  const capacity = raw.capacity;
  if (!isRecord(capacity)) return false;
  // `cargoTons` estuvo aquí y ahora sale de las filas de carga: una ficha
  // guardada antes lo trae, se ignora y `normalise` lo pasa a su fila.
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

export const isFleet = (raw: unknown): raw is Fleet =>
  isRecord(raw) &&
  Array.isArray(raw.ships) &&
  raw.ships.every(isShipSheet) &&
  (raw.activeId === null || typeof raw.activeId === "string");
