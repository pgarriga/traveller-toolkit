// Los 24 diseños de "Naves espaciales comunes" del manual básico (pp. 189-228),
// que "Mi nave" ofrece como punto de partida de una ficha.
//
// Cada plantilla se guarda como referencias al catálogo (constants/shipParts.ts)
// más los números impresos en el libro, y se convierte en una ficha de texto
// plano al cargarla (utils/ship.ts). Por eso aquí no hay ni una etiqueta escrita
// a mano: todo pasa por una clave de i18n y la plantilla se materializa en el
// idioma que el jugador tenga puesto.
//
// Las toneladas son las de la línea completa tal y como las imprime el manual
// (una fila "×10" ya trae el total de las diez), y null es su "—". Los precios
// del libro no se transcriben: la ficha no lleva dinero (ver types/ship.ts).
//
// Se transcribe lo que el libro imprime, no lo que debería sumar. Varios bloques
// no cuadran consigo mismos —el caza ligero deja 0,4 t sin asignar, la lanzadera
// de defensa 4,15 t—, y "corregirlos" aquí haría que la ficha
// dejara de parecerse a la página del manual que el jugador tiene delante. La
// ficha no calcula nada, así que la contradicción es visible y suya. Las únicas
// enmiendas son las de los datos que la extracción del PDF perdió o invirtió, y
// van comentadas una a una allí donde están.

import type { PowerPlantType, SensorGrade } from "../types/ship";
import type { ShipPartId } from "./shipParts";
import type { CrewRole } from "./ship";

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
  crew: CrewEntry[];
  /**
   * Lo que el diseño es capaz de hacer. Sustituye al recuadro de potencia que
   * antes se transcribía: la ficha lo calcula con las reglas del manual, así que
   * transcribir también el resultado sería tener el mismo número dos veces.
   */
  thrust: number | null;
  jump: number | null;
  sensors: SensorGrade | null;
  /** Tipo de planta. Se deduce de la salida impresa: 4 t que dan 60 son de 15. */
  plant: PowerPlantType | null;
  components: Partial<Record<string, TemplateComponent[]>>;
}

// Atajos para que la tabla de abajo se lea como el libro y no como código.
const sw = (part: ShipPartId, spec?: string): TemplateComponent =>
  spec === undefined ? { part } : { part, join: "/", spec };
const stdSoftware: TemplateComponent[] = [sw("swLibrary"), sw("swManoeuvre"), sw("swIntellect")];
const tonsPerDay = (n: number, tons: number): TemplateComponent =>
  ({ part: "fuelProcessor", specKey: "shipSpecTonsPerDay", specVars: { n }, tons });
const dock = (n: number, tons: number | null, count?: number): TemplateComponent =>
  ({ part: "dockingSpace", specKey: "shipSpecTons", specVars: { n }, tons, count });
// La fila de combustible no lleva nombre de pieza: en el manual esa celda ya es
// la descripción ("12 semanas de operación, S-2") y el encabezado de la fila es
// el nombre de la sección.
const fuel = (weeks: number, jump: number | null, tons: number): TemplateComponent =>
  jump === null
    ? { specKey: "shipSpecWeeks", specVars: { n: weeks }, tons }
    : { specKey: "shipSpecWeeksJump", specVars: { n: weeks, j: jump }, tons };

