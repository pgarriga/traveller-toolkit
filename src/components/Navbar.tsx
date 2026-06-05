import type { FC } from "react";
import { useEffect, useRef } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import { IconClock, IconSettings, IconBox, IconGlobe, IconMenu, IconClose } from "./icons";
import { Button } from "./ui/Button";
import { COLORS } from "../constants/colors";

type ViewType = "home" | "decoder" | "saved" | "settings" | "planet" | "freight";

interface NavbarProps {
  theme: Theme;
  view: ViewType;
  resetDecoder: () => void;
  goHome: () => void;
  navigateTo: (view: ViewType) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
}

export const Navbar: FC<NavbarProps> = ({ theme, view, resetDecoder, goHome, navigateTo, menuOpen, setMenuOpen, t }) => {
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
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            gap: 6
          }}
        >
          <span style={{ color: COLORS.warning }}>Traveller</span>
          <span style={{
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>Toolkit</span>
        </div>

        {/* Desktop nav links */}
        <div className="nav-desktop" style={{ display: "flex", gap: 8 }} role="menubar">
          <Button variant="nav" active={view === "decoder"} theme={theme} onClick={resetDecoder} role="menuitem">
            <IconGlobe />{t("decodeUWP")}
          </Button>
          <Button variant="nav" active={view === "freight"} theme={theme} onClick={() => navigateTo("freight")} role="menuitem">
            <IconBox />{t("freightTitle")}
          </Button>
          <Button variant="nav" active={view === "saved"} theme={theme} onClick={() => navigateTo("saved")} role="menuitem">
            <IconClock />{t("viewRecent")}
          </Button>
          <Button variant="nav" active={view === "settings"} theme={theme} onClick={() => navigateTo("settings")} role="menuitem">
            <IconSettings />{t("settings")}
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          ref={toggleRef}
          className="nav-mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? (t("closeMenu") || "Close menu") : (t("openMenu") || "Open menu")}
          style={{
            display: "none",
            background: "transparent",
            border: "none",
            color: theme.text,
            padding: 8,
            cursor: "pointer"
          }}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="menu"
          aria-label={t("mobileNavigation") || "Mobile navigation"}
          className="nav-mobile-menu"
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
            gap: 8
          }}
        >
          <Button
            variant="nav-mobile"
            size="lg"
            active={view === "decoder"}
            theme={theme}
            onClick={resetDecoder}
            fullWidth
            style={{ justifyContent: "flex-start" }}
            role="menuitem"
          >
            <IconGlobe />{t("decodeUWP")}
          </Button>
          <Button
            variant="nav-mobile"
            size="lg"
            active={view === "freight"}
            theme={theme}
            onClick={() => navigateTo("freight")}
            fullWidth
            style={{ justifyContent: "flex-start" }}
            role="menuitem"
          >
            <IconBox />{t("freightTitle")}
          </Button>
          <Button
            variant="nav-mobile"
            size="lg"
            active={view === "saved"}
            theme={theme}
            onClick={() => navigateTo("saved")}
            fullWidth
            style={{ justifyContent: "flex-start" }}
            role="menuitem"
          >
            <IconClock />{t("viewRecent")}
          </Button>
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
