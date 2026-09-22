// Exportar e importar la ficha de una nave como fichero.
//
// Se exporta el `ShipSheet` tal cual se guarda, sin envoltorio: así el fichero
// es exactamente lo que `isShipSheet` (utils/ship.ts) ya sabe validar, y la
// importación no necesita saber nada más que eso.

import type { ShipSheet } from "../types/ship";
import { componentId, isShipSheet } from "./ship";

/** "Sombra de Nix" → "sombra-de-nix". Sin acentos: el nombre viaja como fichero. */
const slug = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** El nombre del fichero; `fallback` cubre la nave sin nombre, ya traducido. */
const shipFileName = (ship: ShipSheet, fallback: string): string =>
  `${slug(ship.name) || slug(fallback) || "ship"}.json`;

export const shipJsonFile = (ship: ShipSheet, fallback: string): File =>
  new File([JSON.stringify(ship, null, 2)], shipFileName(ship, fallback), {
    type: "application/json",
  });

/**
 * Un fichero exportado, de vuelta a una ficha — o null si no lo es.
 *
 * La nave entra con un id NUEVO aunque el fichero traiga el suyo: quien importa
 * la nave de otro jugador, o la suya dos veces, acabaría con dos naves con la
 * misma clave dentro de la flota, y entonces ni la lista sabe cuál dibujar ni
 * `activeId` sabe a cuál señala.
 *
 * Lo que traiga de menos —una sección, la bodega, el sueldo: lo que se haya
 * añadido desde que se exportó— no se rellena aquí. De eso se encarga
 * `normalise` en useShip, que ya lo hace con todas las naves de la flota.
 */
export const shipFromJson = (text: string): ShipSheet | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  return isShipSheet(parsed) ? { ...parsed, id: componentId() } : null;
};
