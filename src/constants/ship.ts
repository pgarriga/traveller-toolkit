// Estructura de la ficha de "Mi nave": qué secciones tiene y en qué orden.

import type { PowerPlantType, SensorGrade, ShipComponent, ShipSectionKey, ShipSheet } from "../types/ship";

/** Cada oficio que el manual lista en el recuadro "Tripulación". */
export type CrewRole =
  | "captain"
  | "pilot"
  | "coPilot"
  | "astrogator"
  | "engineer"
  | "mechanic"
  | "medic"
  | "gunner"
  | "marine"
  | "administrator"
  | "officer"
  | "steward";

/**
 * Orden del menú de "añadir tripulante": el puente primero, luego máquinas,
 * luego el resto, que es como el manual escribe las listas de tripulación.
 */
export const CREW_ROLES: readonly CrewRole[] = [
  "captain",
  "pilot",
  "coPilot",
  "astrogator",
  "engineer",
  "mechanic",
  "medic",
  "steward",
  "gunner",
  "marine",
  "administrator",
  "officer",
];

export const crewRoleKey = (role: CrewRole): string => `shipCrew_${role}`;

/**
 * Las pestañas de la ficha, en el orden en que se leen: qué nave es, de qué
 * está hecha, quién va dentro y qué lleva encima.
 */
export const SHIP_TABS = [
  { id: "profile", labelKey: "shipTabProfile" },
  { id: "details", labelKey: "shipTabDetails" },
  { id: "crew", labelKey: "shipTabCrew" },
  { id: "cargo", labelKey: "shipTabCargo" },
] as const;

export type ShipTabId = (typeof SHIP_TABS)[number]["id"];

/** Las filas del bloque de estadísticas, en el orden en que las imprime el manual. */
export const SHIP_SECTIONS: readonly { key: ShipSectionKey; titleKey: string }[] = [
  { key: "hull", titleKey: "shipSecHull" },
  { key: "armour", titleKey: "shipSecArmour" },
  { key: "mDrive", titleKey: "shipSecMDrive" },
  { key: "jDrive", titleKey: "shipSecJDrive" },
  { key: "powerPlant", titleKey: "shipSecPowerPlant" },
  { key: "fuel", titleKey: "shipSecFuel" },
  { key: "bridge", titleKey: "shipSecBridge" },
  { key: "computer", titleKey: "shipSecComputer" },
  { key: "sensors", titleKey: "shipSecSensors" },
  { key: "weapons", titleKey: "shipSecWeapons" },
  { key: "ammo", titleKey: "shipSecAmmo" },
  { key: "craft", titleKey: "shipSecCraft" },
  { key: "systems", titleKey: "shipSecSystems" },
  { key: "software", titleKey: "shipSecSoftware" },
  { key: "staterooms", titleKey: "shipSecStaterooms" },
  { key: "commonAreas", titleKey: "shipSecCommonAreas" },
  { key: "cargo", titleKey: "shipSecCargo" },
];

export const SHIP_SECTION_KEYS: readonly ShipSectionKey[] = SHIP_SECTIONS.map(s => s.key);

/**
 * Las 17 secciones repartidas en diez tarjetas.
 *
 * El manual las imprime como una sola tabla larga, que en pantalla se convierte
 * en 17 bloques imposibles de recorrer. Agruparlas por tema pone el armamento
 * donde el jugador lo va a buscar.
 *
 * El casco, los motores y la planta de energía van en tarjetas distintas aunque
 * el manual los imprima seguidos: son las tres cosas que se miran por separado
 * —cuánta nave hay, cuánto se mueve y de qué vive— y el casco además lleva
 * encima el tonelaje de la nave entera, que no es una fila más.
 */
export const SHIP_SECTION_GROUPS: readonly { titleKey: string; sections: readonly ShipSectionKey[] }[] = [
  { titleKey: "shipGroupHull", sections: ["hull", "armour"] },
  { titleKey: "shipGroupDrives", sections: ["mDrive", "jDrive"] },
  { titleKey: "shipGroupPower", sections: ["powerPlant", "fuel"] },
  // Los sistemas, en dos tarjetas. Las tres primeras son el juego que TODA nave
  // lleva —puente, computadora y sensores, una de cada, sin menú de añadir— y la
  // otra es justo la sección abierta: esclusas, talleres, laboratorios, lo que
  // este casco lleve de más. Juntas, la lista fija y la lista que crece se leían
  // como una sola y no se veía dónde se podía añadir algo.
  { titleKey: "shipGroupCoreSystems", sections: ["bridge", "computer", "sensors"] },
  { titleKey: "shipGroupOtherSystems", sections: ["systems"] },
  { titleKey: "shipGroupSoftware", sections: ["software"] },
  { titleKey: "shipGroupWeapons", sections: ["weapons", "ammo"] },
  // Tres tarjetas, no una: dónde duerme la gente, dónde va la mercancía y lo que
  // la nave lleva encima (lanzaderas, cápsulas) son tres cosas distintas, y en
  // una sola tarjeta había que leerse la lista entera para encontrar la carga.
  //
  // Las naves auxiliares van al final, debajo de la bodega: son naves aparte, no
  // un espacio de esta, y la mayoría de los diseños del manual no llevan ninguna.
  { titleKey: "shipGroupAccommodation", sections: ["staterooms", "commonAreas"] },
  { titleKey: "shipGroupCargo", sections: ["cargo"] },
  { titleKey: "shipGroupCraft", sections: ["craft"] },
];

