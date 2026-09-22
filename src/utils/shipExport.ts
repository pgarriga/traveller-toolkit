// Exportar la ficha de una nave como fichero.
//
// Se exporta el `ShipSheet` tal cual se guarda, sin envoltorio: así el fichero
// es exactamente lo que `isShipSheet` (utils/ship.ts) ya sabe validar, que es lo
// que hará falta el día que haya un botón de importar.

import type { ShipSheet } from "../types/ship";

/** "Sombra de Nix" → "sombra-de-nix". Sin acentos: el nombre viaja como fichero. */
const slug = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** El nombre del fichero; `fallback` cubre la nave sin nombre, ya traducido. */
export const shipFileName = (ship: ShipSheet, fallback: string): string =>
  `${slug(ship.name) || slug(fallback) || "ship"}.json`;

export const shipJsonFile = (ship: ShipSheet, fallback: string): File =>
  new File([JSON.stringify(ship, null, 2)], shipFileName(ship, fallback), {
    type: "application/json",
  });
