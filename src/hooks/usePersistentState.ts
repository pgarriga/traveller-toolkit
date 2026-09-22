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
 * Los demás componentes que leen la MISMA clave, para que no se queden atrás.
 *
 * Cada uso del hook guarda su propia copia en un `useState`, así que sin esto
 * dos componentes vivos a la vez sobre la misma clave se desincronizan: la barra
 * de navegación lista la flota y la ficha le cambia el nombre a una nave, y la
 * barra seguía enseñando el viejo hasta que algo la desmontara.
 */
const listeners = new Map<string, Set<(value: unknown) => void>>();

const notify = (key: string, value: unknown): void => {
  const subscribers = listeners.get(key);
  if (subscribers === undefined) return;
  for (const notifyOne of subscribers) notifyOne(value);
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
    // Avisar va AQUÍ y no dentro de `persist`: en la versión funcional, `write`
    // corre dentro del updater —en plena fase de render— y actualizar desde ahí
    // otro componente es justo lo que React prohíbe. Un efecto ya es después.
    notify(key, value);
  }, [key, value]);

  /**
   * Y al revés: escuchar lo que escriba otro. El type guard vuelve a pasar
   * porque quien avisa puede ser un hook con otro tipo sobre la misma clave.
   * Quien acaba de escribir se avisa a sí mismo, pero le llega el mismo objeto
   * que ya tiene y React no vuelve a renderizar.
   */
  useEffect(() => {
    const subscribers = listeners.get(key) ?? new Set<(next: unknown) => void>();
    listeners.set(key, subscribers);
    const receive = (next: unknown): void => {
      if (isValid(next)) setValue(next);
    };
    subscribers.add(receive);
    return () => {
      subscribers.delete(receive);
    };
  }, [key, isValid]);

  return [value, persist];
};
