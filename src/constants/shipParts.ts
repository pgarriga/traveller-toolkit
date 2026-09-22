// Catálogo de componentes de "Mi nave".
//
// Es el menú de "añadir" de cada sección de la ficha, no una lista de todo lo
// que las reglas de construcción permiten: sale de vaciar los bloques de
// estadísticas de las 24 naves del manual básico (pp. 189-228), así que contiene
// exactamente las piezas que esas naves llevan montadas. Ampliarlo es añadir
// entradas aquí y sus claves a i18n/translations.ts; nada más depende de esta
// lista.
//
// `tons` es un valor POR UNIDAD y solo sirve para rellenar la fila al insertarla:
// la ficha no recalcula nada, así que el jugador manda sobre ese número en cuanto
// la fila existe. null es el "—" del manual. No hay precios: la ficha no lleva
// dinero (ver types/ship.ts).

import type { ShipSectionKey, TurretMountId, TurretWeaponId } from "../types/ship";

export interface ShipPart {
  id: string;
  section: ShipSectionKey;
  /** Clave de i18n; se traduce al insertar y a partir de ahí es texto de la ficha. */
  labelKey: string;
  tons: number | null;
  /**
   * Puntos de Potencia POR UNIDAD, para las líneas que piden energía propia.
   * Sale de sumar la montura y sus armas: tabla de monturas (fija 0, torreta 1
   * sea simple, doble o triple) más tabla de armas de torreta (láser de pulsos,
   * rayo láser y taladro láser 4 cada uno; lanzamisiles y proyector de arena 0).
   * Así, una torreta triple de láseres de pulsos son 1 + 3×4 = 13.
   *
   * Ausente significa que el manual no da el dato en esas dos tablas, no que sea
   * cero. En las líneas que se montan de verdad (las que llevan `turret`) esta
   * cifra ya no decide nada: la potencia sale de las tablas al montarlas, y por
   * eso la barbeta de partículas —que tiene tabla propia— vale 15 y no 0.
   */
  power?: number;
  /**
   * Cómo se monta, para las líneas de armamento. Es lo que convierte la línea
   * que trae una plantilla en una torreta de verdad —la que se edita en el
   * diálogo— en vez de en un texto con el arma escrita dentro.
   *
   * `weapon: null` es la montura sin armar, que el manual también vende: la
   * ficha la deja así y el jugador decide qué le pone. Cuando sí hay arma, se
   * repite en todos los huecos de la montura: una torreta triple de láseres de
   * pulsos son tres láseres de pulsos, que es como el manual la imprime.
   */
  turret?: { mount: TurretMountId; weapon: TurretWeaponId | null };
}

