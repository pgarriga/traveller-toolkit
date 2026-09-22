// "Mi nave": ficha de nave editable.
//
// La ficha reproduce el bloque de estadísticas con el que el manual básico
// presenta cada nave (NT, casco, motores, armas, camarotes...), pero NO aplica
// las reglas de construcción: no valida el tonelaje contra el casco. Es la hoja
// del jugador, y él manda sobre cada número.
//
// El dinero se queda fuera a propósito: ni precio por línea, ni precio de
// compra, ni mantenimiento. La ficha dice qué lleva la nave y cuánto ocupa; lo
// que costó no se juega desde aquí.
//
// Por eso las etiquetas de los componentes son texto libre: se rellenan
// traducidas al insertarlas desde el catálogo (constants/shipParts.ts) o al
// cargar un diseño del manual (constants/shipTemplates.ts), y a partir de ahí
// pertenecen a la ficha. Cambiar de idioma no reescribe una ficha ya guardada,
// igual que no reescribe el nombre que el jugador le puso a su nave.

import type { ShipBerths } from "./passenger";

/** Las filas del bloque de estadísticas, en el orden en que las imprime el manual. */
export type ShipSectionKey =
  | "hull"
  | "armour"
  | "mDrive"
  | "jDrive"
  | "powerPlant"
  | "fuel"
  | "bridge"
  | "computer"
  | "sensors"
  | "weapons"
  | "ammo"
  | "craft"
  | "systems"
  | "software"
  | "staterooms"
  | "commonAreas"
  | "cargo";

/**
 * Dónde va montada un arma. Las cuatro primeras son la tabla de monturas (el
 * emergente va aparte: es un extra que se le suma a una torreta); la barbeta no
 * está en esa tabla porque no es una montura que se llene, es un arma de cinco
 * toneladas con su propia tabla.
 */
export type TurretMountId = "fixed" | "single" | "double" | "triple" | "barbette";

/** Las cinco armas de torreta y las ocho de barbeta del manual básico. */
export type TurretWeaponId =
  | "missileRack"
  | "laserDrill"
  | "pulseLaser"
  | "sandcaster"
  | "beamLaser"
  | "missileBarbette"
  | "torpedo"
  | "particleBarbette"
  | "plasmaBarbette"
  | "fusionBarbette"
  | "ionCannon"
  | "gravDistortion"
  | "tachyonCannon";

/** Cuál de las dos tablas de armamento se está montando. */
export type TurretKind = "turret" | "barbette";

/**
 * Lo que el jugador elige al montar una torreta: la montura, si va en montaje
 * emergente y qué arma lleva cada hueco (null = hueco vacío, que es legal — el
 * manual vende torretas vacías).
 *
 * No se guarda en la ficha: se convierte en una fila de texto como cualquier
 * otra y a partir de ahí es editable a mano. Ver utils/turret.ts.
 */
export interface TurretBuild {
  mount: TurretMountId;
  popUp: boolean;
  weapons: readonly (TurretWeaponId | null)[];
}

