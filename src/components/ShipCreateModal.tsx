import type { CSSProperties, ChangeEvent, FC } from "react";
import { useState } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import type { ShipTemplate } from "../constants/shipTemplates";
import { SHIP_TEMPLATES, findTemplate } from "../constants/shipTemplates";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { IconShip } from "./icons";

interface ShipCreateModalProps {
  theme: Theme;
  t: TranslationFunction;
  onClose: () => void;
  /** `null` es "personalizada": ficha en blanco, sin diseño del manual detrás. */
  onCreate: (name: string, template: ShipTemplate | null) => void;
}

/** El manual separa sus diseños en astronaves y "naves pequeñas". */
const isSmallCraft = (template: ShipTemplate): boolean => template.designationKey === "shipTplSmallCraft";

const STARSHIPS = SHIP_TEMPLATES.filter(tpl => !isSmallCraft(tpl));
const SMALL_CRAFT = SHIP_TEMPLATES.filter(isSmallCraft);

/**
 * Las dos únicas cosas que hay que decidir para que exista una nave: cómo se
 * llama y de qué tipo es.
 *
 * El tipo se elige aquí y solo aquí. Una vez creada, la ficha deja editar todo
 * lo demás pero enseña el tipo bloqueado: cambiarlo significaría sustituir todos
 * los componentes de una ficha que el jugador ya ha tocado, y eso es crear otra
 * nave. Por eso hay un botón para crear una nueva en vez de un selector aquí.
 */
export const ShipCreateModal: FC<ShipCreateModalProps> = ({ theme, t, onClose, onCreate }) => {
  const [name, setName] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");

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

  const create = (): void => {
    if (name.trim() === "") return;
    onCreate(name, templateId === "" ? null : findTemplate(templateId) ?? null);
  };

  return (
    <Modal
      theme={theme}
      title={t("shipCreateTitle")}
      closeLabel={t("close")}
      onClose={onClose}
      maxWidth={460}
      footer={
        <>
          <Button variant="ghost" size="md" theme={theme} onClick={onClose}>
            {t("close")}
          </Button>
          <Button variant="primary" size="md" theme={theme} onClick={create} disabled={name.trim() === ""}>
            <IconShip />
            {t("shipCreateAction")}
          </Button>
        </>
      }
    >
      <Field label={t("shipNameLabel")} theme={theme}>
        {id => (
          <input
            id={id}
            type="text"
            style={inputStyle}
            placeholder={t("shipNamePlaceholder")}
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") create();
            }}
          />
        )}
      </Field>

      <div style={{ marginTop: 12 }}>
        <Field label={t("shipTypeLabel")} theme={theme}>
          {id => (
            <select id={id} style={inputStyle} value={templateId} onChange={e => setTemplateId(e.target.value)}>
              <option value="">{t("shipTypeCustom")}</option>
              <optgroup label={t("shipTemplateStarships")}>
                {STARSHIPS.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {`${t(tpl.nameKey)} — ${t(tpl.designationKey)}`}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t("shipTemplateSmallCraft")}>
                {SMALL_CRAFT.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {`${t(tpl.nameKey)} — ${tpl.hullTons} t`}
                  </option>
                ))}
              </optgroup>
            </select>
          )}
        </Field>
      </div>

      <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 10, lineHeight: 1.5 }}>
        {t("shipCreateHint")}
      </div>
    </Modal>
  );
};
