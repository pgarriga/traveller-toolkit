// Los 24 diseños de "Naves espaciales comunes" del manual básico (pp. 189-228),
// que "Mi nave" ofrece como punto de partida de una ficha.
//
// Cada plantilla se guarda como referencias al catálogo (constants/shipParts.ts)
// más los números impresos en el libro, y se convierte en una ficha de texto
// plano al cargarla (utils/ship.ts). Por eso aquí no hay ni una etiqueta escrita
// a mano: todo pasa por una clave de i18n y la plantilla se materializa en el
// idioma que el jugador tenga puesto.
//
// Las toneladas y el precio son los de la línea completa tal y como los imprime
// el manual (una fila "×10" ya trae el total de las diez), y null es su "—".
//
// Se transcribe lo que el libro imprime, no lo que debería sumar. Varios bloques
// no cuadran consigo mismos —la nave safari deja el precio del puente en "—", el
// crucero mercenario suma 14 MCr más de lo que dice su precio de compra, el caza
// ligero deja 0,4 t sin asignar—, y "corregirlos" aquí haría que la ficha
// dejara de parecerse a la página del manual que el jugador tiene delante. La
// ficha no calcula nada, así que la contradicción es visible y suya. Las únicas
// enmiendas son las de los datos que la extracción del PDF perdió o invirtió, y
// van comentadas una a una allí donde están.

import type { ShipPartId } from "./shipParts";

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

export interface CrewEntry {
  role: CrewRole;
  count?: number;
}

export interface TemplateComponent {
  /** Pieza del catálogo. Excluyente con `key`. */
  part?: ShipPartId;
  /** Clave de i18n suelta, para las etiquetas que solo aparecen en una nave. */
  key?: string;
  /** Se pega detrás del nombre de la pieza: "2" en "Propulsión 2". */
  spec?: string;
  /** Separador entre nombre y `spec`. Por defecto un espacio; "/" y "-" para computadora y salto. */
  join?: string;
  /** Coletilla traducible con huecos {n}/{j}: "(40 toneladas/día)". */
  specKey?: string;
  specVars?: Record<string, string | number>;
  /** Nota final traducible: "(tamaño reducido ×2)". */
  noteKey?: string;
  /** El "×N" del manual, que se escribe al final de la etiqueta. */
  count?: number;
  tons?: number | null;
  price?: number | null;
}

export interface ShipTemplate {
  id: string;
  /** Nombre del diseño, vía i18n. No es el nombre que el jugador le pondrá a SU nave. */
  nameKey: string;
  /** "Tipo: S", "Clase: Gacela", "Nave pequeña". */
  designationKey: string;
  tl: number;
  hullTons: number;
  hullPoints: number;
  /** Cr/mes. */
  maintenance: number;
  /** MCr. */
  purchasePrice: number;
  crew: CrewEntry[];
  power: { basic: number | null; mDrive: number | null; jDrive: number | null; sensors: number | null; weapons: number | null };
  /** Toneladas de la fila "Carga": lo único de la plantilla que leen las calculadoras. */
  cargoTons: number;
  components: Partial<Record<string, TemplateComponent[]>>;
}

// Atajos para que la tabla de abajo se lea como el libro y no como código.
const sw = (part: ShipPartId, spec?: string, price?: number | null): TemplateComponent =>
  spec === undefined ? { part, price: price ?? null } : { part, join: "/", spec, price: price ?? null };
const stdSoftware: TemplateComponent[] = [sw("swLibrary"), sw("swManoeuvre"), sw("swIntellect")];
const tonsPerDay = (n: number, tons: number, price: number): TemplateComponent =>
  ({ part: "fuelProcessor", specKey: "shipSpecTonsPerDay", specVars: { n }, tons, price });
const dock = (n: number, tons: number | null, price: number | null, count?: number): TemplateComponent =>
  ({ part: "dockingSpace", specKey: "shipSpecTons", specVars: { n }, tons, price, count });
// La fila de combustible no lleva nombre de pieza: en el manual esa celda ya es
// la descripción ("12 semanas de operación, S-2") y el encabezado de la fila es
// el nombre de la sección.
const fuel = (weeks: number, jump: number | null, tons: number): TemplateComponent =>
  jump === null
    ? { specKey: "shipSpecWeeks", specVars: { n: weeks }, tons }
    : { specKey: "shipSpecWeeksJump", specVars: { n: weeks, j: jump }, tons };

