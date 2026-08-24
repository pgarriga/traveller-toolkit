import type { FC } from "react";
import { useEffect, useRef } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import { IconSettings, IconBox, IconMenu, IconClose, IconUsers, IconSearch, IconPin, IconRadar } from "./icons";
import { Button } from "./ui/Button";
import { COLORS } from "../constants/colors";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby";

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
            gap: 8
          }}
        >
          <Button
            variant="nav-mobile"
            size="lg"
            active={view === "search"}
            theme={theme}
            onClick={() => navigateTo("search")}
            fullWidth
            style={{ justifyContent: "flex-start" }}
            role="menuitem"
          >
            <IconSearch />{t("searchTitle")}
          </Button>
          <Button
            variant="nav-mobile"
            size="lg"
            active={view === "nearby"}
            theme={theme}
            onClick={() => navigateTo("nearby")}
            fullWidth
            style={{ justifyContent: "flex-start" }}
            role="menuitem"
          >
            <IconRadar />{t("nearbyTitle")}
          </Button>
          <Button
            variant="nav-mobile"
            size="lg"
            active={view === "passenger"}
            theme={theme}
            onClick={() => navigateTo("passenger")}
            fullWidth
            style={{ justifyContent: "flex-start" }}
            role="menuitem"
          >
            <IconUsers />{t("passengerTitle")}
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
            active={view === "recent"}
            theme={theme}
            onClick={() => navigateTo("recent")}
            fullWidth
            style={{ justifyContent: "flex-start" }}
            role="menuitem"
          >
            <IconPin />{t("recentWorldsTitle")}
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