export const SHIP_PARTS = [
  // --- Casco -------------------------------------------------------------
  { id: "hullStreamlined", section: "hull", labelKey: "shipPartHullStreamlined", tons: null },
  { id: "hullStandard", section: "hull", labelKey: "shipPartHullStandard", tons: null },
  { id: "hullSphere", section: "hull", labelKey: "shipPartHullSphere", tons: null },
  { id: "hullReinforced", section: "hull", labelKey: "shipPartHullReinforced", tons: null },

  // --- Blindaje ----------------------------------------------------------
  { id: "armourCrystaliron", section: "armour", labelKey: "shipPartArmourCrystaliron", tons: null },

  // --- Motores y planta --------------------------------------------------
  { id: "mDrive", section: "mDrive", labelKey: "shipPartMDrive", tons: null },
  { id: "jDrive", section: "jDrive", labelKey: "shipPartJDrive", tons: null },
  { id: "powerPlantFusion", section: "powerPlant", labelKey: "shipPartPowerFusion", tons: null },
  { id: "powerPlantFusionTl8", section: "powerPlant", labelKey: "shipPartPowerFusionTl8", tons: null },
  { id: "fuelTank", section: "fuel", labelKey: "shipPartFuelTank", tons: null },

  // --- Puente ------------------------------------------------------------
  { id: "bridgeStandard", section: "bridge", labelKey: "shipPartBridgeStandard", tons: 10 },
  { id: "bridgeSmall", section: "bridge", labelKey: "shipPartBridgeSmall", tons: 10 },
  { id: "cockpit", section: "bridge", labelKey: "shipPartCockpit", tons: 1.1 },

  // --- Computadora -------------------------------------------------------
  { id: "computer", section: "computer", labelKey: "shipPartComputer", tons: null },

  // --- Sensores ----------------------------------------------------------
  { id: "sensorsBasic", section: "sensors", labelKey: "shipPartSensorsBasic", tons: null },
  { id: "sensorsCivilian", section: "sensors", labelKey: "shipPartSensorsCivilian", tons: 1 },
  { id: "sensorsMilitary", section: "sensors", labelKey: "shipPartSensorsMilitary", tons: 2 },
  { id: "sensorsImproved", section: "sensors", labelKey: "shipPartSensorsImproved", tons: 3 },
  { id: "sensorsCountermeasures", section: "sensors", labelKey: "shipPartSensorsCountermeasures", tons: 5 },

  // --- Armas -------------------------------------------------------------
  { id: "turretSingleEmpty", section: "weapons", labelKey: "shipPartTurretSingleEmpty", tons: 1, power: 1,
    turret: { mount: "single", weapon: null } },
  { id: "turretDouble", section: "weapons", labelKey: "shipPartTurretDouble", tons: 1, power: 1,
    turret: { mount: "double", weapon: null } },
  { id: "turretTriple", section: "weapons", labelKey: "shipPartTurretTriple", tons: 1, power: 1,
    turret: { mount: "triple", weapon: null } },
  { id: "turretTripleBeamLaser", section: "weapons", labelKey: "shipPartTurretTripleBeamLaser", tons: 1, power: 13,
    turret: { mount: "triple", weapon: "beamLaser" } },
  { id: "turretTriplePulseLaser", section: "weapons", labelKey: "shipPartTurretTriplePulseLaser", tons: 1, power: 13,
    turret: { mount: "triple", weapon: "pulseLaser" } },
  { id: "turretTripleMissile", section: "weapons", labelKey: "shipPartTurretTripleMissile", tons: 1, power: 1,
    turret: { mount: "triple", weapon: "missileRack" } },
  { id: "barbetteParticle", section: "weapons", labelKey: "shipPartBarbetteParticle", tons: 5, power: 15,
    turret: { mount: "barbette", weapon: "particleBarbette" } },
  { id: "fixedMount", section: "weapons", labelKey: "shipPartFixedMount", tons: null, power: 0,
    turret: { mount: "fixed", weapon: null } },
  { id: "fixedMountPulseLaser", section: "weapons", labelKey: "shipPartFixedMountPulseLaser", tons: null, power: 4,
    turret: { mount: "fixed", weapon: "pulseLaser" } },

  // --- Munición ----------------------------------------------------------
  { id: "missileMagazine", section: "ammo", labelKey: "shipPartMissileMagazine", tons: 12 },

  // --- Naves embarcadas --------------------------------------------------
  { id: "craftLaunch", section: "craft", labelKey: "shipPartCraftLaunch", tons: null },
  { id: "craftModularCutter", section: "craft", labelKey: "shipPartCraftModularCutter", tons: null },
  { id: "craftShuttle", section: "craft", labelKey: "shipPartCraftShuttle", tons: null },
  { id: "craftShipsBoat", section: "craft", labelKey: "shipPartCraftShipsBoat", tons: null },
  { id: "craftPinnace", section: "craft", labelKey: "shipPartCraftPinnace", tons: null },
  { id: "craftLightFighter", section: "craft", labelKey: "shipPartCraftLightFighter", tons: null },
  { id: "craftGCarrier", section: "craft", labelKey: "shipPartCraftGCarrier", tons: null },
  { id: "craftAirRaft", section: "craft", labelKey: "shipPartCraftAirRaft", tons: null },

  // --- Sistemas ----------------------------------------------------------
  { id: "fuelScoops", section: "systems", labelKey: "shipPartFuelScoops", tons: null },
  { id: "fuelProcessor", section: "systems", labelKey: "shipPartFuelProcessor", tons: 1 },
  { id: "dockingSpace", section: "systems", labelKey: "shipPartDockingSpace", tons: null },
  { id: "repulsor", section: "systems", labelKey: "shipPartRepulsor", tons: null },
  { id: "probeDrones", section: "systems", labelKey: "shipPartProbeDrones", tons: 0.2 },
  { id: "advProbeDrones", section: "systems", labelKey: "shipPartAdvProbeDrones", tons: 0.2 },
  { id: "miningDrones", section: "systems", labelKey: "shipPartMiningDrones", tons: 2 },
  { id: "repairDrones", section: "systems", labelKey: "shipPartRepairDrones", tons: 2 },
  { id: "workshop", section: "systems", labelKey: "shipPartWorkshop", tons: 6 },
  { id: "cargoCrane", section: "systems", labelKey: "shipPartCargoCrane", tons: 3 },
  { id: "laboratory", section: "systems", labelKey: "shipPartLaboratory", tons: 4 },
  { id: "sensorStation", section: "systems", labelKey: "shipPartSensorStation", tons: 1 },
  { id: "medicalBay", section: "systems", labelKey: "shipPartMedicalBay", tons: 4 },
  { id: "armoury", section: "systems", labelKey: "shipPartArmoury", tons: 1 },
  { id: "multiEnvSpace", section: "systems", labelKey: "shipPartMultiEnvSpace", tons: 8 },
  { id: "dropTankMount", section: "systems", labelKey: "shipPartDropTankMount", tons: 0.32 },
  { id: "cabinSpace", section: "systems", labelKey: "shipPartCabinSpace", tons: 1.5 },
  { id: "accelerationBench", section: "systems", labelKey: "shipPartAccelerationBench", tons: 1 },
  { id: "modularHull", section: "systems", labelKey: "shipPartModularHull", tons: 30 },

  // --- Software ----------------------------------------------------------
  { id: "swJumpControl", section: "software", labelKey: "shipPartSwJumpControl", tons: null },
  { id: "swLibrary", section: "software", labelKey: "shipPartSwLibrary", tons: null },
  { id: "swManoeuvre", section: "software", labelKey: "shipPartSwManoeuvre", tons: null },
  { id: "swIntellect", section: "software", labelKey: "shipPartSwIntellect", tons: null },
  { id: "swEvade", section: "software", labelKey: "shipPartSwEvade", tons: null },
  { id: "swFireControl", section: "software", labelKey: "shipPartSwFireControl", tons: null },
  { id: "swAutoRepair", section: "software", labelKey: "shipPartSwAutoRepair", tons: null },

  // --- Camarotes ---------------------------------------------------------
  { id: "stateroomStandard", section: "staterooms", labelKey: "shipPartStateroomStandard", tons: 4 },
  { id: "stateroomLuxury", section: "staterooms", labelKey: "shipPartStateroomLuxury", tons: 10 },
  { id: "lowBerth", section: "staterooms", labelKey: "shipPartLowBerth", tons: 0.5 },

  // --- Áreas comunes -----------------------------------------------------
  { id: "commonArea", section: "commonAreas", labelKey: "shipPartCommonArea", tons: null },
  { id: "trophyRoom", section: "commonAreas", labelKey: "shipPartTrophyRoom", tons: 7 },

  // --- Carga -------------------------------------------------------------
  { id: "cargoHold", section: "cargo", labelKey: "shipPartCargoHold", tons: null },
] as const satisfies readonly ShipPart[];

export type ShipPartId = (typeof SHIP_PARTS)[number]["id"];

/** Piezas ofrecidas por el botón de "añadir" de una sección, en el orden del catálogo. */
export const partsForSection = (section: ShipSectionKey): readonly ShipPart[] =>
  SHIP_PARTS.filter(part => part.section === section);

const PART_BY_ID: ReadonlyMap<string, ShipPart> = new Map(
  SHIP_PARTS.map(part => [part.id as string, part as ShipPart]),
);

export const findPart = (id: string): ShipPart | undefined => PART_BY_ID.get(id);