/**
 * Las necesidades de energía ya no se transcriben: la ficha las calcula con
 * `shipPowerRequirements` a partir del casco, de `thrust`, `jump` y `sensors`, y
 * de la potencia por unidad que cada arma trae de shipParts.ts.
 *
 * La energía que produce la planta sale clavada en los 24: `plant` se dedujo de
 * la propia salida impresa (4 t que dan 60 son de 15 por tonelada), y todas son
 * de fusión NT12 o NT8. Que a varias les pida más de lo que producen es normal y
 * por eso la ficha no compara los dos números: el manual dice que desviar energía
 * del resto para saltar es lo corriente, y poder no hacerlo es una ventaja.
 *
 * Los tres únicos diseños cuyo recuadro impreso trae potencia de armamento salen
 * clavados —corbeta de patrulla 28, crucero mercenario 8, lancha 1—, que es lo
 * que confirma que la cuenta es montura + armas: las 28 de la corbeta son sus
 * cuatro torretas (1 cada una) más seis láseres de pulsos (4 cada uno).
 *
 * Lo que no cuadra, y se queda como está:
 *
 *  - Varias naves armadas imprimen "—" en armamento aunque las tablas les den
 *    potencia: scout, seeker y safari (1, su torreta doble), sdb (14) y gazelle
 *    (56: 26 de sus torretas más 30 de sus dos barbetas de partículas, 15 cada
 *    una). La ficha aplica la regla; el libro se la salta.
 *  - donosev: su motor de maniobra dice Propulsión 2 y su recuadro impreso pide
 *    40 puntos, que son los de Propulsión 1. Uno de los dos números del libro
 *    está mal y no se puede saber cuál sin el libro delante.
 *  - lightFighter: el manual no imprime ni sistemas básicos ni sensores, aunque
 *    el caza tenga casco y sensores militares. La regla los pide igualmente.
 *  - passengerShuttle: lleva sensores básicos (0 puntos) y su recuadro pide 1,
 *    que es lo que gastan los de grado civil.
 */
