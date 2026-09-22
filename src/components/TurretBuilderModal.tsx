import type { CSSProperties, FC } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { Language, TranslationFunction } from "../types/i18n";
import type { TurretBuild, TurretKind, TurretMountId, TurretWeaponId } from "../types/ship";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { Row } from "./ui/Row";
import { POP_UP_MOUNT, TURRET_MOUNTS, findMount, weaponsForMount } from "../constants/turrets";
import { turretTotals } from "../utils/turret";
import { formatTons } from "../utils/format";

interface TurretBuilderModalProps {
  theme: Theme;
  lang: Language;
  t: TranslationFunction;
  /** Qué se está montando: una torreta (con su montura) o una barbeta. */
  kind: TurretKind;
  onClose: () => void;
  /** Lo que ya lleva montado, cuando se abre para cambiar una torreta existente. */
  initial?: TurretBuild;
  onSave: (build: TurretBuild) => void;
}

/** Tres huecos guardados siempre: cambiar de montura no borra lo ya elegido. */
const EMPTY_SLOTS: (TurretWeaponId | null)[] = [null, null, null];

interface MountOption {
  /** "double" o "double:popUp": el desplegable es una lista plana de monturas. */
  value: string;
  mount: TurretMountId;
  popUp: boolean;
  label: string;
  tl: number | null;
  tons: number;
  power: number;
}

/**
 * Las monturas tal y como se eligen: cada torreta, y debajo su versión
 * emergente. El manual da el emergente como un "+1 t, +0 Pot." que se le suma a
 * una montura, pero eso es la cuenta; lo que se compra es "una torreta doble
 * emergente", así que es lo que la lista dice.
 */
const mountOptions = (t: TranslationFunction, kind: TurretKind): MountOption[] =>
  TURRET_MOUNTS.filter(mount => (mount.id === "barbette") === (kind === "barbette")).flatMap(mount => {
    const plain: MountOption = {
      value: mount.id,
      mount: mount.id,
      popUp: false,
      label: t(mount.labelKey),
      tl: mount.tl,
      tons: mount.tons,
      power: mount.power,
    };
    if (mount.popUpLabelKey === undefined) return [plain];
    return [
      plain,
      {
        value: `${mount.id}:popUp`,
        mount: mount.id,
        popUp: true,
        label: t(mount.popUpLabelKey),
        tl: mount.tl === null ? POP_UP_MOUNT.tl : Math.max(mount.tl, POP_UP_MOUNT.tl),
        tons: mount.tons + POP_UP_MOUNT.tons,
        power: mount.power + POP_UP_MOUNT.power,
      },
    ];
  });

/**
 * El diálogo con el que se arma una torreta: una montura, si va emergente y qué
 * arma lleva cada hueco.
 *
 * Existe porque las dos tablas del manual se combinan entre sí —cinco armas en
 * hasta tres huecos— y un menú de piezas ya montadas no puede ofrecer todas las
 * mezclas; menos aún una torreta con dos armas distintas, que es de lo más
 * corriente. Lo que sale de aquí es una fila normal de la ficha: el tonelaje y
 * la Potencia se calculan al insertarla y a partir de ahí se editan a mano.
 */
