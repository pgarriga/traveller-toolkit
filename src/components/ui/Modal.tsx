import type { FC, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import type { Theme } from "../../types/theme";
import { IconClose } from "../icons";
import { COLORS } from "../../constants/colors";

interface ModalProps {
  theme: Theme;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  // Marks the panel so print rules can single it out (see `.contract-sheet`).
  panelClassName?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Overlay dialog: backdrop click and Escape both close it, the panel takes
// focus on mount so the keyboard lands inside, Tab cycles within the panel, and
// the element that opened the dialog gets the focus back when it closes.
export const Modal: FC<ModalProps> = ({
  theme,
  title,
  closeLabel,
  onClose,
  children,
  footer,
  maxWidth = 560,
  panelClassName,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const stops = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (stops.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      // Wrap around instead of letting Tab walk out into the page behind.
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: 12,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={panelClassName}
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderTop: `3px solid ${COLORS.primary}`,
          borderRadius: 12,
          width: "100%",
          maxWidth,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          outline: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 16px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
              color: COLORS.primary,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="contract-no-print"
            style={{
              background: "transparent",
              border: "none",
              color: theme.text,
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>{children}</div>

        {footer && (
          <div
            className="contract-no-print"
            style={{
              padding: "12px 16px",
              borderTop: `1px solid ${theme.border}`,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