export const SHIP_TEMPLATES: ShipTemplate[] = [
  {
    id: "scout",
    nameKey: "shipTplScout",
    designationKey: "shipTplTypeS",
    tl: 12, hullTons: 100, hullPoints: 40, maintenance: 3078, purchasePrice: 36.9405, cargoTons: 12,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }],
    power: { basic: 20, mDrive: 20, jDrive: 20, sensors: 2, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 6 }],
      armour: [{ part: "armourCrystaliron", spec: "4", tons: 5, price: 1.2 }],
      mDrive: [{ part: "mDrive", spec: "2", tons: 2, price: 4 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 10, price: 15 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "60", tons: 4, price: 4 }],
      fuel: [fuel(12, 2, 23)],
      bridge: [{ part: "bridgeStandard", tons: 10, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5bis", price: 0.045 }],
      sensors: [{ part: "sensorsMilitary", tons: 2, price: 4.1 }],
      weapons: [{ part: "turretDouble", tons: 1, price: 0.5 }],
      systems: [
        { part: "fuelScoops" },
        tonsPerDay(40, 2, 0.1),
        { part: "probeDrones", count: 10, tons: 2, price: 1 },
        dock(4, 5, 1.25),
        { part: "repulsor", price: 0.25 },
        { part: "workshop", tons: 6, price: 0.9 },
      ],
      software: [sw("swJumpControl", "2", 0.2), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 4, tons: 16, price: 2 }],
      cargo: [{ part: "cargoHold", tons: 12 }],
    },
  },
  {
    id: "seeker",
    nameKey: "shipTplSeeker",
    designationKey: "shipTplTypeJ",
    tl: 12, hullTons: 100, hullPoints: 40, maintenance: 2804, purchasePrice: 33.8355, cargoTons: 26,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }],
    power: { basic: 20, mDrive: 20, jDrive: 20, sensors: 2, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 6 }],
      armour: [{ part: "armourCrystaliron", spec: "4", tons: 5, price: 1.2 }],
      mDrive: [{ part: "mDrive", spec: "2", tons: 2, price: 4 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 10, price: 15 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "60", tons: 4, price: 4 }],
      fuel: [fuel(4, 2, 21)],
      bridge: [{ part: "bridgeStandard", tons: 10, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5bis", price: 0.045 }],
      sensors: [{ part: "sensorsMilitary", tons: 2, price: 4.1 }],
      weapons: [{ part: "turretDouble", tons: 1, price: 0.5 }],
      systems: [
        { part: "fuelScoops" },
        tonsPerDay(20, 1, 0.05),
        { part: "miningDrones", count: 5, tons: 10, price: 1 },
      ],
      software: [sw("swJumpControl", "2", 0.2), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 2, tons: 8, price: 1 }],
      cargo: [{ part: "cargoHold", tons: 26 }],
    },
  },
  {
    id: "freeTrader",
    nameKey: "shipTplFreeTrader",
    designationKey: "shipTplTypeA",
    tl: 12, hullTons: 200, hullPoints: 80, maintenance: 3861, purchasePrice: 46.332, cargoTons: 81,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    power: { basic: 40, mDrive: 20, jDrive: 20, sensors: 1, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 12 }],
      armour: [{ part: "armourCrystaliron", spec: "2", tons: 5, price: 1.2 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 2, price: 4 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "1", tons: 10, price: 15 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "75", tons: 5, price: 5 }],
      fuel: [fuel(4, 1, 21)],
      bridge: [{ part: "bridgeStandard", tons: 10, price: 1 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsCivilian", tons: 1, price: 3 }],
      systems: [{ part: "fuelScoops" }, tonsPerDay(20, 1, 0.05), { part: "cargoCrane", tons: 3, price: 3 }],
      software: [sw("swJumpControl", "1", 0.1), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 10, tons: 40, price: 5 },
        { part: "lowBerth", count: 20, tons: 10, price: 1 },
      ],
      commonAreas: [{ part: "commonArea", tons: 11, price: 1.1 }],
      cargo: [{ part: "cargoHold", tons: 81 }],
    },
  },
  {
    id: "farTrader",
    nameKey: "shipTplFarTrader",
    designationKey: "shipTplTypeA2",
    tl: 12, hullTons: 200, hullPoints: 80, maintenance: 4443, purchasePrice: 53.3205, cargoTons: 63,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    power: { basic: 40, mDrive: 20, jDrive: 40, sensors: 1, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 12 }],
      armour: [{ part: "armourCrystaliron", spec: "2", tons: 5, price: 1.2 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 2, price: 4 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 15, price: 22.5 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "90", tons: 6, price: 6 }],
      fuel: [fuel(4, 2, 41)],
      bridge: [{ part: "bridgeStandard", tons: 10, price: 1 }],
      computer: [{ part: "computer", join: "/", spec: "5bis", price: 0.045 }],
      sensors: [{ part: "sensorsCivilian", tons: 1, price: 3 }],
      systems: [{ part: "fuelScoops" }, tonsPerDay(40, 2, 0.1), { part: "cargoCrane", tons: 3, price: 3 }],
      software: [sw("swJumpControl", "2", 0.2), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 10, tons: 40, price: 5 },
        { part: "lowBerth", count: 6, tons: 3, price: 0.3 },
      ],
      commonAreas: [{ part: "commonArea", tons: 9, price: 0.9 }],
      cargo: [{ part: "cargoHold", tons: 63 }],
    },
  },
  {
    id: "safari",
    nameKey: "shipTplSafari",
    designationKey: "shipTplTypeK",
    tl: 12, hullTons: 200, hullPoints: 80, maintenance: 5128, purchasePrice: 61.5303, cargoTons: 14,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    power: { basic: 40, mDrive: 20, jDrive: 40, sensors: 1, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 12 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 2, price: 4 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 15, price: 22.5 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "105", tons: 7, price: 7 }],
      fuel: [fuel(4, 2, 41)],
      bridge: [{ part: "bridgeStandard", tons: 10 }],
      computer: [{ part: "computer", join: "/", spec: "5bis", price: 0.045 }],
      sensors: [{ part: "sensorsCivilian", tons: 1, price: 3 }],
      weapons: [{ part: "turretDouble", tons: 1, price: 0.5 }],
      craft: [
        dock(20, 22, 5.5),
        { part: "craftShuttle", price: 2.367 },
        dock(4, 5, 1.25),
        { part: "repulsor", price: 0.25 },
        { part: "craftAirRaft", noteKey: "shipNoteInShuttle", price: 0.155 },
      ],
      systems: [
        { part: "fuelScoops" },
        tonsPerDay(40, 2, 0.1),
        { part: "multiEnvSpace", tons: 8, price: 0.5 },
        { part: "multiEnvSpace", tons: 8, price: 0.5 },
      ],
      software: [sw("swJumpControl", "2", 0.2), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 11, tons: 44, price: 5.5 }],
      commonAreas: [
        { part: "commonArea", tons: 13, price: 1.3 },
        { part: "trophyRoom", tons: 7, price: 0.7 },
      ],
      cargo: [{ part: "cargoHold", tons: 14 }],
    },
  },
  {
    id: "sdb",
    nameKey: "shipTplSdb",
    designationKey: "shipTplSmallCraftNA",
    tl: 15, hullTons: 200, hullPoints: 88, maintenance: 11184, purchasePrice: 134.217, cargoTons: 22.85,
    crew: [
      { role: "captain" }, { role: "pilot", count: 3 }, { role: "engineer" }, { role: "mechanic" },
      { role: "medic" }, { role: "gunner", count: 4 }, { role: "administrator" }, { role: "officer" },
    ],
    power: { basic: 40, mDrive: 180, jDrive: null, sensors: 5, weapons: null },
    components: {
      hull: [{ part: "hullStandard", price: 10 }, { part: "hullReinforced", price: 5 }],
      armour: [{ part: "armourCrystaliron", spec: "13", tons: 33, price: 9.75 }],
      mDrive: [{ part: "mDrive", spec: "9", tons: 18, price: 36 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "240", tons: 16, price: 16 }],
      fuel: [fuel(12, null, 6)],
      bridge: [{ part: "bridgeStandard", tons: 10, price: 1 }],
      computer: [{ part: "computer", join: "/", spec: "35", price: 30 }],
      sensors: [{ part: "sensorsCountermeasures", tons: 5, price: 12.3 }],
      weapons: [
        { part: "turretTripleBeamLaser", tons: 1, price: 2.5 },
        { part: "turretTripleMissile", tons: 1, price: 3.25 },
      ],
      ammo: [{ part: "missileMagazine", specKey: "shipSpecMissiles", specVars: { n: 144 }, tons: 12 }],
      systems: [
        { part: "repairDrones", tons: 2, price: 0.4 },
        { part: "fuelScoops", price: 1 },
        tonsPerDay(20, 1, 0.05),
        { part: "medicalBay", tons: 4, price: 2 },
      ],
      software: [
        sw("swAutoRepair", "1", 5), sw("swEvade", "2", 2), sw("swFireControl", "2", 4), ...stdSoftware,
      ],
      staterooms: [{ part: "stateroomStandard", count: 15, tons: 60, price: 7.5 }],
      commonAreas: [{ part: "commonArea", tons: 4, price: 0.4 }],
      cargo: [{ part: "cargoHold", tons: 22.85 }],
    },
  },
  {
    id: "yacht",
    nameKey: "shipTplYacht",
    designationKey: "shipTplTypeY",
    tl: 12, hullTons: 200, hullPoints: 80, maintenance: 5584, purchasePrice: 67.007, cargoTons: 21,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    power: { basic: 40, mDrive: 20, jDrive: 20, sensors: 1, weapons: null },
    components: {
      hull: [{ part: "hullStandard", price: 10 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 2, price: 4 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "1", tons: 10, price: 15 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "90", tons: 6, price: 6 }],
      fuel: [fuel(8, 1, 22)],
      bridge: [{ part: "bridgeStandard", tons: 10, price: 1 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsCivilian", tons: 1, price: 3 }],
      craft: [
        dock(4, 5, 1.25),
        { part: "repulsor", price: 0.25 },
        dock(30, 33, 8.25),
        { part: "craftShipsBoat", price: 7.272 },
        { part: "craftAirRaft", noteKey: "shipNoteInShipsBoat", price: 0.155 },
      ],
      software: [sw("swJumpControl", "1", 0.1), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 12, tons: 48, price: 6 },
        { part: "stateroomLuxury", count: 1, tons: 10, price: 1.5 },
      ],
      commonAreas: [{ part: "commonArea", tons: 32, price: 3.2 }],
      cargo: [{ part: "cargoHold", tons: 21 }],
    },
  },
  {
    id: "gazelle",
    nameKey: "shipTplGazelle",
    designationKey: "shipTplClassGazelle",
    tl: 15, hullTons: 400, hullPoints: 176, maintenance: 20750, purchasePrice: 246.0003, cargoTons: 33.68,
    crew: [
      { role: "captain" }, { role: "pilot", count: 3 }, { role: "astrogator" }, { role: "engineer", count: 4 },
      { role: "medic" }, { role: "gunner", count: 8 }, { role: "administrator" }, { role: "mechanic" }, { role: "officer" },
    ],
    power: { basic: 80, mDrive: 240, jDrive: 200, sensors: 2, weapons: null },
    components: {
      hull: [{ part: "hullStandard", price: 20 }, { part: "hullReinforced", price: 10 }],
      armour: [{ part: "armourCrystaliron", spec: "3", tons: 15, price: 4.5 }],
      mDrive: [{ part: "mDrive", spec: "6", tons: 24, price: 48 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "5", tons: 55, price: 82.5 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "540", tons: 36, price: 36 }],
      fuel: [fuel(8, 3, 128)],
      bridge: [{ part: "bridgeSmall", tons: 10, price: 1 }],
      computer: [{ part: "computer", join: "/", spec: "30", price: 20 }],
      sensors: [{ part: "sensorsMilitary", tons: 2, price: 4.1 }],
      weapons: [
        { part: "barbetteParticle", count: 2, tons: 10, price: 16 },
        { part: "turretTripleBeamLaser", count: 2, tons: 2, price: 5 },
      ],
      craft: [dock(20, 22, 5.5), { part: "craftLaunch", price: 6.257 }],
      systems: [
        { part: "dropTankMount", specKey: "shipSpecTons", specVars: { n: 80 }, tons: 0.32, price: 0.16 },
        tonsPerDay(120, 6, 0.3),
        { part: "armoury", tons: 1, price: 0.25 },
        { part: "fuelScoops", price: 1 },
      ],
      software: [
        sw("swEvade", "1", 1), sw("swFireControl", "4", 8), sw("swJumpControl", "5", 0.5), ...stdSoftware,
      ],
      staterooms: [{ part: "stateroomStandard", count: 11, tons: 44, price: 5.5 }],
      commonAreas: [{ part: "commonArea", tons: 11, price: 1.1 }],
      cargo: [{ part: "cargoHold", tons: 33.68 }],
    },
  },
  {
    id: "labShip",
    nameKey: "shipTplLabShip",
    designationKey: "shipTplTypeL",
    tl: 12, hullTons: 400, hullPoints: 160, maintenance: 11365, purchasePrice: 136.3743, cargoTons: 3,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }],
    power: { basic: 80, mDrive: 80, jDrive: 80, sensors: 4, weapons: null },
    components: {
      hull: [{ part: "hullStandard", price: 20 }],
      mDrive: [{ part: "mDrive", spec: "2", tons: 8, price: 16 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 25, price: 37.5 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "180", tons: 12, price: 12 }],
      fuel: [fuel(4, 2, 82)],
      bridge: [{ part: "bridgeStandard", tons: 20, price: 2 }],
      computer: [{ part: "computer", join: "/", spec: "10", price: 0.16 }],
      sensors: [{ part: "sensorsImproved", tons: 3, price: 4.3 }],
      craft: [
        dock(40, 44, 11),
        { part: "craftPinnace", price: 8.712 },
        dock(4, 5, 1.25),
        { part: "repulsor", price: 0.25 },
        { part: "craftAirRaft", noteKey: "shipNoteInPinnace", price: 0.155 },
      ],
      systems: [
        { part: "probeDrones", count: 15, tons: 3, price: 1.5 },
        { part: "laboratory", tons: 100, price: 25 },
      ],
      software: [sw("swJumpControl", "2", 0.2), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 20, tons: 80, price: 10 }],
      commonAreas: [{ part: "commonArea", tons: 15, price: 1.5 }],
      cargo: [{ part: "cargoHold", tons: 3 }],
    },
  },
  {
    id: "patrolCorvette",
    nameKey: "shipTplPatrolCorvette",
    designationKey: "shipTplTypeT",
    tl: 12, hullTons: 400, hullPoints: 160, maintenance: 15371, purchasePrice: 184.4568, cargoTons: 38,
    crew: [
      { role: "pilot" }, { role: "astrogator" }, { role: "engineer", count: 2 }, { role: "medic" },
      { role: "gunner", count: 4 }, { role: "marine", count: 8 },
    ],
    power: { basic: 80, mDrive: 160, jDrive: 120, sensors: 2, weapons: 28 },
    components: {
      hull: [{ part: "hullStreamlined", price: 24 }],
      armour: [{ part: "armourCrystaliron", spec: "4", tons: 20, price: 4.8 }],
      mDrive: [{ part: "mDrive", spec: "4", tons: 16, price: 32 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "3", tons: 35, price: 52.5 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "405", tons: 27, price: 27 }],
      fuel: [{ specKey: "shipSpecWeeksJump", specVars: { n: 4, j: 3 }, noteKey: "shipNotePlusShipsBoat", tons: 124 }],
      bridge: [{ part: "bridgeStandard", tons: 20, price: 2 }],
      computer: [{ part: "computer", join: "/", spec: "15", price: 2 }],
      sensors: [{ part: "sensorsMilitary", tons: 2, price: 4.1 }],
      weapons: [
        { part: "turretTriplePulseLaser", count: 2, tons: 2, price: 8 },
        { part: "turretTripleMissile", count: 2, tons: 2, price: 6.5 },
      ],
      craft: [
        dock(30, 33, 8.25),
        { part: "craftShipsBoat", price: 7.272 },
        dock(15, 17, 4.25),
        { part: "craftGCarrier", price: 11.58 },
      ],
      systems: [{ part: "fuelScoops" }, tonsPerDay(80, 4, 0.2)],
      software: [
        sw("swEvade", "1", 1), sw("swFireControl", "1", 2), sw("swJumpControl", "3", 0.3), ...stdSoftware,
      ],
      staterooms: [
        { part: "stateroomStandard", count: 12, tons: 48, price: 6 },
        { part: "lowBerth", count: 4, tons: 2, price: 0.2 },
      ],
      commonAreas: [{ part: "commonArea", tons: 10, price: 1 }],
      cargo: [{ part: "cargoHold", tons: 38 }],
    },
  },
  {
    id: "subsidisedMerchant",
    nameKey: "shipTplSubsidisedMerchant",
    designationKey: "shipTplTypeR",
    tl: 12, hullTons: 400, hullPoints: 160, maintenance: 6529, purchasePrice: 78.3423, cargoTons: 201,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    power: { basic: 80, mDrive: 40, jDrive: 40, sensors: 1, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 24 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 4, price: 8 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "1", tons: 15, price: 22.5 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "135", tons: 9, price: 9 }],
      fuel: [fuel(4, 1, 41)],
      bridge: [{ part: "bridgeStandard", tons: 20, price: 2 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsCivilian", tons: 1, price: 3 }],
      craft: [dock(20, 22, 5.5), { part: "craftShuttle", price: 2.367 }],
      systems: [{ part: "fuelScoops" }, tonsPerDay(20, 1, 0.05)],
      software: [sw("swJumpControl", "1", 0.1), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 19, tons: 76, price: 9.5 },
        { part: "lowBerth", count: 9, tons: 4.5, price: 0.45 },
      ],
      commonAreas: [{ part: "commonArea", tons: 5.5, price: 0.55 }],
      cargo: [{ part: "cargoHold", tons: 201 }],
    },
  },
  {
    id: "donosev",
    nameKey: "shipTplDonosev",
    designationKey: "shipTplClassDonosev",
    tl: 14, hullTons: 400, hullPoints: 160, maintenance: 12697, purchasePrice: 152.3583, cargoTons: 21,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer", count: 2 }, { role: "mechanic" }],
    power: { basic: 80, mDrive: 40, jDrive: 120, sensors: 4, weapons: null },
    components: {
      hull: [{ part: "hullStandard", price: 20 }],
      mDrive: [{ part: "mDrive", spec: "2", tons: 12, price: 16 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "3", noteKey: "shipNoteReducedSize2", tons: 28, price: 52.5 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "210", tons: 14, price: 14 }],
      fuel: [fuel(8, 3, 124)],
      bridge: [{ part: "bridgeStandard", tons: 20, price: 2 }],
      computer: [{ part: "computer", join: "/", spec: "25", price: 10 }],
      sensors: [{ part: "sensorsImproved", tons: 3, price: 4.3 }],
      craft: [
        dock(50, 55, 11.93, 2),
        { part: "craftModularCutter", tons: 33, price: 8.25 },
        { key: "shipPartModuleDockingSpace", specKey: "shipSpecTons", specVars: { n: 30 } },
        dock(4, 15, 3.75, 3),
        { part: "repulsor", count: 3, price: 0.75 },
      ],
      systems: [
        { part: "workshop", tons: 6, price: 0.9 },
        { part: "advProbeDrones", count: 20, tons: 4, price: 3.2 },
        tonsPerDay(120, 6, 0.3),
        { part: "sensorStation", tons: 1, price: 0.5 },
        { part: "laboratory", count: 2, tons: 8, price: 2 },
      ],
      software: [sw("swJumpControl", "3", 0.3), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 10, tons: 40, price: 5 }],
      commonAreas: [{ part: "commonArea", tons: 10, price: 1 }],
      cargo: [{ part: "cargoHold", tons: 21 }],
    },
  },
  {
    id: "subsidisedLiner",
    nameKey: "shipTplSubsidisedLiner",
    designationKey: "shipTplTypeM",
    tl: 14, hullTons: 600, hullPoints: 240, maintenance: 13193, purchasePrice: 158.3163, cargoTons: 119,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer", count: 2 }, { role: "medic" }, { role: "steward" }],
    power: { basic: 120, mDrive: 60, jDrive: 180, sensors: 1, weapons: null },
    components: {
      hull: [{ part: "hullStandard", price: 30 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 6, price: 12 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "3", tons: 50, price: 75 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "360", tons: 24, price: 24 }],
      fuel: [fuel(4, 3, 183)],
      bridge: [{ part: "bridgeStandard", tons: 20, price: 3 }],
      computer: [{ part: "computer", join: "/", spec: "10bis", price: 0.24 }],
      sensors: [{ part: "sensorsCivilian", tons: 1, price: 3 }],
      craft: [dock(20, 22, 5.5), { part: "craftShuttle", price: 2.367 }],
      software: [sw("swJumpControl", "3", 0.3), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 30, tons: 120, price: 15 },
        { part: "lowBerth", count: 20, tons: 10, price: 1 },
      ],
      commonAreas: [{ part: "commonArea", tons: 45, price: 4.5 }],
      cargo: [{ part: "cargoHold", tons: 119 }],
    },
  },
  {
    id: "mercenaryCruiser",
    nameKey: "shipTplMercenaryCruiser",
    designationKey: "shipTplTypeC",
    tl: 12, hullTons: 800, hullPoints: 320, maintenance: 24372, purchasePrice: 292.4646, cargoTons: 72,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer", count: 3 }, { role: "medic" }],
    power: { basic: 160, mDrive: 240, jDrive: 240, sensors: 2, weapons: 8 },
    components: {
      hull: [{ part: "hullSphere", price: 32 }],
      armour: [{ part: "armourCrystaliron", spec: "4", tons: 40, price: 6.4 }],
      mDrive: [{ part: "mDrive", spec: "3", tons: 24, price: 48 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "3", tons: 65, price: 97.5 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "750", tons: 50, price: 50 }],
      fuel: [{ specKey: "shipSpecWeeksJump", specVars: { n: 4, j: 3 }, noteKey: "shipNoteCutterFuel", tons: 252 }],
      bridge: [{ part: "bridgeStandard", tons: 20, price: 4 }],
      computer: [{ part: "computer", join: "/", spec: "20fib", price: 7.5 }],
      sensors: [{ part: "sensorsMilitary", tons: 2, price: 4.1 }],
      weapons: [{ part: "turretTriple", count: 8, tons: 8, price: 8 }],
      craft: [
        dock(4, 5, 1.25),
        { part: "repulsor", price: 0.25 },
        dock(50, 55, 13.75),
        { part: "craftModularCutter", price: 10.287 },
        dock(50, 55, 13.75),
        { part: "craftModularCutter", price: 10.287 },
        { part: "craftAirRaft", count: 2, noteKey: "shipNoteInCutters", price: 0.31 },
      ],
      systems: [{ part: "repairDrones", tons: 8, price: 1.6 }],
      software: [
        sw("swAutoRepair", "2", 10), sw("swEvade", "1", 1), sw("swFireControl", "1", 2),
        sw("swJumpControl", "3", 0.3), ...stdSoftware,
      ],
      staterooms: [{ part: "stateroomStandard", count: 25, tons: 100, price: 12.5 }],
      commonAreas: [{ part: "commonArea", tons: 44, price: 4.4 }],
      cargo: [{ part: "cargoHold", tons: 72 }],
    },
  },

  // ---------------- Naves pequeñas ----------------
  {
    id: "lightFighter",
    nameKey: "shipTplLightFighter",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 10, hullPoints: 4, maintenance: 758, purchasePrice: 9.09, cargoTons: 3.65,
    crew: [{ role: "pilot" }],
    power: { basic: null, mDrive: 6, jDrive: null, sensors: null, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 0.6 }],
      armour: [{ part: "armourCrystaliron", spec: "2", tons: 0.25, price: 0.06 }],
      mDrive: [{ part: "mDrive", spec: "6", tons: 0.6, price: 1.2 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "15", tons: 1, price: 1 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "cockpit", tons: 1.1, price: 0.01 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsMilitary", tons: 2, price: 4.1 }],
      weapons: [{ part: "fixedMountPulseLaser", price: 1.1 }],
      software: [sw("swFireControl", "1", 2), ...stdSoftware],
      cargo: [{ part: "cargoHold", tons: 3.65 }],
    },
  },
  {
    id: "launch",
    nameKey: "shipTplLaunch",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 20, hullPoints: 8, maintenance: 606, purchasePrice: 7.272, cargoTons: 8.6,
    crew: [{ role: "pilot" }],
    power: { basic: 4, mDrive: 14, jDrive: null, sensors: null, weapons: 1 },
    components: {
      hull: [{ part: "hullStreamlined", price: 1.2 }],
      mDrive: [{ part: "mDrive", spec: "7", tons: 1.4, price: 2.8 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "30", tons: 2, price: 2 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "turretSingleEmpty", tons: 1, price: 0.2 }],
      systems: [{ part: "cabinSpace", count: 2, tons: 3, price: 0.15 }, { part: "fuelScoops" }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 8.6 }],
    },
  },
  {
    id: "shuttle",
    nameKey: "shipTplShuttle",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 20, hullPoints: 8, maintenance: 197.25, purchasePrice: 2.367, cargoTons: 14.8,
    crew: [{ role: "pilot" }],
    power: { basic: 4, mDrive: 2, jDrive: null, sensors: null, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 1.2 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 0.2, price: 0.4 }],
      powerPlant: [{ part: "powerPlantFusionTl8", spec: "10", tons: 1, price: 0.5 }],
      fuel: [{ ...fuel(4, null, 1), price: 0.5 }],
      bridge: [{ part: "bridgeStandard", tons: 3, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsBasic" }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 14.8 }],
    },
  },
  {
    id: "shipsBoat",
    nameKey: "shipTplShipsBoat",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 30, hullPoints: 12, maintenance: 591, purchasePrice: 7.092, cargoTons: 13.5,
    crew: [{ role: "pilot" }],
    power: { basic: 6, mDrive: 15, jDrive: null, sensors: null, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 1.8 }],
      mDrive: [{ part: "mDrive", spec: "5", tons: 1.5, price: 3 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "30", tons: 2, price: 2 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount", price: 0.1 }],
      systems: [{ part: "cabinSpace", count: 6, tons: 9, price: 0.45 }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 13.5 }],
    },
  },
  {
    id: "slowBoat",
    nameKey: "shipTplSlowBoat",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 30, hullPoints: 12, maintenance: 403.5, purchasePrice: 4.842, cargoTons: 21.1,
    crew: [{ role: "pilot" }],
    power: { basic: 6, mDrive: 9, jDrive: null, sensors: null, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 1.8 }],
      mDrive: [{ part: "mDrive", spec: "3", tons: 0.9, price: 1.8 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "15", tons: 1, price: 1 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount", price: 0.1 }],
      systems: [{ part: "cabinSpace", count: 2, tons: 3, price: 0.15 }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 21.1 }],
    },
  },
  {
    id: "pinnace",
    nameKey: "shipTplPinnace",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 40, hullPoints: 16, maintenance: 726, purchasePrice: 8.712, cargoTons: 23,
    crew: [{ role: "pilot" }],
    power: { basic: 8, mDrive: 20, jDrive: null, sensors: null, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 2.4 }],
      mDrive: [{ part: "mDrive", spec: "5", tons: 2, price: 4 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "30", tons: 2, price: 2 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount", price: 0.1 }],
      systems: [{ part: "cabinSpace", count: 6, tons: 9, price: 0.45 }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 23 }],
    },
  },
  {
    id: "slowPinnace",
    nameKey: "shipTplSlowPinnace",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 40, hullPoints: 16, maintenance: 482, purchasePrice: 5.787, cargoTons: 32.8,
    crew: [{ role: "pilot" }],
    power: { basic: 8, mDrive: 12, jDrive: null, sensors: null, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 2.4 }],
      // El libro imprime esta fila como "2,4 / 1,2". Están al revés: propulsión 3
      // en un casco de 40 t son 1,2 t (la pinaza normal gasta 2 t para
      // propulsión 5), y con 1,2 t las toneladas de la ficha suman las 40 del
      // casco en punto.
      mDrive: [{ part: "mDrive", spec: "3", tons: 1.2, price: 2.4 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "20", tons: 2, price: 1 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsBasic" }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 32.8 }],
    },
  },
  {
    id: "modularCutter",
    nameKey: "shipTplModularCutter",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 50, hullPoints: 20, maintenance: 842, purchasePrice: 10.107, cargoTons: 3,
    crew: [{ role: "pilot" }],
    power: { basic: 10, mDrive: 20, jDrive: null, sensors: null, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 3 }],
      mDrive: [{ part: "mDrive", spec: "4", tons: 2, price: 4 }],
      powerPlant: [{ part: "powerPlantFusionTl8", spec: "30", tons: 3, price: 1.5 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount", price: 0.1 }],
      systems: [
        { part: "modularHull", tons: 30, price: 1.8 },
        { part: "cabinSpace", count: 4, tons: 6, price: 0.3 },
      ],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 3 }],
    },
  },
  {
    id: "ferry",
    nameKey: "shipTplFerry",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 95, hullPoints: 38, maintenance: 1262, purchasePrice: 15.147, cargoTons: 0,
    crew: [{ role: "pilot" }],
    power: { basic: 19, mDrive: 29, jDrive: null, sensors: null, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 5.7 }],
      mDrive: [{ part: "mDrive", spec: "3", tons: 2.85, price: 5.7 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "60", tons: 4, price: 4 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 6, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount", price: 0.1 }],
      systems: [{ part: "cabinSpace", count: 8, tons: 12, price: 0.6 }],
      software: stdSoftware,
      // El libro imprime la fila de carga sin número: las 69,15 t que quedan
      // libres en el casco no están asignadas, y quien use la plantilla decide
      // qué hace con ellas.
      cargo: [{ part: "cargoHold" }],
    },
  },
  {
    id: "passengerShuttle",
    nameKey: "shipTplPassengerShuttle",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 95, hullPoints: 38, maintenance: 827.25, purchasePrice: 9.927, cargoTons: 16.05,
    crew: [{ role: "pilot" }, { role: "coPilot" }],
    power: { basic: 19, mDrive: 10, jDrive: null, sensors: 1, weapons: null },
    components: {
      hull: [{ part: "hullStreamlined", price: 5.7 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 0.95, price: 1.9 }],
      powerPlant: [{ part: "powerPlantFusionTl8", spec: "30", tons: 3, price: 1.5 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 6, price: 0.5 }],
      computer: [{ part: "computer", join: "/", spec: "5", price: 0.03 }],
      sensors: [{ part: "sensorsBasic" }],
      systems: [{ part: "accelerationBench", count: 60, specKey: "shipSpecPassengers", specVars: { n: 240 }, tons: 60, price: 0.6 }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 16.05 }],
    },
  },
];

export const findTemplate = (id: string): ShipTemplate | undefined =>
  SHIP_TEMPLATES.find(tpl => tpl.id === id);
