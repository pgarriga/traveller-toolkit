import type { ChangeEvent, CSSProperties, FC } from "react";
import { useId } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import type { ShipComponent, ShipSectionKey } from "../types/ship";
import { Button } from "./ui/Button";
import { fieldLabelStyle } from "./ui/Field";
import { IconTrash } from "./icons";
import { partsForSection } from "../constants/shipParts";

interface ShipSectionEditorProps {
  theme: Theme;
  t: TranslationFunction;
  sectionKey: ShipSectionKey;
  titleKey: string;
  components: ShipComponent[];
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
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const addId = useId();
  const parts = partsForSection(sectionKey);
  const title = t(titleKey);

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

  const handleAdd = (e: ChangeEvent<HTMLSelectElement>): void => {
    const { value } = e.target;
    if (value === "") return;
    onAdd(value === "custom" ? null : value);
    // Vuelve al texto de invitación para poder añadir la misma pieza dos veces.
    e.target.value = "";
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
        <select
          id={addId}
          aria-label={`${t("shipAddTo")} ${title}`}
          onChange={handleAdd}
          defaultValue=""
          style={{ ...inputStyle, width: "auto", maxWidth: 200, fontSize: 12, padding: "4px 8px" }}
        >
          <option value="">{`+ ${t("shipAddComponent")}`}</option>
          {parts.map(part => (
            <option key={part.id} value={part.id}>
              {t(part.labelKey)}
            </option>
          ))}
          <option value="custom">{t("shipAddCustom")}</option>
        </select>
      </div>

      {components.length === 0 ? (
        <div style={{ fontSize: 12, color: theme.textDimmed, paddingLeft: 2 }}>{t("shipNoComponents")}</div>
      ) : (
        components.map(component => (
          <div key={component.id} className="ship-sheet-row">
            <input
              type="text"
              aria-label={`${title} — ${t("shipComponentPlaceholder")}`}
              placeholder={t("shipComponentPlaceholder")}
              style={inputStyle}
              value={component.label}
              onChange={e => onUpdate(component.id, { label: e.target.value })}
            />
            <input
              type="number"
              step="any"
              aria-label={`${title} — ${t("shipColTons")}`}
              placeholder={t("shipColTons")}
              style={inputStyle}
              value={component.tons ?? ""}
              onChange={e => onUpdate(component.id, { tons: parseNullableNumber(e.target.value) })}
            />
            <input
              type="number"
              step="any"
              aria-label={`${title} — ${t("shipColPrice")}`}
              placeholder={t("shipColPrice")}
              style={inputStyle}
              value={component.price ?? ""}
              onChange={e => onUpdate(component.id, { price: parseNullableNumber(e.target.value) })}
            />
            <Button
              variant="icon"
              theme={theme}
              aria-label={`${t("shipRemoveComponent")}: ${component.label || title}`}
              onClick={() => onRemove(component.id)}
            >
              <IconTrash />
            </Button>
          </div>
        ))
      )}
    </div>
  );
};

/** La cabecera de columnas que las filas de arriba no repiten en cada línea. */
export const ShipRowHeader: FC<{ theme: Theme; t: TranslationFunction }> = ({ theme, t }) => (
  <div className="ship-sheet-row ship-sheet-row--header" aria-hidden="true">
    <span style={fieldLabelStyle(theme)}>{t("shipComponentPlaceholder")}</span>
    <span style={fieldLabelStyle(theme)}>{t("shipColTons")}</span>
    <span style={fieldLabelStyle(theme)}>{t("shipColPrice")}</span>
    <span />
  </div>
);