/** Título de una sección, para no repetir el find por toda la vista. */
export const sectionTitleKey = (key: ShipSectionKey): string =>
  SHIP_SECTIONS.find(section => section.key === key)?.titleKey ?? key;

/**
 * Un juego de secciones vacías. Se escribe entero en lugar de derivarlo de
 * SHIP_SECTION_KEYS con Object.fromEntries para que TypeScript siga exigiendo
 * que estén todas: añadir una clave a ShipSectionKey debe romper aquí.
 */
export const emptySections = (): ShipSheet["sections"] => ({
  hull: [],
  armour: [],
  mDrive: [],
  jDrive: [],
  powerPlant: [],
  fuel: [],
  bridge: [],
  computer: [],
  sensors: [],
  weapons: [],
  ammo: [],
  craft: [],
  systems: [],
  software: [],
  staterooms: [],
  commonAreas: [],
  cargo: [],
});

/**
 * Secciones de las que la nave lleva un solo juego: casco, blindaje, motores,
 * tanques, puente, computadora y sensores. Se corrigen, no se duplican — una
 * nave no monta un segundo puente al lado del que ya tiene.
 *
 * Lo que va aparte es "sistemas", que es justo donde el manual mete lo que sí se
 * añade de uno en uno (esclusas, talleres, laboratorios...).
 *
 * "Fija" es la fila, no su número: dos diseños del manual (Gazelle y Sloan)
 * imprimen el casco en dos líneas —estándar y reforzado—, así que la ficha
 * enseña las que haya. Lo que desaparece es el menú de "añadir"; el catálogo
 * sigue a mano como sugerencias del propio campo de texto.
 */
export const FIXED_SECTIONS: readonly ShipSectionKey[] = [
  "hull",
  "armour",
  "mDrive",
  "jDrive",
  "powerPlant",
  "fuel",
  "bridge",
  "computer",
  "sensors",
];

export const isFixedSection = (key: ShipSectionKey): boolean => FIXED_SECTIONS.includes(key);

/**
 * Si una sección tiene alguna fila que de verdad se pueda quitar.
 *
 * En una sección fija hace falta que haya más de una: la última no se borra,
 * porque dejaría al jugador sin dónde escribir el casco. En las demás basta con
 * que haya alguna. De esto depende a qué tarjetas llega el modo "eliminar
 * filas": las que no pueden perder ninguna línea no se encogen para hacerle
 * sitio a una papelera que no va a salir.
 */
export const sectionCanRemove = (key: ShipSectionKey, rows: readonly ShipComponent[]): boolean =>
  isFixedSection(key) ? rows.length > 1 : rows.length > 0;

/**
 * Las secciones que cuentan unidades: el alojamiento.
 *
 * El manual las imprime ya multiplicadas ("Camarote ×10 · 40 t") porque son
 * piezas iguales y repetidas —un camarote son 4 t, una litera fría 0,5 t—, y en
 * la mesa lo que cambia es cuántas hay: embarcar seis pasajeros más no es
 * reescribir un tonelaje, es subir una cuenta. El resto de la ficha no lleva
 * cantidad: allí el "×2" es parte del nombre y las toneladas son las del total.
 */
export const QTY_SECTIONS: readonly ShipSectionKey[] = ["staterooms", "commonAreas"];

export const hasQuantity = (key: ShipSectionKey): boolean => QTY_SECTIONS.includes(key);

/**
 * Cuántas tarjetas van en la columna izquierda de la pestaña Detalles. Se
 * reparten a mano —no con `column-count`, que parte una tarjeta por la mitad—
 * y el corte cae donde las dos columnas quedan a la misma altura.
 *
 * Son cuatro de diez, y no la mitad de cada: las de la izquierda son las del
 * juego fijo —una fila por sección, siempre— y las de la derecha las que crecen
 * con lo que el jugador añada. Seis tarjetas cortas pesan aquí lo mismo que
 * cuatro con filas de sobra.
 */
export const SHIP_GROUPS_LEFT_COLUMN = 4;

// --- Necesidades de energía (Manual básico, "Necesidades de energía") --------

/** Sistemas básicos: el 20 % del tonelaje total del casco. */
export const POWER_BASIC_RATIO = 0.2;

/** Motores: el 10 % del casco por cada punto de Propulsión o de salto. */
export const POWER_DRIVE_RATIO = 0.1;

/** "Multiplica por 0,25 si la nave tiene Propulsión 0". */
export const POWER_THRUST_ZERO = 0.25;

/**
 * La tabla de sensores del manual. La suite de contramedidas no es un grado de
 * esa tabla: su potencia (5) sale de la línea impresa de la nave de defensa
 * del sistema, que es la única de los 24 diseños que la monta.
 */
