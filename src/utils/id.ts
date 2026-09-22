/**
 * Identificador de fila. `crypto.randomUUID` no está en todos los contextos
 * (http:// en LAN, navegadores viejos), y una fila sin key rompe las listas de
 * React, así que hay un contador de respaldo.
 *
 * Vive en su propio módulo porque lo usan tanto la ficha (utils/ship.ts) como el
 * armamento (utils/turret.ts), y la ficha necesita al armamento para convertir
 * las torretas de una plantilla: si el id viviera en la ficha, los dos módulos
 * se importarían en círculo.
 */
let fallbackId = 0;

export const componentId = (): string => {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `c${Date.now().toString(36)}-${(fallbackId++).toString(36)}`;
};
