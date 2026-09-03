// Catálogo de componentes de "Mi nave".
//
// Es el menú de "añadir" de cada sección de la ficha, no una lista de todo lo
// que las reglas de construcción permiten: sale de vaciar los bloques de
// estadísticas de las 24 naves del manual básico (pp. 189-228), así que contiene
// exactamente las piezas que esas naves llevan montadas. Ampliarlo es añadir
// entradas aquí y sus claves a i18n/translations.ts; nada más depende de esta
// lista.
//
// `tons` y `price` son valores POR UNIDAD y solo sirven para rellenar la fila al
// insertarla: la ficha no recalcula nada, así que el jugador manda sobre ambos
// números en cuanto la fila existe. null es el "—" del manual.

import type { ShipSectionKey } from "../types/ship";

export interface ShipPart {
  id: string;
  section: ShipSectionKey;
  /** Clave de i18n; se traduce al insertar y a partir de ahí es texto de la ficha. */
  labelKey: string;
  tons: number | null;
  /** MCr. */
  price: number | null;
}

export const SHIP_PARTS = [
  // --- Casco -------------------------------------------------------------
  { id: "hullStreamlined", section: "hull", labelKey: "shipPartHullStreamlined", tons: null, price: null },
  { id: "hullStandard", section: "hull", labelKey: "shipPartHullStandard", tons: null, price: null },
  { id: "hullSphere", section: "hull", labelKey: "shipPartHullSphere", tons: null, price: null },
  { id: "hullReinforced", section: "hull", labelKey: "shipPartHullReinforced", tons: null, price: null },

  // --- Blindaje ----------------------------------------------------------
  { id: "armourCrystaliron", section: "armour", labelKey: "shipPartArmourCrystaliron", tons: null, price: null },

  // --- Motores y planta --------------------------------------------------
  { id: "mDrive", section: "mDrive", labelKey: "shipPartMDrive", tons: null, price: null },
  { id: "jDrive", section: "jDrive", labelKey: "shipPartJDrive", tons: null, price: null },
  { id: "powerPlantFusion", section: "powerPlant", labelKey: "shipPartPowerFusion", tons: null, price: null },
  { id: "powerPlantFusionTl8", section: "powerPlant", labelKey: "shipPartPowerFusionTl8", tons: null, price: null },
  { id: "fuelTank", section: "fuel", labelKey: "shipPartFuelTank", tons: null, price: null },

  // --- Puente ------------------------------------------------------------
  { id: "bridgeStandard", section: "bridge", labelKey: "shipPartBridgeStandard", tons: 10, price: 1 },
  { id: "bridgeSmall", section: "bridge", labelKey: "shipPartBridgeSmall", tons: 10, price: 1 },
  { id: "cockpit", section: "bridge", labelKey: "shipPartCockpit", tons: 1.1, price: 0.01 },

  // --- Computadora -------------------------------------------------------
  { id: "computer", section: "computer", labelKey: "shipPartComputer", tons: null, price: 0.03 },

  // --- Sensores ----------------------------------------------------------
  { id: "sensorsBasic", section: "sensors", labelKey: "shipPartSensorsBasic", tons: null, price: null },
  { id: "sensorsCivilian", section: "sensors", labelKey: "shipPartSensorsCivilian", tons: 1, price: 3 },
  { id: "sensorsMilitary", section: "sensors", labelKey: "shipPartSensorsMilitary", tons: 2, price: 4.1 },
  { id: "sensorsImproved", section: "sensors", labelKey: "shipPartSensorsImproved", tons: 3, price: 4.3 },
  { id: "sensorsCountermeasures", section: "sensors", labelKey: "shipPartSensorsCountermeasures", tons: 5, price: 12.3 },

  // --- Armas -------------------------------------------------------------
  { id: "turretSingleEmpty", section: "weapons", labelKey: "shipPartTurretSingleEmpty", tons: 1, price: 0.2 },
  { id: "turretDouble", section: "weapons", labelKey: "shipPartTurretDouble", tons: 1, price: 0.5 },
  { id: "turretTriple", section: "weapons", labelKey: "shipPartTurretTriple", tons: 1, price: 1 },
  { id: "turretTripleBeamLaser", section: "weapons", labelKey: "shipPartTurretTripleBeamLaser", tons: 1, price: 2.5 },
  { id: "turretTriplePulseLaser", section: "weapons", labelKey: "shipPartTurretTriplePulseLaser", tons: 1, price: 4 },
  { id: "turretTripleMissile", section: "weapons", labelKey: "shipPartTurretTripleMissile", tons: 1, price: 3.25 },
  { id: "barbetteParticle", section: "weapons", labelKey: "shipPartBarbetteParticle", tons: 5, price: 8 },
  { id: "fixedMount", section: "weapons", labelKey: "shipPartFixedMount", tons: null, price: 0.1 },
  { id: "fixedMountPulseLaser", section: "weapons", labelKey: "shipPartFixedMountPulseLaser", tons: null, price: 1.1 },

  // --- Munición ----------------------------------------------------------
  { id: "missileMagazine", section: "ammo", labelKey: "shipPartMissileMagazine", tons: 12, price: null },

  // --- Naves embarcadas --------------------------------------------------
  { id: "craftLaunch", section: "craft", labelKey: "shipPartCraftLaunch", tons: null, price: 6.257 },
  { id: "craftModularCutter", section: "craft", labelKey: "shipPartCraftModularCutter", tons: null, price: 10.287 },
  { id: "craftShuttle", section: "craft", labelKey: "shipPartCraftShuttle", tons: null, price: 2.367 },
  { id: "craftShipsBoat", section: "craft", labelKey: "shipPartCraftShipsBoat", tons: null, price: 7.272 },
  { id: "craftPinnace", section: "craft", labelKey: "shipPartCraftPinnace", tons: null, price: 8.712 },
  { id: "craftLightFighter", section: "craft", labelKey: "shipPartCraftLightFighter", tons: null, price: 9.09 },
  { id: "craftGCarrier", section: "craft", labelKey: "shipPartCraftGCarrier", tons: null, price: 11.58 },
  { id: "craftAirRaft", section: "craft", labelKey: "shipPartCraftAirRaft", tons: null, price: 0.155 },

  // --- Sistemas ----------------------------------------------------------
  { id: "fuelScoops", section: "systems", labelKey: "shipPartFuelScoops", tons: null, price: null },
  { id: "fuelProcessor", section: "systems", labelKey: "shipPartFuelProcessor", tons: 1, price: 0.05 },
  { id: "dockingSpace", section: "systems", labelKey: "shipPartDockingSpace", tons: null, price: null },
  { id: "repulsor", section: "systems", labelKey: "shipPartRepulsor", tons: null, price: 0.25 },
  { id: "probeDrones", section: "systems", labelKey: "shipPartProbeDrones", tons: 0.2, price: 0.1 },
  { id: "advProbeDrones", section: "systems", labelKey: "shipPartAdvProbeDrones", tons: 0.2, price: 0.16 },
  { id: "miningDrones", section: "systems", labelKey: "shipPartMiningDrones", tons: 2, price: 0.2 },
  { id: "repairDrones", section: "systems", labelKey: "shipPartRepairDrones", tons: 2, price: 0.4 },
  { id: "workshop", section: "systems", labelKey: "shipPartWorkshop", tons: 6, price: 0.9 },
  { id: "cargoCrane", section: "systems", labelKey: "shipPartCargoCrane", tons: 3, price: 3 },
  { id: "laboratory", section: "systems", labelKey: "shipPartLaboratory", tons: 4, price: 1 },
  { id: "sensorStation", section: "systems", labelKey: "shipPartSensorStation", tons: 1, price: 0.5 },
  { id: "medicalBay", section: "systems", labelKey: "shipPartMedicalBay", tons: 4, price: 2 },
  { id: "armoury", section: "systems", labelKey: "shipPartArmoury", tons: 1, price: 0.25 },
  { id: "multiEnvSpace", section: "systems", labelKey: "shipPartMultiEnvSpace", tons: 8, price: 0.5 },
  { id: "dropTankMount", section: "systems", labelKey: "shipPartDropTankMount", tons: 0.32, price: 0.16 },
  { id: "cabinSpace", section: "systems", labelKey: "shipPartCabinSpace", tons: 1.5, price: 0.075 },
  { id: "accelerationBench", section: "systems", labelKey: "shipPartAccelerationBench", tons: 1, price: 0.01 },
  { id: "modularHull", section: "systems", labelKey: "shipPartModularHull", tons: 30, price: 1.8 },

  // --- Software ----------------------------------------------------------
  { id: "swJumpControl", section: "software", labelKey: "shipPartSwJumpControl", tons: null, price: 0.1 },
  { id: "swLibrary", section: "software", labelKey: "shipPartSwLibrary", tons: null, price: null },
  { id: "swManoeuvre", section: "software", labelKey: "shipPartSwManoeuvre", tons: null, price: null },
  { id: "swIntellect", section: "software", labelKey: "shipPartSwIntellect", tons: null, price: null },
  { id: "swEvade", section: "software", labelKey: "shipPartSwEvade", tons: null, price: 1 },
  { id: "swFireControl", section: "software", labelKey: "shipPartSwFireControl", tons: null, price: 2 },
  { id: "swAutoRepair", section: "software", labelKey: "shipPartSwAutoRepair", tons: null, price: 5 },

  // --- Camarotes ---------------------------------------------------------
  { id: "stateroomStandard", section: "staterooms", labelKey: "shipPartStateroomStandard", tons: 4, price: 0.5 },
  { id: "stateroomLuxury", section: "staterooms", labelKey: "shipPartStateroomLuxury", tons: 10, price: 1.5 },
  { id: "lowBerth", section: "staterooms", labelKey: "shipPartLowBerth", tons: 0.5, price: 0.05 },

  // --- Áreas comunes -----------------------------------------------------
  { id: "commonArea", section: "commonAreas", labelKey: "shipPartCommonArea", tons: null, price: null },
  { id: "trophyRoom", section: "commonAreas", labelKey: "shipPartTrophyRoom", tons: 7, price: 0.7 },

  // --- Carga -------------------------------------------------------------
  { id: "cargoHold", section: "cargo", labelKey: "shipPartCargoHold", tons: null, price: null },
] as const satisfies readonly ShipPart[];

export type ShipPartId = (typeof SHIP_PARTS)[number]["id"];

/** Piezas ofrecidas por el botón de "añadir" de una sección, en el orden del catálogo. */
export const partsForSection = (section: ShipSectionKey): readonly ShipPart[] =>
  SHIP_PARTS.filter(part => part.section === section);

const PART_BY_ID: ReadonlyMap<string, ShipPart> = new Map(
  SHIP_PARTS.map(part => [part.id as string, part as ShipPart]),
);

export const findPart = (id: string): ShipPart | undefined => PART_BY_ID.get(id);
