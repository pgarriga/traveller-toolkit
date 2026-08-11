import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

/**
 * Estado que sobrevive a recargas del navegador y al botón de "nueva búsqueda".
 * Pensado para datos de nave/tripulación (habilidades, bodega, rango) que el
 * jugador cambia muy de vez en cuando, no para datos de ruta.
 *
 * El type guard es obligatorio a propósito: lo que hay en localStorage puede
 * venir de una versión anterior de la app o estar manipulado, así que nunca se
 * confía en ello sin validar.
 */
export const usePersistentState = <T>(
  key: string,
  fallback: T,
  isValid: (raw: unknown) => raw is T,
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return fallback;
      const parsed: unknown = JSON.parse(stored);
      return isValid(parsed) ? parsed : fallback;
    } catch {
      // JSON corrupto o localStorage no disponible (modo privado, cuota llena).
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Sin persistencia, pero la sesión sigue funcionando en memoria.
    }
  }, [key, value]);

  return [value, setValue];
};
