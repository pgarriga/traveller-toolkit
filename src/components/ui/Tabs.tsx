import type { CSSProperties, FC, KeyboardEvent, ReactNode } from "react";
import { useRef } from "react";
import type { Theme } from "../../types/theme";
import { COLORS } from "../../constants/colors";

interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  theme: Theme;
  tabs: readonly TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Nombra la barra para quien navegue con lector de pantalla. */
  ariaLabel: string;
  /**
   * Prefijo de los id de los paneles: el panel de la pestaña "crew" debe
   * llevar `id={`${idPrefix}-crew`}` y `aria-labelledby={`${idPrefix}-tab-crew`}`.
   */
  idPrefix: string;
}

/**
 * Barra de pestañas con el patrón ARIA completo: solo la pestaña activa entra
 * en el orden de tabulación y las flechas mueven entre pestañas, que es como
 * un lector de pantalla espera que se comporte un tablist.
 *
 * El panel lo pinta quien la usa; este componente solo manda la cabecera.
 */
export const Tabs: FC<TabsProps> = ({ theme, tabs, activeId, onChange, ariaLabel, idPrefix }) => {
  const listRef = useRef<HTMLDivElement | null>(null);

  const focusTab = (index: number): void => {
    const wrapped = (index + tabs.length) % tabs.length;
    onChange(tabs[wrapped].id);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[wrapped]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (e.key === "ArrowRight") { e.preventDefault(); focusTab(index + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); focusTab(index - 1); }
    else if (e.key === "Home") { e.preventDefault(); focusTab(0); }
    else if (e.key === "End") { e.preventDefault(); focusTab(tabs.length - 1); }
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    flex: "1 1 auto",
    background: "transparent",
    border: "none",
    // El subrayado naranja marca la activa; el resto reserva el mismo alto para
    // que la fila no dé un salto al cambiar de pestaña.
    borderBottom: `2px solid ${active ? COLORS.primary : "transparent"}`,
    color: active ? COLORS.primary : theme.textMuted,
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    padding: "10px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    whiteSpace: "nowrap",
  });

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        gap: 4,
        borderBottom: `1px solid ${theme.border}`,
        marginBottom: 16,
        overflowX: "auto",
      }}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={e => handleKeyDown(e, index)}
            style={tabStyle(active)}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
