import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

const write = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin persistencia, pero la sesión sigue funcionando en memoria.
  }
};

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

  /**
   * Se guarda al cambiar el valor, no solo en el efecto: quien borra una nave y
   * vuelve al menú en el mismo clic desmonta este componente en ese mismo
   * commit, y ni el efecto ni la actualización en cola de un componente que ya
   * no se va a renderizar llegan a correr — el cambio se perdía.
   *
   * Por eso un valor ya calculado se escribe AQUÍ MISMO, fuera de React: pase lo
   * que pase con el árbol, el dato está en disco. Con una función de
   * actualización no se puede —hace falta el valor anterior—, así que esa se
   * escribe dentro, que es el caso de quien se queda en la página escribiendo.
   * En ambos casos el efecto de abajo vuelve a escribir lo mismo, sin daño.
   */
  const persist = useCallback<Dispatch<SetStateAction<T>>>(
    action => {
      if (typeof action !== "function") {
        write(key, action);
        setValue(action);
        return;
      }
      setValue(prev => {
        const next = (action as (previous: T) => T)(prev);
        write(key, next);
        return next;
      });
    },
    [key],
  );

  useEffect(() => {
    write(key, value);
  }, [key, value]);

  return [value, persist];
};
