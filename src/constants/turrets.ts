// Monturas y armas de torreta del manual básico ("Armamento").
//
// Son las dos tablas que decide el jugador al armar la nave: la montura pone el
// tonelaje y sus propios puntos de Potencia, y cada arma que va dentro suma los
// suyos. El precio de las dos tablas NO se transcribe: la ficha no lleva dinero
// (ver types/ship.ts).
//
// El montaje emergente es un "+1 tonelada, +0 Potencia, NT10" que se le pone a
// una torreta, así que como dato vive aparte (POP_UP_MOUNT); lo que se elige en
// la pantalla es "Torreta doble emergente", una opción más de la misma lista,
// porque para el jugador es una montura concreta y no una casilla que marcar.

import type { TurretMountId, TurretWeaponId } from "../types/ship";

export interface TurretMount {
  id: TurretMountId;
  labelKey: string;
  /** null en la montura fija, que el manual imprime sin NT. */
  tl: number | null;
  power: number;
  tons: number;
  /** Cuántas armas caben dentro. */
  slots: number;
  /**
   * Nombre de la variante emergente, si la montura la admite. Es una clave
   * propia por idioma y no un "{montura} + emergente" armado a trozos: en
   * castellano el adjetivo va detrás y en inglés delante.
   */
  popUpLabelKey?: string;
  /** De qué tabla se eligen sus armas. Por defecto, la de torreta. */
  weapons?: "turret" | "barbette";
  /**
   * La línea se llama como el arma que lleva, no como la montura. Lo lleva la
   * barbeta: "Barbeta de partículas" ya es el nombre entero de la línea, y
   * escribir "Barbeta (barbeta de partículas)" sería decirlo dos veces.
   */
  namedByWeapon?: boolean;
}

export interface TurretWeapon {
  id: TurretWeaponId;
  labelKey: string;
  tl: number;
  power: number;
  /** Alcance y daño, tal y como los imprime la tabla: se enseñan, no se guardan. */
  rangeKey: string;
  damageKey: string;
}

export const TURRET_MOUNTS: readonly TurretMount[] = [
  // La montura fija no tiene variante emergente: va empotrada en el casco, que
  // es justo lo contrario de asomarse para disparar.
  { id: "fixed", labelKey: "shipMountFixed", tl: null, power: 0, tons: 0, slots: 1 },
  { id: "single", labelKey: "shipMountSingle", popUpLabelKey: "shipMountSinglePopUp", tl: 7, power: 1, tons: 1, slots: 1 },
  { id: "double", labelKey: "shipMountDouble", popUpLabelKey: "shipMountDoublePopUp", tl: 8, power: 1, tons: 1, slots: 2 },
  { id: "triple", labelKey: "shipMountTriple", popUpLabelKey: "shipMountTriplePopUp", tl: 9, power: 1, tons: 1, slots: 3 },
  // La barbeta no sale en la tabla de monturas: son las cinco toneladas que el
  // manual le asigna, y el NT y la potencia los pone el arma que se monte.
  {
    id: "barbette",
    labelKey: "shipMountBarbette",
    tl: null,
    power: 0,
    tons: 5,
    slots: 1,
    weapons: "barbette",
    namedByWeapon: true,
  },
];

/** Lo que el montaje emergente le suma a la montura que lo lleva. */
export const POP_UP_MOUNT = { tl: 10, power: 0, tons: 1 } as const;

export const TURRET_WEAPONS: readonly TurretWeapon[] = [
  {
    id: "missileRack",
    labelKey: "shipWeaponMissileRack",
    tl: 7,
    power: 0,
    rangeKey: "shipRangeSpecial",
    damageKey: "shipDamage4D",
  },
  {
    id: "laserDrill",
    labelKey: "shipWeaponLaserDrill",
    tl: 8,
    power: 4,
    rangeKey: "shipRangeAdjacent",
    damageKey: "shipDamage4D",
  },
  {
    id: "pulseLaser",
    labelKey: "shipWeaponPulseLaser",
    tl: 9,
    power: 4,
    rangeKey: "shipRangeLong",
    damageKey: "shipDamage2D",
  },
  {
    id: "sandcaster",
    labelKey: "shipWeaponSandcaster",
    tl: 9,
    power: 0,
    rangeKey: "shipRangeSpecial",
    damageKey: "shipDamageSpecial",
  },
  {
    id: "beamLaser",
    labelKey: "shipWeaponBeamLaser",
    tl: 10,
    power: 4,
    rangeKey: "shipRangeMedium",
    damageKey: "shipDamage1D",
  },
];

/** Las armas de barbeta: cada una es la barbeta entera, de ahí que no haya montura. */
export const BARBETTE_WEAPONS: readonly TurretWeapon[] = [
  {
    id: "missileBarbette",
    labelKey: "shipWeaponMissileBarbette",
    tl: 7,
    power: 0,
    rangeKey: "shipRangeSpecial",
    damageKey: "shipDamage4D",
  },
  {
    id: "torpedo",
    labelKey: "shipWeaponTorpedo",
    tl: 7,
    power: 2,
    rangeKey: "shipRangeSpecial",
    damageKey: "shipDamage6D",
  },
  {
    id: "particleBarbette",
    labelKey: "shipWeaponParticleBarbette",
    tl: 11,
    power: 15,
    rangeKey: "shipRangeVeryLong",
    damageKey: "shipDamage4D",
  },
  {
    id: "plasmaBarbette",
    labelKey: "shipWeaponPlasmaBarbette",
    tl: 11,
    power: 12,
    rangeKey: "shipRangeMedium",
    damageKey: "shipDamage4D",
  },
  {
    id: "fusionBarbette",
    labelKey: "shipWeaponFusionBarbette",
    tl: 12,
    power: 20,
    rangeKey: "shipRangeMedium",
    damageKey: "shipDamage5D",
  },
  {
    id: "ionCannon",
    labelKey: "shipWeaponIonCannon",
    tl: 12,
    power: 10,
    rangeKey: "shipRangeMedium",
    damageKey: "shipDamage2Dx10",
  },
  {
    id: "gravDistortion",
    labelKey: "shipWeaponGravDistortion",
    tl: 13,
    power: 10,
    rangeKey: "shipRangeShort",
    damageKey: "shipDamageSpecial",
  },
  {
    id: "tachyonCannon",
    labelKey: "shipWeaponTachyonCannon",
    tl: 14,
    power: 6,
    rangeKey: "shipRangeLong",
    damageKey: "shipDamage2D",
  },
];

/** La tabla de armas que le toca a cada montura. */
export const weaponsForMount = (mount: TurretMount): readonly TurretWeapon[] =>
  mount.weapons === "barbette" ? BARBETTE_WEAPONS : TURRET_WEAPONS;

export const findMount = (id: string): TurretMount | undefined =>
  TURRET_MOUNTS.find(mount => mount.id === id);

/** Por id, mire en la tabla que mire: los ids no se repiten entre las dos. */
export const findTurretWeapon = (id: string): TurretWeapon | undefined =>
  TURRET_WEAPONS.find(weapon => weapon.id === id) ?? BARBETTE_WEAPONS.find(weapon => weapon.id === id);