/** Una línea del bloque: "Torreta triple (rayo láser) ×2 · 2 t". */
export interface ShipComponent {
  /** Clave estable para las listas de React; no significa nada para el jugador. */
  id: string;
  /**
   * Texto libre, tal y como el manual imprime la línea, incluido el "×2" cuando
   * hay varias unidades. Fuera del alojamiento no hay un campo de cantidad
   * aparte a propósito: las toneladas son las del total de la línea, así que un
   * multiplicador separado solo podría contradecirlas.
   */
  label: string;
  /** null es el "—" del manual: el componente no ocupa espacio propio. */
  tons: number | null;
  /**
   * Cuántas unidades iguales lleva la línea. Solo la llevan las secciones que
   * cuentan piezas en vez de describirlas —el alojamiento: camarotes, camarotes
   * de lujo, literas frías— porque son las únicas que se suman y se restan en la
   * mesa: un camarote son 4 t y una litera fría 0,5 t, y el jugador que embarca
   * pasaje lo que cambia es cuántos hay, no cuánto ocupa cada uno.
   *
   * `tons` sigue siendo el TOTAL de la línea, aquí como en el resto de la ficha.
   * Cambiar la cantidad lo multiplica por lo que ocupaba una unidad (ver
   * `withQuantity` en utils/ship.ts), y las dos celdas siguen siendo editables:
   * es un cálculo al teclear, no una regla que la ficha imponga.
   */
  qty?: number;
  /**
   * Puntos de Potencia que la línea pide. Solo lo llevan las armas y su munición
   * —el resto de la nave se calcula con las fórmulas del manual—, porque cada
   * arma declara los suyos en su propia descripción y no hay tabla que los dé.
   */
  power?: number | null;
  /**
   * Lo que hay montado, cuando la línea es una torreta armada desde el diálogo.
   *
   * Una línea así NO se edita a mano: el nombre, las toneladas y la potencia
   * salen de esta elección, y tocarlos por separado solo podría contradecirla.
   * Se vuelve a abrir el mismo diálogo y se cambia ahí. El resto de las líneas
   * de armamento —las que trae una plantilla, o las escritas a mano— siguen
   * siendo texto libre.
   */
  turret?: TurretBuild;
}

/** Los tipos de la tabla de plantas de energía, que dan energía por tonelada. */
export type PowerPlantType = "fission" | "chemical" | "fusion8" | "fusion12" | "fusion15" | "antimatter";

/** Los cinco grados de la tabla de sensores, más la suite de contramedidas. */
export type SensorGrade = "basic" | "civilian" | "military" | "improved" | "advanced" | "countermeasures";

/**
 * Lo que la nave *es capaz de hacer*, que es de donde salen sus necesidades de
 * energía. No son componentes: son las calificaciones que el manual imprime
 * junto al nombre del motor ("Motor de maniobra 2", "Motor de salto-2").
 */
export interface ShipRatings {
  /** Propulsión máxima del motor de maniobra. 0 es válido y gasta un cuarto. */
  thrust: number | null;
  /** Los motores de reacción no piden puntos de Potencia. */
  reaction: boolean;
  /** Número de salto máximo del motor de salto. */
  jump: number | null;
  sensors: SensorGrade | null;
  /** Tipo de planta: con sus toneladas da la energía que la nave produce. */
  powerPlant: PowerPlantType | null;
}

/**
 * El recuadro "Potencia", calculado — no guardado.
 *
 * Es la única cuenta que la ficha hace de verdad, y la hace porque son reglas
 * cerradas del manual (20 % del casco para los sistemas básicos, 10 % por punto
 * de Propulsión y de salto) y no una validación: nada compara este total con lo
 * que dé la planta de energía. Ver `shipPowerRequirements` en utils/ship.ts.
 */
export interface ShipPower {
  basic: number;
  mDrive: number;
  jDrive: number;
  sensors: number;
  weapons: number;
  /** Lo que la planta produce, para poner al lado lo que pide cada sistema. */
  available: number;
  /**
   * Las dos situaciones que sí se juegan, para poder preguntarle a la ficha si
   * la planta llega. NO hay un total de los cinco: sumarlos supondría una nave
   * con todo encendido a la vez, que no existe. Lo que el manual describe son
   * dos configuraciones, y en cada una la energía se desvía a lo que toca.
   */
  modes: {
    /** Combate: todo menos el salto —no se salta disparando—. */
    combat: number;
    /** Salto: el motor de salto y los sistemas básicos, y nada más. */
    jump: number;
  };
}

/**
 * Las plazas de pasajero, que la calculadora de Pasajeros lee y escribe. Viven
 * aquí porque son una propiedad de la nave, no de la ruta que se está calculando.
 *
 * La bodega NO está aquí: es la suma de las filas de la sección de carga, que es
 * donde el manual la imprime y donde la ficha la edita. Ver `cargoCapacityTons`.
 * Las plazas no pueden salir de los camarotes de la misma manera, porque el
 * manual no reparte un camarote entre clases de pasaje.
 */
