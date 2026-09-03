// Estructura de la ficha de "Mi nave": qué secciones tiene y en qué orden.

import type { ShipSectionKey, ShipSheet } from "../types/ship";

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
 * Las 17 secciones repartidas en cuatro tarjetas.
 *
 * El manual las imprime como una sola tabla larga, que en pantalla se convierte
 * en 17 bloques imposibles de recorrer. Agruparlas por tema deja el casco y los
 * motores juntos, y el armamento donde el jugador lo va a buscar.
 */
export const SHIP_SECTION_GROUPS: readonly { titleKey: string; sections: readonly ShipSectionKey[] }[] = [
  { titleKey: "shipGroupHullDrives", sections: ["hull", "armour", "mDrive", "jDrive", "powerPlant", "fuel"] },
  { titleKey: "shipGroupSystems", sections: ["bridge", "computer", "sensors", "systems"] },
  { titleKey: "shipGroupSoftware", sections: ["software"] },
  { titleKey: "shipGroupWeapons", sections: ["weapons", "ammo"] },
  { titleKey: "shipGroupAccommodation", sections: ["craft", "staterooms", "commonAreas", "cargo"] },
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
