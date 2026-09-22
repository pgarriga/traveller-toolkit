// De lo que el jugador elige en el diálogo de armamento a una fila de la ficha.
//
// La cuenta es la del manual y no hay más: el tonelaje es el de la montura (más
// una tonelada si va en montaje emergente) y la Potencia es la de la montura más
// la de cada arma que lleva dentro. Una vez insertada, la fila es texto y
// números editables como cualquier otra: nada la vuelve a calcular.

import type { ShipComponent, TurretBuild } from "../types/ship";
import type { TranslationFunction } from "../types/i18n";
import { POP_UP_MOUNT, findMount, findTurretWeapon } from "../constants/turrets";
import { componentId } from "./id";

interface TurretTotals {
  tons: number;
  power: number;
  /** El NT que la nave necesita: el más alto de la montura y de sus armas. */
  tl: number | null;
}

export const turretTotals = (build: TurretBuild): TurretTotals => {
  const mount = findMount(build.mount);
  if (mount === undefined) return { tons: 0, power: 0, tl: null };

  const weapons = build.weapons
    .slice(0, mount.slots)
    .map(id => (id === null ? undefined : findTurretWeapon(id)))
    .filter((weapon): weapon is NonNullable<typeof weapon> => weapon !== undefined);

  const tons = mount.tons + (build.popUp ? POP_UP_MOUNT.tons : 0);
  const power = mount.power + weapons.reduce((sum, weapon) => sum + weapon.power, 0);

  const levels = [mount.tl, ...weapons.map(weapon => weapon.tl)];
  if (build.popUp) levels.push(POP_UP_MOUNT.tl);
  const known = levels.filter((level): level is number => level !== null);

  return { tons, power, tl: known.length === 0 ? null : Math.max(...known) };
};

/**
 * El nombre de la línea: la montura, con su variante emergente si la lleva.
 *
 * La barbeta se llama como su arma —"Barbeta de partículas" ya lo dice todo— y
 * solo cae en el nombre genérico mientras está vacía.
 */
const turretMountLabel = (build: TurretBuild, t: TranslationFunction): string => {
  const mount = findMount(build.mount);
  if (mount === undefined) return "";

  if (mount.namedByWeapon === true) {
    const first = build.weapons[0];
    const weapon = first === null || first === undefined ? undefined : findTurretWeapon(first);
    if (weapon !== undefined) return t(weapon.labelKey);
  }

  return build.popUp && mount.popUpLabelKey !== undefined ? t(mount.popUpLabelKey) : t(mount.labelKey);
};

/**
 * Lo que lleva montado, un arma por línea y en el orden de los huecos.
 *
 * Sin agrupar las repetidas: tres láseres de pulsos son tres armas y se ven las
 * tres, que es lo que el jugador acaba de elegir hueco a hueco. La potencia que
 * va al lado es la de cada una; la de la fila —montura incluida— es la que la
 * ficha suma, y esa se enseña en la línea de la torreta.
 */
export const turretWeaponLines = (
  build: TurretBuild,
  t: TranslationFunction,
): { name: string; power: number }[] => {
  const mount = findMount(build.mount);
  if (mount === undefined) return [];
  // La barbeta no desglosa nada: su arma es el nombre de la propia línea.
  if (mount.namedByWeapon === true) return [];
  return build.weapons
    .slice(0, mount.slots)
    .map(id => (id === null ? undefined : findTurretWeapon(id)))
    .filter((weapon): weapon is NonNullable<typeof weapon> => weapon !== undefined)
    .map(weapon => ({ name: t(weapon.labelKey), power: weapon.power }));
};

/**
 * La torreta como fila de la ficha. Guarda la elección entera (`turret`), que es
 * lo que la hace no editable a mano y reabrible en el mismo diálogo.
 */
export const turretComponent = (build: TurretBuild, t: TranslationFunction): ShipComponent => {
  const { tons, power } = turretTotals(build);
  return { id: componentId(), label: turretMountLabel(build, t), tons, power, turret: build };
};