export interface ShipCapacity {
  berths: ShipBerths;
}

// El nombre de la nave vive DENTRO de la ficha desde que hay flota: con varias
// naves guardadas, una clave suelta no podría decir de cuál de ellas es el
// nombre. STORAGE_KEYS.shipName se quedó como clave heredada, y solo se lee una
// vez para no perder el nombre del jugador que ya tenía una nave. Ver
// hooks/useShip.ts.
/**
 * Una persona a bordo.
 *
 * No tiene nada que ver con `ShipSheet.crew`, que es la tripulación que el
 * DISEÑO exige ("Piloto, astronavegante, ingeniero") y viene de la plantilla.
 * Esto es quién la cubre de verdad en la mesa, y puede sobrar o faltar gente.
 */
export interface CrewMember {
  id: string;
  name: string;
  /** Texto libre; se rellena traducido al añadir desde el menú de oficios. */
  role: string;
  /**
   * Lo que cobra al mes, en créditos. null es el sueldo sin decidir, no un cero.
   *
   * Es el único dinero de toda la ficha, y es a propósito: lo que la nave costó
   * no se juega, pero la nómina de la tripulación sí —se paga cada mes, salga o
   * no salga el flete—. La ficha no la suma ni la compara con nada; es un dato
   * de cada persona, como su puesto.
   */
  salary: number | null;
}

/**
 * Un bulto de la bodega.
 *
 * No es un componente de la nave: la bodega es el hueco, y esto es lo que hay
 * dentro esta semana. Por eso vive aparte de `sections.cargo` —que es la LÍNEA
 * del bloque de estadísticas, las toneladas de hueco que la nave dedica a la
 * carga— y por eso cargar un diseño del manual no lo toca: un casco nuevo no
 * viene con la mercancía puesta.
 */
export interface CargoItem {
  id: string;
  /** Qué es: "Repuestos", "Grano", "Lote menor #3"... Texto libre. */
  label: string;
  /** Lo que ocupa. null es el bulto cuyo tamaño todavía no se ha apuntado. */
  tons: number | null;
}

export interface ShipSheet {
  /** Clave estable de la nave dentro de la flota. No significa nada para el jugador. */
  id: string;
  /** El nombre que el jugador le puso. Lo eligió al crearla y puede cambiarlo. */
  name: string;
  /** "Tipo: S", "Clase: Gacela", "Nave pequeña"... Texto libre. */
  designation: string;
  /**
   * El TIPO de la nave: el diseño del manual con el que se creó, o null si se
   * creó personalizada. Se elige UNA vez, en el formulario de creación, y desde
   * ahí la ficha solo lo enseña: cambiarlo después sustituiría todos los
   * componentes de una ficha que el jugador ya ha editado, y eso es crear otra
   * nave, no editar esta. Ver `shipTypeName` en utils/ship.ts.
   */
  templateId: string | null;
  tl: number | null;
  hullTons: number | null;
  hullPoints: number | null;
  /** Tripulación que el diseño EXIGE: "Piloto, astronavegante, ingeniero". Texto libre, como en el manual. */
  crew: string;
  /** Quién va a bordo de verdad. Lo pone el jugador; ninguna plantilla lo trae. */
  crewList: CrewMember[];
  ratings: ShipRatings;
  sections: Record<ShipSectionKey, ShipComponent[]>;
  capacity: ShipCapacity;
  /** Lo que la bodega lleva ahora mismo. Ver CargoItem. */
  cargoHold: CargoItem[];
  notes: string;
}

/**
 * La flota del jugador: todas las naves que ha creado y cuál es la que está
 * usando.
 *
 * Hay varias naves porque una partida cambia de nave —se vende, se pierde, se
 * hereda—, pero solo una está activa: las calculadoras de Carga y Pasajeros leen
 * la bodega y las plazas de UNA nave, y sin una activa no sabrían de cuál hablan.
 */
export interface Fleet {
  ships: ShipSheet[];
  /** null solo mientras la flota está vacía. */
  activeId: string | null;
}
