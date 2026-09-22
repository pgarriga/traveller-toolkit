import type { FC } from "react";
import { useEffect, useRef } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import { IconSettings, IconMenu, IconClose, toolIcon } from "./icons";
import { TOOL_GROUPS } from "../constants/tools";
import { useShip } from "../hooks/useShip";
import { Button } from "./ui/Button";
import { COLORS } from "../constants/colors";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby" | "ship";

interface NavbarProps {
  theme: Theme;
  view: ViewType;
  goHome: () => void;
  navigateTo: (view: ViewType) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
}

export const Navbar: FC<NavbarProps> = ({ theme, view, goHome, navigateTo, menuOpen, setMenuOpen, t }) => {
  // La flota, para listarla en el bloque de naves: el menú enseña las mismas
  // naves que el índice, no una entrada genérica que no dice cuál es la tuya.
  const { ships, activeId, selectShip } = useShip();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to close menu
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, setMenuOpen]);

  // Focus trap in mobile menu
  useEffect(() => {
    if (!menuOpen || !menuRef.current) return;

    const focusableElements = menuRef.current.querySelectorAll("button");
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    // Focus first element when menu opens
    firstElement.focus();

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [menuOpen]);

  return (
    <>
      <nav
        role="navigation"
        aria-label={t("mainNavigation") || "Main navigation"}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: theme.navBg,
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 1000
        }}
      >
        {/* Logo */}
        <div
          onClick={goHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && goHome()}
          aria-label={t("goHome") || "Go to home"}
          style={{
            fontSize: 18,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            gap: 6,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          <span style={{ color: theme.text }}>Traveller</span>
          <span style={{ color: COLORS.primary }}>Toolkit</span>
        </div>

        {/* Menu toggle (hamburger on all sizes) */}
        <button
          ref={toggleRef}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? (t("closeMenu") || "Close menu") : (t("openMenu") || "Open menu")}
          style={{
            background: "transparent",
            border: "none",
            color: theme.text,
            padding: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>
      </nav>

      {/* Menu overlay */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="menu"
          aria-label={t("mobileNavigation") || "Mobile navigation"}
          style={{
            position: "fixed",
            top: 56,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.bg + "ee",
            zIndex: 999,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            // Con los rótulos de bloque la lista puede pasar del alto de la
            // ventana en un móvil bajo; que ruede en vez de cortarse.
            overflowY: "auto",
          }}
        >
          {/* Las mismas herramientas, en los mismos bloques y en el mismo
              orden que el índice de la portada: la lista es una sola y vive en
              constants/tools.ts. Cuando cada uno llevaba la suya, se separaron.
              La flota NO se lista aquí —se gobierna desde la portada—, así que
              su bloque trae una sola entrada: la ficha de la nave activa. */}
          {TOOL_GROUPS.map(group => (
            <div
              key={group.key}
              role="group"
              aria-label={t(group.titleKey)}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  color: COLORS.primary,
                  padding: "4px 2px 0",
                }}
              >
                {t(group.titleKey)}
              </div>
              {group.key === "ships"
                ? // La flota entera, una nave por entrada, como en el índice.
                  // Elegir una la deja activa —es la que leen Carga y
                  // Pasajeros— y abre su ficha. Con la flota vacía queda la
                  // invitación a crear la primera, que es lo que enseña /ship.
                  ships.length === 0
                  ? [
                      <Button
                        key="ship-none"
                        variant="nav-mobile"
                        size="lg"
                        active={view === "ship"}
                        theme={theme}
                        onClick={() => navigateTo("ship")}
                        fullWidth
                        style={{ justifyContent: "flex-start" }}
                        role="menuitem"
                      >
                        {toolIcon("ship")}{t("shipCreateAction")}
                      </Button>,
                    ]
                  : ships.map(ship => (
                      <Button
                        key={ship.id}
                        variant="nav-mobile"
                        size="lg"
                        active={view === "ship" && ship.id === activeId}
                        theme={theme}
                        onClick={() => {
                          selectShip(ship.id);
                          navigateTo("ship");
                        }}
                        fullWidth
                        style={{ justifyContent: "flex-start" }}
                        role="menuitem"
                      >
                        {toolIcon("ship")}{ship.name || t("shipNamePlaceholder")}
                      </Button>
                    ))
                : group.tools.map(tool => (
                    <Button
                      key={tool.view}
                      variant="nav-mobile"
                      size="lg"
                      active={view === tool.view}
                      theme={theme}
                      onClick={() => navigateTo(tool.view)}
                      fullWidth
                      style={{ justifyContent: "flex-start" }}
                      role="menuitem"
                    >
                      {toolIcon(tool.icon)}{t(tool.titleKey)}
                    </Button>
                  ))}
            </div>
          ))}

          {/* Ajustes no es una herramienta: es la página de la aplicación, y por
              eso va detrás de un filete y sin bloque que la encabece. */}
          <div style={{ borderTop: `1px solid ${theme.border}`, margin: "8px 0 0" }} />
          <Button
            variant="nav-mobile"
            size="lg"
            active={view === "settings"}
            theme={theme}
            onClick={() => navigateTo("settings")}
            fullWidth
            style={{ justifyContent: "flex-start" }}
            role="menuitem"
          >
            <IconSettings />{t("settings")}
          </Button>
        </div>
      )}

      {/* Spacer for fixed navbar */}
      <div style={{ height: 56 }} />
    </>
  );
};
