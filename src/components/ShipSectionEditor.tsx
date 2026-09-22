import type { ChangeEvent, CSSProperties, FC, ReactNode } from "react";
import { useId } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import type { ShipComponent, ShipSectionKey } from "../types/ship";
import { Button } from "./ui/Button";
import { fieldLabelStyle } from "./ui/Field";
import { IconTrash } from "./icons";
import { partsForSection } from "../constants/shipParts";
import { withQuantity } from "../utils/ship";
import { turretWeaponLines } from "../utils/turret";

interface ShipSectionEditorProps {
  theme: Theme;
  t: TranslationFunction;
  sectionKey: ShipSectionKey;
  titleKey: string;
  components: ShipComponent[];
  /**
   * Casco y motores: sin menú de añadir y sin poder quedarse sin ninguna línea.
   * Ver FIXED_SECTIONS en constants/ship.ts.
   */
  fixed: boolean;
  /** El modo "eliminar filas" de la pestaña: sin él no hay papelera ni columna. */
  showRemove: boolean;
  /**
   * Columna de puntos de Potencia. La lleva la tarjeta de armamento entera
   * —armas y munición— porque la cabecera de columnas es de la tarjeta, no de
   * cada sección: si solo la pintara una, la otra saldría descuadrada.
   */
  showPower: boolean;
  /**
   * Columna de cantidad. La lleva la tarjeta de alojamiento: sus líneas son
   * piezas iguales y repetidas —camarotes de 4 t, literas frías de 0,5 t— y lo
   * que cambia en la mesa es cuántas hay. Ver QTY_SECTIONS en constants/ship.ts.
   */
  showQty: boolean;
  /**
   * Sustituye la casilla del nombre en la primera línea. Los motores no se
   * escriben: su línea *es* su calificación ("Propulsión 2"), así que se elige de
   * un desplegable y al lado quedan sus toneladas, sin un campo de texto que
   * pudiera decir otra cosa que el selector.
   */
  ratingCell?: (component: ShipComponent) => ReactNode;
  /**
   * Entradas del menú de añadir que abren un diálogo en vez de insertar una
   * pieza. Las usa el armamento: una torreta o una barbeta no se eligen de una
   * lista, se arman —montura más armas— en un formulario aparte.
   *
   * Es el MISMO desplegable que el resto de las secciones, con otras opciones
   * dentro: añadir es añadir, y dos botones naranjas donde las demás tienen un
   * menú hacían de la tarjeta de armamento otra cosa. Lo que sigue en pie es la
   * regla: una sección con `builders` no enseña el catálogo, porque por ahí no
   * se pone un arma en la ficha.
   */
  builders?: readonly { label: string; onOpen: () => void }[];
  /**
   * El interruptor de "eliminar filas", que se pinta a la derecha del menú de
   * añadir: quitar y poner líneas son la misma faena y se hacen desde el mismo
   * sitio. Manda sobre la TARJETA entera —`showRemove` es de la tarjeta, porque
   * su cabecera de columnas es una sola— así que solo lo recibe una de sus
   * secciones, la primera que tenga algo que quitar.
   */
  removeToggle?: ReactNode;
  /** Reabre el diálogo sobre una torreta ya montada: es su única forma de edición. */
  onEditTurret?: (componentId: string) => void;
  /** null pide una fila en blanco; un id del catálogo la trae rellenada. */
  onAdd: (partId: string | null) => void;
  onUpdate: (componentId: string, patch: Partial<ShipComponent>) => void;
  onRemove: (componentId: string) => void;
}

