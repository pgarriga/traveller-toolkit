import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TranslationFunction } from "../types/i18n";
import type { ShipBerths } from "../types/passenger";
import type { Fleet, ShipRatings, ShipSheet } from "../types/ship";
import type { ShipTemplate } from "../constants/shipTemplates";
import { STORAGE_KEYS, isFiniteNumber, isString } from "../constants/storage";
import { QTY_SECTIONS, emptySections } from "../constants/ship";
import {
  NO_BERTHS,
  componentId,
  emptyShip,
  isFleet,
  isShipBerths,
  isShipSheet,
  newShip,
  cargoCapacityTons,
  withCargoTons,
  withCountFromLabel,
} from "../utils/ship";
import { usePersistentState } from "./usePersistentState";

interface UseShipReturn {
  /** Todas las naves creadas, en el orden en que se crearon. */
  ships: ShipSheet[];
  /** La nave que se está usando. null solo con la flota vacía. */
  ship: ShipSheet | null;
  activeId: string | null;
  /** Nombre de la nave activa, "" si no hay ninguna. */
  name: string;
  setName: (name: string) => void;
  /** Crea la nave y la deja activa. El tipo se decide aquí y ya no se cambia. */
  createShip: (name: string, template: ShipTemplate | null, t: TranslationFunction) => void;
  selectShip: (id: string) => void;
  deleteShip: (id: string) => void;
  /** Edita la nave activa. Sin nave activa no hay nada que editar y no hace nada. */
  setShip: Dispatch<SetStateAction<ShipSheet>>;
  /** Bodega y plazas de la nave activa: lo único que leen Carga y Pasajeros. */
  /**
   * Lo que las calculadoras preguntan: la bodega, SUMADA de las filas de carga
   * de la ficha, y las plazas, que sí están guardadas. No es el `ShipCapacity`
   * de la ficha —ahí ya no hay bodega— sino la lectura que se hace de ella.
   */
  capacity: { cargoTons: number; berths: ShipBerths };
  setCargoTons: (tons: number, label: string) => void;
  setBerths: (berths: ShipBerths) => void;
}

/** Lectura suelta de localStorage, para las claves heredadas que ya no tienen hook. */
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

const EMPTY_FLEET: Fleet = { ships: [], activeId: null };

/** Ficha sin calificar: ninguna decide nada hasta que el jugador la elige. */
const NO_RATINGS: ShipRatings = { thrust: null, reaction: false, jump: null, sensors: null, powerPlant: null };

/**
 * Rellena lo que una ficha guardada por una versión anterior pueda no traer: una
 * sección que se añadiese después, la lista de tripulación, las calificaciones
 * con las que se calcula la energía, o —desde que hay flota— su identidad y su
 * nombre. El type guard las deja pasar; aquí dejan de faltar.
 */
const normalise = (sheet: ShipSheet): ShipSheet => {
  const sections = { ...emptySections(), ...sheet.sections };
  // La bodega dejó de ser una cifra suelta para ser lo que suman sus filas. Una
  // ficha guardada antes trae la cifra y puede no traer la fila: se la damos.
  const legacyCargoTons = (sheet.capacity as { cargoTons?: number }).cargoTons ?? 0;
  if (legacyCargoTons > 0 && sections.cargo.length === 0) {
    sections.cargo = withCargoTons([], legacyCargoTons, "");
  }
  // El alojamiento lleva cantidad desde que se puede contar camarotes; las
  // fichas anteriores traen ese número dentro del nombre. Ver withCountFromLabel.
  for (const key of QTY_SECTIONS) sections[key] = sections[key].map(withCountFromLabel);
  return {
    ...sheet,
    id: sheet.id ?? componentId(),
    name: sheet.name ?? "",
    crewList: sheet.crewList ?? [],
    cargoHold: sheet.cargoHold ?? [],
    // Campo a campo, no el objeto entero: una ficha puede traer `ratings` pero no
    // una calificación que se añadiese después, y ahí un `??` no llegaría.
    ratings: { ...NO_RATINGS, ...sheet.ratings },
    sections,
  };
};

const berthTotal = (berths: ShipBerths): number => berths.high + berths.middle + berths.basic + berths.low;

/**
 * Una ficha que nadie ha tocado: la que se guardaba sola con solo abrir "Mi
 * nave". No es una nave del jugador, así que no se migra como tal —si lo fuera,
 * la flota empezaría con una nave en blanco que él nunca creó.
 */
const isUntouched = (sheet: ShipSheet): boolean =>
  sheet.name.trim() === "" &&
  sheet.designation.trim() === "" &&
  sheet.notes.trim() === "" &&
  sheet.crew.trim() === "" &&
  sheet.crewList.length === 0 &&
  sheet.tl === null &&
  sheet.hullTons === null &&
  sheet.hullPoints === null &&
  berthTotal(sheet.capacity.berths) === 0 &&
  Object.values(sheet.sections).every(rows => rows.length === 0);

/**
 * La flota de un jugador que ya usaba la app antes de que hubiera flota: su
 * ficha única —con el nombre que tenía suelto— pasa a ser su primera nave. Si
 * nunca llegó a abrir "Mi nave" pero había puesto bodega o plazas en las
 * calculadoras, esas dos cifras también fundan una nave, para que no aparezcan
 * a cero la próxima vez.
 */