export const TurretBuilderModal: FC<TurretBuilderModalProps> = ({
  theme,
  lang,
  t,
  kind,
  initial,
  onClose,
  onSave,
}) => {
  const options = useMemo(() => mountOptions(t, kind), [t, kind]);
  const [choice, setChoice] = useState<string>(
    initial === undefined
      ? options[0].value
      : `${initial.mount}${initial.popUp ? ":popUp" : ""}`,
  );
  const [slots, setSlots] = useState<(TurretWeaponId | null)[]>(
    initial === undefined ? EMPTY_SLOTS : EMPTY_SLOTS.map((_, i) => initial.weapons[i] ?? null),
  );

  const option = options.find(item => item.value === choice) ?? options[0];
  const mount = findMount(option.mount) ?? TURRET_MOUNTS[0];
  // Cada montura elige de su tabla: la barbeta no monta láseres de torreta.
  const weapons = weaponsForMount(mount);
  const valid = (id: TurretWeaponId | null): TurretWeaponId | null =>
    id !== null && weapons.some(weapon => weapon.id === id) ? id : null;
  const build = useMemo<TurretBuild>(
    () => ({
      mount: option.mount,
      popUp: option.popUp,
      weapons: slots.slice(0, mount.slots).map(valid),
    }),
    // `valid` se rehace en cada render y no puede ir en la lista: lo que decide
    // el resultado es la montura, que sí está.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [option.mount, option.popUp, slots, mount.slots],
  );
  const totals = turretTotals(build);

  const inputStyle: CSSProperties = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    color: theme.text,
    fontSize: 14,
    width: "100%",
    fontFamily: "inherit",
  };

  const tl = (level: number | null): string => (level === null ? "—" : `${t("shipTlShort")}${level}`);

  const setSlot = (index: number, value: TurretWeaponId | null): void =>
    setSlots(prev => prev.map((slot, i) => (i === index ? value : slot)));

  return (
    <Modal
      theme={theme}
      title={
        kind === "barbette"
          ? initial === undefined
            ? t("shipBarbetteTitle")
            : t("shipBarbetteEdit")
          : initial === undefined
            ? t("shipTurretTitle")
            : t("shipTurretEdit")
      }
      closeLabel={t("close")}
      onClose={onClose}
      maxWidth={520}
      footer={
        <>
          <Button variant="ghost" size="md" theme={theme} onClick={onClose}>
            {t("close")}
          </Button>
          <Button variant="primary" size="md" theme={theme} onClick={() => onSave(build)}>
            {initial === undefined ? t("shipTurretAdd") : t("shipTurretSave")}
          </Button>
        </>
      }
    >
      {/* La barbeta no tiene montura que elegir: es ella misma, cinco toneladas. */}
      {options.length > 1 && (
        <Field label={t("shipTurretMount")} theme={theme}>
          {id => (
            <select id={id} style={inputStyle} value={choice} onChange={e => setChoice(e.target.value)}>
              {options.map(item => (
                <option key={item.value} value={item.value}>
                  {`${item.label} — ${tl(item.tl)} · ${item.tons} t · ${item.power} ${t("shipPowerUnit")}`}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}

      <div style={{ marginTop: options.length > 1 ? 12 : 0, display: "grid", gap: 12 }}>
        {Array.from({ length: mount.slots }, (_, index) => (
          <Field
            key={index}
            label={mount.slots === 1 ? t("shipTurretWeapon") : `${t("shipTurretWeapon")} ${index + 1}`}
            theme={theme}
          >
            {id => (
              <select
                id={id}
                style={inputStyle}
                value={valid(slots[index] ?? null) ?? ""}
                onChange={e => setSlot(index, e.target.value === "" ? null : (e.target.value as TurretWeaponId))}
              >
                <option value="">{t("shipTurretEmptySlot")}</option>
                {weapons.map(weapon => (
                  <option key={weapon.id} value={weapon.id}>
                    {`${t(weapon.labelKey)} — ${tl(weapon.tl)} · ${weapon.power} ${t("shipPowerUnit")} · ${t(weapon.rangeKey)} · ${t(weapon.damageKey)}`}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ))}
      </div>

      <div style={{ marginTop: 14, borderTop: `1px solid ${theme.border}`, paddingTop: 10 }}>
        <Row label={t("shipColTons")} value={`${formatTons(totals.tons, lang)} t`} theme={theme} />
        <Row label={t("shipColPower")} value={`${totals.power} ${t("shipPowerUnit")}`} theme={theme} />
        <Row label={t("shipTurretMinTl")} value={tl(totals.tl)} theme={theme} />
      </div>

      <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 10, lineHeight: 1.5 }}>
        {t("shipTurretHint")}
      </div>
    </Modal>
  );
};
