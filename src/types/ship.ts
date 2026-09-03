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

/** Una línea del bloque: "Torreta triple (rayo láser) ×2 · 2 t". */
export interface ShipComponent {
  /** Clave estable para las listas de React; no significa nada para el jugador. */
  id: string;
  /**
   * Texto libre, tal y como el manual imprime la línea, incluido el "×2" cuando
   * hay varias unidades. No hay un campo de cantidad aparte a propósito: las
   * toneladas y el precio son los del total de la línea, así que un multiplicador
   * separado solo podría contradecirlos.
   */
  label: string;
  /** null es el "—" del manual: el componente no ocupa espacio propio. */
  tons: number | null;
}

/** El recuadro "Requisitos de Potencia" de la ficha. */
export interface ShipPower {
  basic: number | null;
  mDrive: number | null;
  jDrive: number | null;
  sensors: number | null;
  weapons: number | null;
}

/**
 * Lo que la nave puede vender, y la única parte de la ficha que leen las
 * calculadoras de Carga y Pasajeros. Vive aquí porque es una propiedad de la
 * nave, no de la ruta que se está calculando.
 */
export interface ShipCapacity {
  cargoTons: number;
  berths: ShipBerths;
}

// El nombre de la nave NO vive aquí: sigue en STORAGE_KEYS.shipName, que las
// calculadoras de Carga y Pasajeros ya compartían antes de que existiera esta
// ficha. Guardarlo también dentro de la ficha crearía dos copias del mismo dato.
export interface ShipSheet {
  /** "Tipo: S", "Clase: Gacela", "Nave pequeña"... Texto libre. */
  designation: string;
  /** Diseño del manual del que se partió, solo informativo. */
  templateId: string | null;
  tl: number | null;
  hullTons: number | null;
  hullPoints: number | null;
  /** "Piloto, astronavegante, ingeniero". Texto libre: el manual también lo escribe así. */
  crew: string;
  power: ShipPower;
  sections: Record<ShipSectionKey, ShipComponent[]>;
  capacity: ShipCapacity;
  notes: string;
}

/** Suma informativa del pie de la ficha. No se valida contra el casco. */
export interface ShipTotals {
  tons: number;
}