/** "" en un campo numérico es el "—" del manual, no un cero. */
const parseNullableNumber = (raw: string): number | null => {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

/**
 * La línea que una sección fija enseña cuando la ficha aún no tiene ninguna.
 * No está guardada: escribir en ella es lo que la crea (ver onUpdate con id "").
 */
const BLANK_ROW: ShipComponent = { id: "", label: "", tons: null };

/**
 * Una fila del bloque de estadísticas: el nombre de la sección a la izquierda y
 * sus componentes debajo, como los imprime el manual, pero con cada celda
 * editable y un botón para quitar la línea.
 */
export const ShipSectionEditor: FC<ShipSectionEditorProps> = ({
  theme,
  t,
  sectionKey,
  titleKey,
  components,
  fixed,
  showRemove,
  showPower,
  showQty,
  ratingCell,
  builders,
  removeToggle,
  onEditTurret,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const addId = useId();
  const listId = useId();
  const parts = partsForSection(sectionKey);
  const title = t(titleKey);
  // Una sección fija siempre tiene algo que editar: si la ficha está en blanco
  // se enseña una línea vacía en lugar del "sin componentes".
  const rows = fixed && components.length === 0 ? [BLANK_ROW] : components;
  const rowClass =
    "ship-sheet-row" +
    (showPower ? " ship-sheet-row--power" : "") +
    (showQty ? " ship-sheet-row--qty" : "") +
    (showRemove ? " ship-sheet-row--removable" : "");
  // Quitar la única línea del casco dejaría al jugador sin dónde escribirlo.
  const canRemove = !fixed || rows.length > 1;

  const inputStyle: CSSProperties = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    // 8px arriba y abajo como el resto de los campos de la app; el horizontal se
    // recorta porque las columnas numéricas son estrechas.
    padding: "8px 10px",
    color: theme.text,
    fontSize: 14,
    width: "100%",
    fontFamily: "inherit",
  };

  // Toneladas y potencia: la columna da para cinco cifras y ni una más, así que
  // el aire lateral se recorta y los dígitos van a paso fijo para que "22,85" y
  // "1000" ocupen lo mismo y no bailen de una fila a otra.
  const numberStyle: CSSProperties = {
    ...inputStyle,
    padding: "8px 6px",
    fontVariantNumeric: "tabular-nums",
  };

  /**
   * Celda de solo lectura, con la MISMA caja que un campo: fondo, borde y alto
   * de un input, y el texto en gris para decir que no se teclea.
   *
   * Lo que una torreta montada enseña sale del diálogo, no del teclado, pero su
   * fila es una fila del bloque de estadísticas como las demás y tiene que
   * leerse igual: sin caja, sus números flotaban sueltos al lado de los que sí
   * se escriben y la tarjeta de armamento parecía de otra ficha.
   */
  const readOnlyCell: CSSProperties = {
    ...numberStyle,
    color: theme.textMuted,
  };

  /** Las armas de debajo de la torreta: texto dimmed, sin caja que las encierre. */
  const subCell: CSSProperties = {
    ...readOnlyCell,
    background: "transparent",
    border: "1px solid transparent",
    fontSize: 12,
    padding: 0,
    color: theme.textDimmed,
  };

  const handleAdd = (e: ChangeEvent<HTMLSelectElement>): void => {
    const { value } = e.target;
    // Vuelve al texto de invitación para poder añadir la misma pieza dos veces.
    e.target.value = "";
    if (value === "") return;
    if (builders !== undefined) {
      builders[Number(value)]?.onOpen();
      return;
    }
    onAdd(value === "custom" ? null : value);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 6,
          // Sin menú de añadir la cabecera se queda solo con el título, que debe
          // seguir a la misma altura que el de las secciones que sí lo tienen.
          minHeight: 26,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: theme.textMuted,
          }}
        >
          {title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {(!fixed || builders !== undefined) && (
          <select
            id={addId}
            aria-label={`${t("shipAddTo")} ${title}`}
            onChange={handleAdd}
            defaultValue=""
            style={{ ...inputStyle, width: "auto", maxWidth: 200, fontSize: 12, padding: "4px 8px" }}
          >
            <option value="">{`+ ${t("shipAddComponent")}`}</option>
            {builders === undefined ? (
              <>
                {parts.map(part => (
                  <option key={part.id} value={part.id}>
                    {t(part.labelKey)}
                  </option>
                ))}
                <option value="custom">{t("shipAddCustom")}</option>
              </>
            ) : (
              builders.map((item, index) => (
                <option key={item.label} value={index}>
                  {item.label}
                </option>
              ))
            )}
          </select>
        )}
        {removeToggle}
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ fontSize: 12, color: theme.textDimmed, paddingLeft: 2 }}>{t("shipNoComponents")}</div>
      ) : (
        rows.map((component, index) => {
          // Una torreta montada desde el diálogo no se escribe: se enseña, con
          // sus armas debajo una por línea, y se cambia volviendo al diálogo.
          if (component.turret !== undefined && onEditTurret !== undefined) {
            const weapons = turretWeaponLines(component.turret, t);
            return (
              <div key={component.id} style={{ marginBottom: 6 }}>
                <div className={rowClass} style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    onClick={() => onEditTurret(component.id)}
                    title={t("shipTurretEdit")}
                    aria-label={`${t("shipTurretEdit")}: ${component.label}`}
                    // Mismo campo que el nombre de cualquier otra fila —la
                    // torreta no se escribe, pero se lee en el mismo sitio—, y
                    // pulsarlo devuelve al diálogo, que es su única edición.
                    style={{ ...inputStyle, textAlign: "left", cursor: "pointer", minHeight: 0 }}
                  >
                    {component.label}
                  </button>
                  {showPower && <span style={readOnlyCell}>{component.power ?? "—"}</span>}
                  {showQty && <span style={readOnlyCell}>{component.qty ?? 1}</span>}
                  <span style={readOnlyCell}>{component.tons ?? "—"}</span>
                  {showRemove && (
                    <Button
                      variant="icon"
                      theme={theme}
                      aria-label={`${t("shipRemoveComponent")}: ${component.label || title}`}
                      onClick={() => onRemove(component.id)}
                    >
                      <IconTrash />
                    </Button>
                  )}
                </div>
                {/* "Sin armas" solo cuando de verdad no lleva ninguna: una barbeta
                    tampoco tiene sublíneas, pero es porque su arma da nombre a la fila. */}
                {component.turret.weapons.every(id => id === null) ? (
                  <div style={{ fontSize: 12, color: theme.textDimmed, padding: "4px 0 0 14px" }}>
                    {t("shipTurretNoWeapons")}
                  </div>
                ) : (
                  // Misma rejilla que la fila: así la potencia de cada arma cae
                  // justo debajo de su columna y no al borde de la tarjeta.
                  weapons.map((weapon, slot) => (
                    <div
                      key={`${component.id}-${slot}`}
                      className={rowClass}
                      style={{ marginBottom: 0, marginTop: 4, fontSize: 12, color: theme.textMuted }}
                    >
                      <span style={{ paddingLeft: 14 }}>{weapon.name}</span>
                      {showQty && <span />}
                      {showPower && <span style={subCell}>{weapon.power}</span>}
                      <span />
                      {showRemove && <span />}
                    </div>
                  ))
                )}
              </div>
            );
          }

          // Las filas fijas van por posición: la primera pulsación sobre una
          // línea en blanco le pone id, y con key={id} el input se remontaría a
          // media palabra y perdería el foco.
          return (
          <div
            key={fixed ? `${sectionKey}-${index}` : component.id}
            className={rowClass}
          >
            {index === 0 && ratingCell !== undefined ? (
              ratingCell(component)
            ) : (
              <input
                type="text"
                // El catálogo de la sección, como sugerencias: se elige una o se
                // escribe cualquier otra cosa en el mismo campo.
                list={parts.length > 0 ? listId : undefined}
                aria-label={`${title} — ${t("shipComponentPlaceholder")}`}
                placeholder={t("shipComponentPlaceholder")}
                style={inputStyle}
                value={component.label}
                onChange={e => onUpdate(component.id, { label: e.target.value })}
              />
            )}
            {showQty && (
              <input
                type="number"
                min={1}
                step={1}
                aria-label={`${title} — ${t("shipColQty")}`}
                style={numberStyle}
                value={component.qty ?? 1}
                // Subirla multiplica las toneladas por las de una unidad; ver
                // withQuantity en utils/ship.ts. El total sigue siendo editable.
                onChange={e =>
                  onUpdate(component.id, withQuantity(component, Math.max(1, parseInt(e.target.value, 10) || 1)))
                }
              />
            )}
            {showPower && (
              <input
                type="number"
                step="any"
                aria-label={`${title} — ${t("shipColPower")}`}
                style={numberStyle}
                value={component.power ?? ""}
                onChange={e => onUpdate(component.id, { power: parseNullableNumber(e.target.value) })}
              />
            )}
            <input
              type="number"
              step="any"
              aria-label={`${title} — ${t("shipColTons")}`}
              style={numberStyle}
              value={component.tons ?? ""}
              onChange={e => onUpdate(component.id, { tons: parseNullableNumber(e.target.value) })}
            />
            {/* En modo eliminar la columna existe para todas las filas aunque
                alguna no se pueda quitar: si no, las de esa sección quedarían
                descuadradas respecto a la cabecera de la tarjeta. */}
            {showRemove &&
              (canRemove ? (
                <Button
                  variant="icon"
                  theme={theme}
                  aria-label={`${t("shipRemoveComponent")}: ${component.label || title}`}
                  onClick={() => onRemove(component.id)}
                >
                  <IconTrash />
                </Button>
              ) : (
                <span />
              ))}
          </div>
          );
        })
      )}

      {parts.length > 0 && (
        <datalist id={listId}>
          {parts.map(part => (
            <option key={part.id} value={t(part.labelKey)} />
          ))}
        </datalist>
      )}
    </div>
  );
};

/** La cabecera de columnas que las filas de arriba no repiten en cada línea. */
export const ShipRowHeader: FC<{
  theme: Theme;
  t: TranslationFunction;
  showRemove: boolean;
  showPower: boolean;
  showQty: boolean;
}> = ({ theme, t, showRemove, showPower, showQty }) => (
  <div
    className={
      "ship-sheet-row ship-sheet-row--header" +
      (showPower ? " ship-sheet-row--power" : "") +
      (showQty ? " ship-sheet-row--qty" : "") +
      (showRemove ? " ship-sheet-row--removable" : "")
    }
    aria-hidden="true"
  >
    <span style={fieldLabelStyle(theme)}>{t("shipComponentPlaceholder")}</span>
    {showQty && <span style={fieldLabelStyle(theme)}>{t("shipColQty")}</span>}
    {/* La potencia se cuela en medio: las toneladas son la última columna de
        TODAS las tarjetas, y solo esta tiene una columna de más. */}
    {showPower && <span style={fieldLabelStyle(theme)}>{t("shipColPower")}</span>}
    <span style={fieldLabelStyle(theme)}>{t("shipColTons")}</span>
    {showRemove && <span />}
  </div>
);
