import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ShipBerths } from "../types/passenger";
import type { ShipCapacity, ShipSheet } from "../types/ship";
import { STORAGE_KEYS, isFiniteNumber, isString } from "../constants/storage";
import { emptySections } from "../constants/ship";
import { NO_BERTHS, emptyShip, isShipBerths, isShipSheet } from "../utils/ship";
import { usePersistentState } from "./usePersistentState";

interface UseShipReturn {
  /** Vive en su propia clave porque las calculadoras ya lo compartían. */
  name: string;
  setName: (name: string) => void;
  ship: ShipSheet;
  setShip: Dispatch<SetStateAction<ShipSheet>>;
  /** Bodega y plazas: lo único de la ficha que leen Carga y Pasajeros. */
  capacity: ShipCapacity;
  setCargoTons: (tons: number) => void;
  setBerths: (berths: ShipBerths) => void;
}

/** Lectura suelta de localStorage, para las claves que ya no tienen hook propio. */
const readLegacy = <T,>(key: string, isValid: (raw: unknown) => raw is T): T | null => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return null;
    const parsed: unknown = JSON.parse(stored);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Ficha de partida de un jugador que ya usaba la app antes de que "Mi nave"
 * existiera: la bodega y las plazas que tuviera puestas en las calculadoras se
 * traen a la ficha en lugar de aparecer a cero.
 */
const initialShip = (): ShipSheet => ({
  ...emptyShip(),
  capacity: {
    cargoTons: readLegacy(STORAGE_KEYS.freightCargoBay, isFiniteNumber) ?? 0,
    berths: readLegacy(STORAGE_KEYS.passengerBerths, isShipBerths) ?? { ...NO_BERTHS },
  },
});

/**
 * La nave del jugador: la ficha de "Mi nave" y las dos capacidades que las
 * calculadoras de Carga y Pasajeros leen de ella.
 *
 * Hay una sola nave, no una flota, porque la herramienta se llama "Mi nave" y
 * porque las calculadoras necesitan saber sin ambigüedad de qué nave hablan.
 */
export const useShip = (): UseShipReturn => {
  const [name, setName] = usePersistentState<string>(STORAGE_KEYS.shipName, "", isString);
  // Memorizado porque initialShip() lee localStorage: sin esto se construiría
  // una ficha de respaldo en cada render para descartarla acto seguido.
  const fallback = useMemo(initialShip, []);
  const [stored, setShip] = usePersistentState<ShipSheet>(STORAGE_KEYS.ship, fallback, isShipSheet);

  // Una ficha guardada por una versión anterior puede no traer una sección que
  // se añadiese después. El type guard la deja pasar y aquí se rellena vacía,
  // para que las vistas puedan leer ship.sections[key] sin comprobar nada.
  const ship = useMemo<ShipSheet>(() => ({ ...stored, sections: { ...emptySections(), ...stored.sections } }), [stored]);

  const setCargoTons = useCallback(
    (cargoTons: number) => setShip(prev => ({ ...prev, capacity: { ...prev.capacity, cargoTons } })),
    [setShip],
  );

  const setBerths = useCallback(
    (berths: ShipBerths) => setShip(prev => ({ ...prev, capacity: { ...prev.capacity, berths } })),
    [setShip],
  );

  return { name, setName, ship, setShip, capacity: ship.capacity, setCargoTons, setBerths };
};