const initialFleet = (): Fleet => {
  const stored = readLegacy(STORAGE_KEYS.ship, isShipSheet);
  const legacyName = readLegacy(STORAGE_KEYS.shipName, isString) ?? "";
  const legacyCargo = readLegacy(STORAGE_KEYS.freightCargoBay, isFiniteNumber) ?? 0;
  const legacyBerths = readLegacy(STORAGE_KEYS.passengerBerths, isShipBerths) ?? { ...NO_BERTHS };

  const base = stored === null ? null : normalise(stored);
  const sheet: ShipSheet | null =
    base === null
      ? null
      : { ...base, name: base.name.trim() === "" ? legacyName : base.name };

  if (sheet !== null) {
    return isUntouched(sheet) ? EMPTY_FLEET : { ships: [sheet], activeId: sheet.id };
  }

  if (legacyName.trim() === "" && legacyCargo === 0 && berthTotal(legacyBerths) === 0) return EMPTY_FLEET;

  const blank = emptyShip();
  const migrated: ShipSheet = {
    ...blank,
    name: legacyName,
    // La bodega que tecleó en la calculadora pasa a ser su fila de carga, que es
    // donde vive ahora. Sin nombre: nadie se lo puso, y el jugador lo escribirá.
    sections: { ...blank.sections, cargo: withCargoTons([], legacyCargo, "") },
    capacity: { berths: legacyBerths },
  };
  return { ships: [migrated], activeId: migrated.id };
};

/**
 * La flota del jugador y, dentro de ella, la nave que está usando.
 *
 * Una nave se crea entera —nombre y tipo— y a partir de ahí la ficha es suya:
 * el tipo ya no se toca, porque cambiarlo sustituiría todos los componentes de
 * una ficha editada, y eso es otra nave. Las calculadoras de Carga y Pasajeros
 * leen siempre la activa, que es la única forma de que sepan de qué nave hablan.
 */
export const useShip = (): UseShipReturn => {
  // Memorizado porque initialFleet() lee localStorage: sin esto se construiría
  // una flota de respaldo en cada render para descartarla acto seguido.
  const fallback = useMemo(initialFleet, []);
  const [stored, setStored] = usePersistentState<Fleet>(STORAGE_KEYS.fleet, fallback, isFleet);

  // Las fichas guardadas se rellenan al leerlas, igual que antes: nadie fuera de
  // este hook tiene por qué saber qué campos pueden faltarle a una ficha vieja.
  const fleet = useMemo<Fleet>(
    () => ({ ships: stored.ships.map(normalise), activeId: stored.activeId }),
    [stored],
  );

  const ship = useMemo<ShipSheet | null>(
    () => fleet.ships.find(s => s.id === fleet.activeId) ?? null,
    [fleet],
  );

  // Las tres van con el valor ya calculado y no con una función: crear, cambiar
  // de nave y borrar suelen ir seguidos de una navegación en el mismo clic, y un
  // valor ya calculado se guarda en el acto aunque el componente se desmonte en
  // ese mismo commit. Ver usePersistentState.
  const createShip = useCallback(
    (shipName: string, template: ShipTemplate | null, t: TranslationFunction): void => {
      const created = newShip(shipName, template, t);
      setStored({ ships: [...stored.ships, created], activeId: created.id });
    },
    [setStored, stored],
  );

  const selectShip = useCallback(
    (id: string): void => setStored({ ...stored, activeId: id }),
    [setStored, stored],
  );

  const deleteShip = useCallback(
    (id: string): void => {
      const ships = stored.ships.filter(sheet => sheet.id !== id);
      // Al borrar la activa manda la primera que quede: una flota con naves y
      // sin activa dejaría a las calculadoras sin bodega ni plazas.
      const activeId = stored.activeId === id ? ships[0]?.id ?? null : stored.activeId;
      setStored({ ships, activeId });
    },
    [setStored, stored],
  );

  const setShip = useCallback<Dispatch<SetStateAction<ShipSheet>>>(
    value =>
      setStored(prev => ({
        ...prev,
        ships: prev.ships.map(sheet => {
          if (sheet.id !== prev.activeId) return sheet;
          const filled = normalise(sheet);
          return typeof value === "function" ? value(filled) : value;
        }),
      })),
    [setStored],
  );

  const setName = useCallback(
    (name: string) => setShip(prev => ({ ...prev, name })),
    [setShip],
  );

  /**
   * La bodega escrita desde la calculadora de Carga. Va a la sección de carga de
   * la ficha, que es donde vive: teclearla ahí cambia la línea de Detalles, y la
   * pestaña de bodega y el perfil lo enseñan al momento. `label` solo se usa si
   * hay que crear la fila, porque una línea sin nombre no dice qué es.
   */
  const setCargoTons = useCallback(
    (cargoTons: number, label: string) =>
      setShip(prev => ({
        ...prev,
        sections: { ...prev.sections, cargo: withCargoTons(prev.sections.cargo, cargoTons, label) },
      })),
    [setShip],
  );

  const setBerths = useCallback(
    (berths: ShipBerths) => setShip(prev => ({ ...prev, capacity: { ...prev.capacity, berths } })),
    [setShip],
  );

  return {
    ships: fleet.ships,
    ship,
    activeId: fleet.activeId,
    name: ship?.name ?? "",
    setName,
    createShip,
    selectShip,
    deleteShip,
    setShip,
    // La bodega no está guardada: se suma de las filas de carga cada vez.
    capacity: {
      cargoTons: ship === null ? 0 : cargoCapacityTons(ship),
      berths: ship?.capacity.berths ?? { ...NO_BERTHS },
    },
    setCargoTons,
    setBerths,
  };
};