export const SENSOR_GRADES: readonly { id: SensorGrade; labelKey: string; power: number }[] = [
  { id: "basic", labelKey: "shipSensorBasic", power: 0 },
  { id: "civilian", labelKey: "shipSensorCivilian", power: 1 },
  { id: "military", labelKey: "shipSensorMilitary", power: 2 },
  { id: "improved", labelKey: "shipSensorImproved", power: 4 },
  { id: "advanced", labelKey: "shipSensorAdvanced", power: 6 },
  { id: "countermeasures", labelKey: "shipSensorCountermeasures", power: 5 },
];

export const sensorPower = (grade: SensorGrade | null): number =>
  SENSOR_GRADES.find(g => g.id === grade)?.power ?? 0;

// --- Potencial de propulsión y de salto (tablas del manual) ------------------
//
// Cada puntuación cuesta un porcentaje del casco y pide un NT mínimo. Los dos
// desplegables de los motores salen de aquí, así que la lista de opciones es
// exactamente la de la tabla: hasta Propulsión 11 y hasta salto 9.

interface DriveRating {
  /** Fracción del tonelaje del casco que ocupa el motor. */
  hullRatio: number;
  /** Nivel tecnológico mínimo, para enseñarlo al lado de la opción. */
  tl: number;
}

export const M_DRIVE_RATINGS: Readonly<Record<number, DriveRating>> = {
  0: { hullRatio: 0.005, tl: 7 },
  1: { hullRatio: 0.01, tl: 9 },
  2: { hullRatio: 0.02, tl: 10 },
  3: { hullRatio: 0.03, tl: 10 },
  4: { hullRatio: 0.04, tl: 11 },
  5: { hullRatio: 0.05, tl: 11 },
  6: { hullRatio: 0.06, tl: 12 },
  7: { hullRatio: 0.07, tl: 12 },
  8: { hullRatio: 0.08, tl: 13 },
  9: { hullRatio: 0.09, tl: 13 },
  10: { hullRatio: 0.10, tl: 16 },
  11: { hullRatio: 0.11, tl: 17 },
};

export const J_DRIVE_RATINGS: Readonly<Record<number, DriveRating>> = {
  1: { hullRatio: 0.025, tl: 9 },
  2: { hullRatio: 0.05, tl: 11 },
  3: { hullRatio: 0.075, tl: 12 },
  4: { hullRatio: 0.10, tl: 13 },
  5: { hullRatio: 0.125, tl: 14 },
  6: { hullRatio: 0.15, tl: 15 },
  7: { hullRatio: 0.175, tl: 16 },
  8: { hullRatio: 0.20, tl: 17 },
  9: { hullRatio: 0.225, tl: 18 },
};

/**
 * Las cinco toneladas fijas del motor de salto, que la tabla de porcentajes no
 * incluye. No salen de la tabla: salen de las fichas impresas, donde doce de los
 * trece diseños con salto están exactamente cinco toneladas por encima de su
 * porcentaje —la scout son 5 % de 100 t más 5, y su ficha imprime 10—. El que
 * falta es el donosev, cuya línea de motores ya se contradice a sí misma.
 */
export const J_DRIVE_BASE_TONS = 5;

export const THRUST_OPTIONS: readonly number[] = Object.keys(M_DRIVE_RATINGS).map(Number);
export const JUMP_OPTIONS: readonly number[] = Object.keys(J_DRIVE_RATINGS).map(Number);

/** Toneladas del motor de maniobra para una Propulsión y un casco dados. */
export const mDriveTons = (thrust: number, hullTons: number): number =>
  round2(hullTons * (M_DRIVE_RATINGS[thrust]?.hullRatio ?? 0));

/** Toneladas del motor de salto: el porcentaje del casco más las cinco fijas. */
export const jDriveTons = (jump: number, hullTons: number): number =>
  round2(hullTons * (J_DRIVE_RATINGS[jump]?.hullRatio ?? 0) + J_DRIVE_BASE_TONS);

/** Las fichas del manual llegan a dos decimales (2,85 t); la coma flotante, no. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * La tabla de plantas de energía: energía POR TONELADA de planta. Multiplicada
 * por las toneladas de la fila da lo que la nave produce, que es como el manual
 * imprime esa línea ("Fusión 60" son 4 t a 15 por tonelada).
 */
export const POWER_PLANTS: readonly { id: PowerPlantType; labelKey: string; powerPerTon: number }[] = [
  { id: "fission", labelKey: "shipPlantFission", powerPerTon: 8 },
  { id: "chemical", labelKey: "shipPlantChemical", powerPerTon: 5 },
  { id: "fusion8", labelKey: "shipPlantFusion8", powerPerTon: 10 },
  { id: "fusion12", labelKey: "shipPlantFusion12", powerPerTon: 15 },
  { id: "fusion15", labelKey: "shipPlantFusion15", powerPerTon: 20 },
  { id: "antimatter", labelKey: "shipPlantAntimatter", powerPerTon: 100 },
];

export const powerPerTon = (type: PowerPlantType | null): number =>
  POWER_PLANTS.find(plant => plant.id === type)?.powerPerTon ?? 0;
