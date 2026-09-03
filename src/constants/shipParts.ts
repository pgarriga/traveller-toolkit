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

import type { ShipSectionKey } from "../types/ship";

export interface ShipPart {
  id: string;
  section: ShipSectionKey;
  /** Clave de i18n; se traduce al insertar y a partir de ahí es texto de la ficha. */
  labelKey: string;
  tons: number | null;
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
  { id: "turretSingleEmpty", section: "weapons", labelKey: "shipPartTurretSingleEmpty", tons: 1 },
  { id: "turretDouble", section: "weapons", labelKey: "shipPartTurretDouble", tons: 1 },
  { id: "turretTriple", section: "weapons", labelKey: "shipPartTurretTriple", tons: 1 },
  { id: "turretTripleBeamLaser", section: "weapons", labelKey: "shipPartTurretTripleBeamLaser", tons: 1 },
  { id: "turretTriplePulseLaser", section: "weapons", labelKey: "shipPartTurretTriplePulseLaser", tons: 1 },
  { id: "turretTripleMissile", section: "weapons", labelKey: "shipPartTurretTripleMissile", tons: 1 },
  { id: "barbetteParticle", section: "weapons", labelKey: "shipPartBarbetteParticle", tons: 5 },
  { id: "fixedMount", section: "weapons", labelKey: "shipPartFixedMount", tons: null },
  { id: "fixedMountPulseLaser", section: "weapons", labelKey: "shipPartFixedMountPulseLaser", tons: null },

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