export const SHIP_TEMPLATES: ShipTemplate[] = [
  {
    id: "scout",
    nameKey: "shipTplScout",
    designationKey: "shipTplTypeS",
    tl: 12, hullTons: 100, hullPoints: 40,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }],
    thrust: 2, jump: 2, sensors: "military", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      armour: [{ part: "armourCrystaliron", spec: "4", tons: 5 }],
      mDrive: [{ part: "mDrive", spec: "2", tons: 2 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 10 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "60", tons: 4 }],
      fuel: [fuel(12, 2, 23)],
      bridge: [{ part: "bridgeStandard", tons: 10 }],
      computer: [{ part: "computer", join: "/", spec: "5bis" }],
      sensors: [{ part: "sensorsMilitary", tons: 2 }],
      weapons: [{ part: "turretDouble", tons: 1 }],
      systems: [
        { part: "fuelScoops" },
        tonsPerDay(40, 2),
        { part: "probeDrones", count: 10, tons: 2 },
        dock(4, 5),
        { part: "repulsor" },
        { part: "workshop", tons: 6 },
      ],
      software: [sw("swJumpControl", "2"), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 4, tons: 16 }],
      cargo: [{ part: "cargoHold", tons: 12 }],
    },
  },
  {
    id: "seeker",
    nameKey: "shipTplSeeker",
    designationKey: "shipTplTypeJ",
    tl: 12, hullTons: 100, hullPoints: 40,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }],
    thrust: 2, jump: 2, sensors: "military", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      armour: [{ part: "armourCrystaliron", spec: "4", tons: 5 }],
      mDrive: [{ part: "mDrive", spec: "2", tons: 2 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 10 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "60", tons: 4 }],
      fuel: [fuel(4, 2, 21)],
      bridge: [{ part: "bridgeStandard", tons: 10 }],
      computer: [{ part: "computer", join: "/", spec: "5bis" }],
      sensors: [{ part: "sensorsMilitary", tons: 2 }],
      weapons: [{ part: "turretDouble", tons: 1 }],
      systems: [
        { part: "fuelScoops" },
        tonsPerDay(20, 1),
        { part: "miningDrones", count: 5, tons: 10 },
      ],
      software: [sw("swJumpControl", "2"), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 2, tons: 8 }],
      cargo: [{ part: "cargoHold", tons: 26 }],
    },
  },
  {
    id: "freeTrader",
    nameKey: "shipTplFreeTrader",
    designationKey: "shipTplTypeA",
    tl: 12, hullTons: 200, hullPoints: 80,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    thrust: 1, jump: 1, sensors: "civilian", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      armour: [{ part: "armourCrystaliron", spec: "2", tons: 5 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 2 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "1", tons: 10 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "75", tons: 5 }],
      fuel: [fuel(4, 1, 21)],
      bridge: [{ part: "bridgeStandard", tons: 10 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsCivilian", tons: 1 }],
      systems: [{ part: "fuelScoops" }, tonsPerDay(20, 1), { part: "cargoCrane", tons: 3 }],
      software: [sw("swJumpControl", "1"), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 10, tons: 40 },
        { part: "lowBerth", count: 20, tons: 10 },
      ],
      commonAreas: [{ part: "commonArea", tons: 11 }],
      cargo: [{ part: "cargoHold", tons: 81 }],
    },
  },
  {
    id: "farTrader",
    nameKey: "shipTplFarTrader",
    designationKey: "shipTplTypeA2",
    tl: 12, hullTons: 200, hullPoints: 80,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    thrust: 1, jump: 2, sensors: "civilian", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      armour: [{ part: "armourCrystaliron", spec: "2", tons: 5 }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 2 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 15 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "90", tons: 6 }],
      fuel: [fuel(4, 2, 41)],
      bridge: [{ part: "bridgeStandard", tons: 10 }],
      computer: [{ part: "computer", join: "/", spec: "5bis" }],
      sensors: [{ part: "sensorsCivilian", tons: 1 }],
      systems: [{ part: "fuelScoops" }, tonsPerDay(40, 2), { part: "cargoCrane", tons: 3 }],
      software: [sw("swJumpControl", "2"), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 10, tons: 40 },
        { part: "lowBerth", count: 6, tons: 3 },
      ],
      commonAreas: [{ part: "commonArea", tons: 9 }],
      cargo: [{ part: "cargoHold", tons: 63 }],
    },
  },
  {
    id: "safari",
    nameKey: "shipTplSafari",
    designationKey: "shipTplTypeK",
    tl: 12, hullTons: 200, hullPoints: 80,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    thrust: 1, jump: 2, sensors: "civilian", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 2 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 15 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "105", tons: 7 }],
      fuel: [fuel(4, 2, 41)],
      bridge: [{ part: "bridgeStandard", tons: 10 }],
      computer: [{ part: "computer", join: "/", spec: "5bis" }],
      sensors: [{ part: "sensorsCivilian", tons: 1 }],
      weapons: [{ part: "turretDouble", tons: 1 }],
      craft: [
        dock(20, 22),
        { part: "craftShuttle" },
        dock(4, 5),
        { part: "repulsor" },
        { part: "craftAirRaft", noteKey: "shipNoteInShuttle" },
      ],
      systems: [
        { part: "fuelScoops" },
        tonsPerDay(40, 2),
        { part: "multiEnvSpace", tons: 8 },
        { part: "multiEnvSpace", tons: 8 },
      ],
      software: [sw("swJumpControl", "2"), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 11, tons: 44 }],
      commonAreas: [
        { part: "commonArea", tons: 13 },
        { part: "trophyRoom", tons: 7 },
      ],
      cargo: [{ part: "cargoHold", tons: 14 }],
    },
  },
  {
    id: "sdb",
    nameKey: "shipTplSdb",
    designationKey: "shipTplSmallCraftNA",
    tl: 15, hullTons: 200, hullPoints: 88,
    crew: [
      { role: "captain" }, { role: "pilot", count: 3 }, { role: "engineer" }, { role: "mechanic" },
      { role: "medic" }, { role: "gunner", count: 4 }, { role: "administrator" }, { role: "officer" },
    ],
    thrust: 9, jump: null, sensors: "countermeasures", plant: "fusion12",
    components: {
      hull: [{ part: "hullStandard" }, { part: "hullReinforced" }],
      armour: [{ part: "armourCrystaliron", spec: "13", tons: 33 }],
      mDrive: [{ part: "mDrive", spec: "9", tons: 18 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "240", tons: 16 }],
      fuel: [fuel(12, null, 6)],
      bridge: [{ part: "bridgeStandard", tons: 10 }],
      computer: [{ part: "computer", join: "/", spec: "35" }],
      sensors: [{ part: "sensorsCountermeasures", tons: 5 }],
      weapons: [
        { part: "turretTripleBeamLaser", tons: 1 },
        { part: "turretTripleMissile", tons: 1 },
      ],
      ammo: [{ part: "missileMagazine", specKey: "shipSpecMissiles", specVars: { n: 144 }, tons: 12 }],
      systems: [
        { part: "repairDrones", tons: 2 },
        { part: "fuelScoops" },
        tonsPerDay(20, 1),
        { part: "medicalBay", tons: 4 },
      ],
      software: [
        sw("swAutoRepair", "1"), sw("swEvade", "2"), sw("swFireControl", "2"), ...stdSoftware,
      ],
      staterooms: [{ part: "stateroomStandard", count: 15, tons: 60 }],
      commonAreas: [{ part: "commonArea", tons: 4 }],
      cargo: [{ part: "cargoHold", tons: 22.85 }],
    },
  },
  {
    id: "yacht",
    nameKey: "shipTplYacht",
    designationKey: "shipTplTypeY",
    tl: 12, hullTons: 200, hullPoints: 80,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    thrust: 1, jump: 1, sensors: "civilian", plant: "fusion12",
    components: {
      hull: [{ part: "hullStandard" }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 2 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "1", tons: 10 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "90", tons: 6 }],
      fuel: [fuel(8, 1, 22)],
      bridge: [{ part: "bridgeStandard", tons: 10 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsCivilian", tons: 1 }],
      craft: [
        dock(4, 5),
        { part: "repulsor" },
        dock(30, 33),
        { part: "craftShipsBoat" },
        { part: "craftAirRaft", noteKey: "shipNoteInShipsBoat" },
      ],
      software: [sw("swJumpControl", "1"), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 12, tons: 48 },
        { part: "stateroomLuxury", count: 1, tons: 10 },
      ],
      commonAreas: [{ part: "commonArea", tons: 32 }],
      cargo: [{ part: "cargoHold", tons: 21 }],
    },
  },
  {
    id: "gazelle",
    nameKey: "shipTplGazelle",
    designationKey: "shipTplClassGazelle",
    tl: 15, hullTons: 400, hullPoints: 176,
    crew: [
      { role: "captain" }, { role: "pilot", count: 3 }, { role: "astrogator" }, { role: "engineer", count: 4 },
      { role: "medic" }, { role: "gunner", count: 8 }, { role: "administrator" }, { role: "mechanic" }, { role: "officer" },
    ],
    thrust: 6, jump: 5, sensors: "military", plant: "fusion12",
    components: {
      hull: [{ part: "hullStandard" }, { part: "hullReinforced" }],
      armour: [{ part: "armourCrystaliron", spec: "3", tons: 15 }],
      mDrive: [{ part: "mDrive", spec: "6", tons: 24 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "5", tons: 55 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "540", tons: 36 }],
      fuel: [fuel(8, 3, 128)],
      bridge: [{ part: "bridgeSmall", tons: 10 }],
      computer: [{ part: "computer", join: "/", spec: "30" }],
      sensors: [{ part: "sensorsMilitary", tons: 2 }],
      weapons: [
        { part: "barbetteParticle", count: 2, tons: 10 },
        { part: "turretTripleBeamLaser", count: 2, tons: 2 },
      ],
      craft: [dock(20, 22), { part: "craftLaunch" }],
      systems: [
        { part: "dropTankMount", specKey: "shipSpecTons", specVars: { n: 80 }, tons: 0.32 },
        tonsPerDay(120, 6),
        { part: "armoury", tons: 1 },
        { part: "fuelScoops" },
      ],
      software: [
        sw("swEvade", "1"), sw("swFireControl", "4"), sw("swJumpControl", "5"), ...stdSoftware,
      ],
      staterooms: [{ part: "stateroomStandard", count: 11, tons: 44 }],
      commonAreas: [{ part: "commonArea", tons: 11 }],
      cargo: [{ part: "cargoHold", tons: 33.68 }],
    },
  },
  {
    id: "labShip",
    nameKey: "shipTplLabShip",
    designationKey: "shipTplTypeL",
    tl: 12, hullTons: 400, hullPoints: 160,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }],
    thrust: 2, jump: 2, sensors: "improved", plant: "fusion12",
    components: {
      hull: [{ part: "hullStandard" }],
      mDrive: [{ part: "mDrive", spec: "2", tons: 8 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "2", tons: 25 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "180", tons: 12 }],
      fuel: [fuel(4, 2, 82)],
      bridge: [{ part: "bridgeStandard", tons: 20 }],
      computer: [{ part: "computer", join: "/", spec: "10" }],
      sensors: [{ part: "sensorsImproved", tons: 3 }],
      craft: [
        dock(40, 44),
        { part: "craftPinnace" },
        dock(4, 5),
        { part: "repulsor" },
        { part: "craftAirRaft", noteKey: "shipNoteInPinnace" },
      ],
      systems: [
        { part: "probeDrones", count: 15, tons: 3 },
        { part: "laboratory", tons: 100 },
      ],
      software: [sw("swJumpControl", "2"), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 20, tons: 80 }],
      commonAreas: [{ part: "commonArea", tons: 15 }],
      cargo: [{ part: "cargoHold", tons: 3 }],
    },
  },
  {
    id: "patrolCorvette",
    nameKey: "shipTplPatrolCorvette",
    designationKey: "shipTplTypeT",
    tl: 12, hullTons: 400, hullPoints: 160,
    crew: [
      { role: "pilot" }, { role: "astrogator" }, { role: "engineer", count: 2 }, { role: "medic" },
      { role: "gunner", count: 4 }, { role: "marine", count: 8 },
    ],
    thrust: 4, jump: 3, sensors: "military", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      armour: [{ part: "armourCrystaliron", spec: "4", tons: 20 }],
      mDrive: [{ part: "mDrive", spec: "4", tons: 16 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "3", tons: 35 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "405", tons: 27 }],
      fuel: [{ specKey: "shipSpecWeeksJump", specVars: { n: 4, j: 3 }, noteKey: "shipNotePlusShipsBoat", tons: 124 }],
      bridge: [{ part: "bridgeStandard", tons: 20 }],
      computer: [{ part: "computer", join: "/", spec: "15" }],
      sensors: [{ part: "sensorsMilitary", tons: 2 }],
      weapons: [
        { part: "turretTriplePulseLaser", count: 2, tons: 2 },
        { part: "turretTripleMissile", count: 2, tons: 2 },
      ],
      craft: [
        dock(30, 33),
        { part: "craftShipsBoat" },
        dock(15, 17),
        { part: "craftGCarrier" },
      ],
      systems: [{ part: "fuelScoops" }, tonsPerDay(80, 4)],
      software: [
        sw("swEvade", "1"), sw("swFireControl", "1"), sw("swJumpControl", "3"), ...stdSoftware,
      ],
      staterooms: [
        { part: "stateroomStandard", count: 12, tons: 48 },
        { part: "lowBerth", count: 4, tons: 2 },
      ],
      commonAreas: [{ part: "commonArea", tons: 10 }],
      cargo: [{ part: "cargoHold", tons: 38 }],
    },
  },
  {
    id: "subsidisedMerchant",
    nameKey: "shipTplSubsidisedMerchant",
    designationKey: "shipTplTypeR",
    tl: 12, hullTons: 400, hullPoints: 160,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer" }, { role: "medic" }, { role: "steward" }],
    thrust: 1, jump: 1, sensors: "civilian", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 4 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "1", tons: 15 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "135", tons: 9 }],
      fuel: [fuel(4, 1, 41)],
      bridge: [{ part: "bridgeStandard", tons: 20 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsCivilian", tons: 1 }],
      craft: [dock(20, 22), { part: "craftShuttle" }],
      systems: [{ part: "fuelScoops" }, tonsPerDay(20, 1)],
      software: [sw("swJumpControl", "1"), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 19, tons: 76 },
        { part: "lowBerth", count: 9, tons: 4.5 },
      ],
      commonAreas: [{ part: "commonArea", tons: 5.5 }],
      cargo: [{ part: "cargoHold", tons: 201 }],
    },
  },
  {
    id: "donosev",
    nameKey: "shipTplDonosev",
    designationKey: "shipTplClassDonosev",
    tl: 14, hullTons: 400, hullPoints: 160,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer", count: 2 }, { role: "mechanic" }],
    thrust: 2, jump: 3, sensors: "improved", plant: "fusion12",
    components: {
      hull: [{ part: "hullStandard" }],
      mDrive: [{ part: "mDrive", spec: "2", tons: 12 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "3", noteKey: "shipNoteReducedSize2", tons: 28 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "210", tons: 14 }],
      fuel: [fuel(8, 3, 124)],
      bridge: [{ part: "bridgeStandard", tons: 20 }],
      computer: [{ part: "computer", join: "/", spec: "25" }],
      sensors: [{ part: "sensorsImproved", tons: 3 }],
      craft: [
        dock(50, 55, 2),
        { part: "craftModularCutter", tons: 33 },
        { key: "shipPartModuleDockingSpace", specKey: "shipSpecTons", specVars: { n: 30 } },
        dock(4, 15, 3),
        { part: "repulsor", count: 3 },
      ],
      systems: [
        { part: "workshop", tons: 6 },
        { part: "advProbeDrones", count: 20, tons: 4 },
        tonsPerDay(120, 6),
        { part: "sensorStation", tons: 1 },
        { part: "laboratory", count: 2, tons: 8 },
      ],
      software: [sw("swJumpControl", "3"), ...stdSoftware],
      staterooms: [{ part: "stateroomStandard", count: 10, tons: 40 }],
      commonAreas: [{ part: "commonArea", tons: 10 }],
      cargo: [{ part: "cargoHold", tons: 21 }],
    },
  },
  {
    id: "subsidisedLiner",
    nameKey: "shipTplSubsidisedLiner",
    designationKey: "shipTplTypeM",
    tl: 14, hullTons: 600, hullPoints: 240,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer", count: 2 }, { role: "medic" }, { role: "steward" }],
    thrust: 1, jump: 3, sensors: "civilian", plant: "fusion12",
    components: {
      hull: [{ part: "hullStandard" }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 6 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "3", tons: 50 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "360", tons: 24 }],
      fuel: [fuel(4, 3, 183)],
      bridge: [{ part: "bridgeStandard", tons: 20 }],
      computer: [{ part: "computer", join: "/", spec: "10bis" }],
      sensors: [{ part: "sensorsCivilian", tons: 1 }],
      craft: [dock(20, 22), { part: "craftShuttle" }],
      software: [sw("swJumpControl", "3"), ...stdSoftware],
      staterooms: [
        { part: "stateroomStandard", count: 30, tons: 120 },
        { part: "lowBerth", count: 20, tons: 10 },
      ],
      commonAreas: [{ part: "commonArea", tons: 45 }],
      cargo: [{ part: "cargoHold", tons: 119 }],
    },
  },
  {
    id: "mercenaryCruiser",
    nameKey: "shipTplMercenaryCruiser",
    designationKey: "shipTplTypeC",
    tl: 12, hullTons: 800, hullPoints: 320,
    crew: [{ role: "pilot" }, { role: "astrogator" }, { role: "engineer", count: 3 }, { role: "medic" }],
    thrust: 3, jump: 3, sensors: "military", plant: "fusion12",
    components: {
      hull: [{ part: "hullSphere" }],
      armour: [{ part: "armourCrystaliron", spec: "4", tons: 40 }],
      mDrive: [{ part: "mDrive", spec: "3", tons: 24 }],
      jDrive: [{ part: "jDrive", join: "-", spec: "3", tons: 65 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "750", tons: 50 }],
      fuel: [{ specKey: "shipSpecWeeksJump", specVars: { n: 4, j: 3 }, noteKey: "shipNoteCutterFuel", tons: 252 }],
      bridge: [{ part: "bridgeStandard", tons: 20 }],
      computer: [{ part: "computer", join: "/", spec: "20fib" }],
      sensors: [{ part: "sensorsMilitary", tons: 2 }],
      weapons: [{ part: "turretTriple", count: 8, tons: 8 }],
      craft: [
        dock(4, 5),
        { part: "repulsor" },
        dock(50, 55),
        { part: "craftModularCutter" },
        dock(50, 55),
        { part: "craftModularCutter" },
        { part: "craftAirRaft", count: 2, noteKey: "shipNoteInCutters" },
      ],
      systems: [{ part: "repairDrones", tons: 8 }],
      software: [
        sw("swAutoRepair", "2"), sw("swEvade", "1"), sw("swFireControl", "1"),
        sw("swJumpControl", "3"), ...stdSoftware,
      ],
      staterooms: [{ part: "stateroomStandard", count: 25, tons: 100 }],
      commonAreas: [{ part: "commonArea", tons: 44 }],
      cargo: [{ part: "cargoHold", tons: 72 }],
    },
  },

  // ---------------- Naves pequeñas ----------------
  {
    id: "lightFighter",
    nameKey: "shipTplLightFighter",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 10, hullPoints: 4,
    crew: [{ role: "pilot" }],
    thrust: 6, jump: null, sensors: "military", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      armour: [{ part: "armourCrystaliron", spec: "2", tons: 0.25 }],
      mDrive: [{ part: "mDrive", spec: "6", tons: 0.6 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "15", tons: 1 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "cockpit", tons: 1.1 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsMilitary", tons: 2 }],
      weapons: [{ part: "fixedMountPulseLaser" }],
      software: [sw("swFireControl", "1"), ...stdSoftware],
      cargo: [{ part: "cargoHold", tons: 3.65 }],
    },
  },
  {
    id: "launch",
    nameKey: "shipTplLaunch",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 20, hullPoints: 8,
    crew: [{ role: "pilot" }],
    thrust: 7, jump: null, sensors: "basic", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "7", tons: 1.4 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "30", tons: 2 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "turretSingleEmpty", tons: 1 }],
      systems: [{ part: "cabinSpace", count: 2, tons: 3 }, { part: "fuelScoops" }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 8.6 }],
    },
  },
  {
    id: "shuttle",
    nameKey: "shipTplShuttle",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 20, hullPoints: 8,
    crew: [{ role: "pilot" }],
    thrust: 1, jump: null, sensors: "basic", plant: "fusion8",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 0.2 }],
      powerPlant: [{ part: "powerPlantFusionTl8", spec: "10", tons: 1 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsBasic" }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 14.8 }],
    },
  },
  {
    id: "shipsBoat",
    nameKey: "shipTplShipsBoat",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 30, hullPoints: 12,
    crew: [{ role: "pilot" }],
    thrust: 5, jump: null, sensors: "basic", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "5", tons: 1.5 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "30", tons: 2 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount" }],
      systems: [{ part: "cabinSpace", count: 6, tons: 9 }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 13.5 }],
    },
  },
  {
    id: "slowBoat",
    nameKey: "shipTplSlowBoat",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 30, hullPoints: 12,
    crew: [{ role: "pilot" }],
    thrust: 3, jump: null, sensors: "basic", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "3", tons: 0.9 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "15", tons: 1 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount" }],
      systems: [{ part: "cabinSpace", count: 2, tons: 3 }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 21.1 }],
    },
  },
  {
    id: "pinnace",
    nameKey: "shipTplPinnace",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 40, hullPoints: 16,
    crew: [{ role: "pilot" }],
    thrust: 5, jump: null, sensors: "basic", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "5", tons: 2 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "30", tons: 2 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount" }],
      systems: [{ part: "cabinSpace", count: 6, tons: 9 }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 23 }],
    },
  },
  {
    id: "slowPinnace",
    nameKey: "shipTplSlowPinnace",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 40, hullPoints: 16,
    crew: [{ role: "pilot" }],
    thrust: 3, jump: null, sensors: "basic", plant: "fusion8",
    components: {
      hull: [{ part: "hullStreamlined" }],
      // El libro imprime esta fila como "2,4 / 1,2". Están al revés: propulsión 3
      // en un casco de 40 t son 1,2 t (la pinaza normal gasta 2 t para
      // propulsión 5), y con 1,2 t las toneladas de la ficha suman las 40 del
      // casco en punto.
      mDrive: [{ part: "mDrive", spec: "3", tons: 1.2 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "20", tons: 2 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsBasic" }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 32.8 }],
    },
  },
  {
    id: "modularCutter",
    nameKey: "shipTplModularCutter",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 50, hullPoints: 20,
    crew: [{ role: "pilot" }],
    thrust: 4, jump: null, sensors: "basic", plant: "fusion8",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "4", tons: 2 }],
      powerPlant: [{ part: "powerPlantFusionTl8", spec: "30", tons: 3 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 3 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount" }],
      systems: [
        { part: "modularHull", tons: 30 },
        { part: "cabinSpace", count: 4, tons: 6 },
      ],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 3 }],
    },
  },
  {
    id: "ferry",
    nameKey: "shipTplFerry",
    designationKey: "shipTplSmallCraft",
    tl: 12, hullTons: 95, hullPoints: 38,
    crew: [{ role: "pilot" }],
    thrust: 3, jump: null, sensors: "basic", plant: "fusion12",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "3", tons: 2.85 }],
      powerPlant: [{ part: "powerPlantFusion", spec: "60", tons: 4 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 6 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsBasic" }],
      weapons: [{ part: "fixedMount" }],
      systems: [{ part: "cabinSpace", count: 8, tons: 12 }],
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
    tl: 12, hullTons: 95, hullPoints: 38,
    crew: [{ role: "pilot" }, { role: "coPilot" }],
    thrust: 1, jump: null, sensors: "basic", plant: "fusion8",
    components: {
      hull: [{ part: "hullStreamlined" }],
      mDrive: [{ part: "mDrive", spec: "1", tons: 0.95 }],
      powerPlant: [{ part: "powerPlantFusionTl8", spec: "30", tons: 3 }],
      fuel: [fuel(4, null, 1)],
      bridge: [{ part: "bridgeStandard", tons: 6 }],
      computer: [{ part: "computer", join: "/", spec: "5" }],
      sensors: [{ part: "sensorsBasic" }],
      systems: [{ part: "accelerationBench", count: 60, specKey: "shipSpecPassengers", specVars: { n: 240 }, tons: 60 }],
      software: stdSoftware,
      cargo: [{ part: "cargoHold", tons: 16.05 }],
    },
  },
];

export const findTemplate = (id: string): ShipTemplate | undefined =>
  SHIP_TEMPLATES.find(tpl => tpl.id === id);
