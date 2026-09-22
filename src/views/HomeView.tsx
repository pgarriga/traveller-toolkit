import type { FC, ReactNode } from "react";
import { useState } from "react";
import type { Theme } from "../types/theme";
import type { Language, TranslationFunction } from "../types/i18n";
import type { ShipSheet } from "../types/ship";
import type { ShipTemplate } from "../constants/shipTemplates";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PageHeader } from "../components/ui/PageHeader";
import { ShipCreateModal } from "../components/ShipCreateModal";
import { IconBox, IconUsers, IconSearch, IconPin, IconRadar, IconShip } from "../components/icons";
import { COLORS } from "../constants/colors";
import { useShip } from "../hooks/useShip";
import { shipTypeName } from "../utils/ship";
import { formatTons } from "../utils/format";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby" | "ship";

interface HomeViewProps {
  theme: Theme;
  lang: Language;
  view: ViewType;
  goHome: () => void;
  navigateTo: (view: ViewType, uwp?: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
}

interface ToolCard {
  key: string;
  icon: ReactNode;
  title: string;
  description: string;
  accent: string;
  onClick?: () => void;
  comingSoon?: boolean;
  /** Rótulo al final del título: la nave que las calculadoras están usando. */
  badge?: string;
}

/**
 * Las herramientas van en tres bloques —dónde estás, qué se mueve y con qué lo
 * mueves— porque una lista de seis tarjetas sueltas no dice cuál sirve para qué.
 * Un bloque con una sola herramienta es normal: los tres son sitios donde crecer.
 */
interface ToolGroup {
  key: string;
  titleKey: string;
  tools: ToolCard[];
}

export const HomeView: FC<HomeViewProps> = ({
  theme,
  lang,
  view,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
}) => {
  const { ships, activeId, createShip, selectShip } = useShip();
  const [createOpen, setCreateOpen] = useState<boolean>(false);

  /** "Explorador Tipo S · 100 t · Salto-2": lo que distingue una nave de otra. */
  const shipSummary = (ship: ShipSheet): string =>
    [
      shipTypeName(ship, t),
      ship.hullTons === null ? null : `${formatTons(ship.hullTons, lang)} t`,
      ship.ratings.jump === null ? null : `${t("shipJumpOption")}-${ship.ratings.jump}`,
    ]
      .filter((part): part is string => part !== null)
      .join(" · ");

  /**
   * El bloque de naves no lista una herramienta: lista la flota. Cada nave abre
   * su ficha y pasa a ser la activa —la que leen Carga y Pasajeros—, y la última
   * tarjeta crea una nueva. Con la flota vacía solo queda esa última.
   */
  const fleetCards: ToolCard[] = [
    ...ships.map(ship => ({
      key: ship.id,
      icon: <IconShip />,
      title: ship.name || t("shipNamePlaceholder"),
      description: shipSummary(ship),
      accent: COLORS.warning,
      badge: ship.id === activeId ? t("shipActiveBadge") : undefined,
      onClick: () => {
        selectShip(ship.id);
        navigateTo("ship");
      },
    })),
    {
      key: "ship-create",
      icon: <IconShip />,
      title: t("shipCreateAction"),
      description: t("homeShipCreateDesc"),
      accent: COLORS.primary,
      onClick: () => setCreateOpen(true),
    },
  ];

  const groups: ToolGroup[] = [
    {
      key: "navigation",
      titleKey: "homeGroupNavigation",
      tools: [
        {
          key: "search",
          icon: <IconSearch />,
          title: t("searchTitle"),
          description: t("homeSearchDesc"),
          accent: COLORS.primary,
          onClick: () => navigateTo("search"),
        },
        {
          key: "nearby",
          icon: <IconRadar />,
          title: t("nearbyTitle"),
          description: t("homeNearbyDesc"),
          accent: COLORS.secondary,
          onClick: () => navigateTo("nearby"),
        },
        {
          key: "recent",
          icon: <IconPin />,
          title: t("recentWorldsTitle"),
          description: t("homeRecentDesc"),
          accent: COLORS.info,
          onClick: () => navigateTo("recent"),
        },
      ],
    },
    {
      key: "traffic",
      titleKey: "homeGroupTraffic",
      tools: [
        {
          key: "passenger",
          icon: <IconUsers />,
          title: t("passengerTitle"),
          description: t("homePassengerDesc"),
          accent: COLORS.success,
          onClick: () => navigateTo("passenger"),
        },
        {
          key: "freight",
          icon: <IconBox />,
          title: t("freightTitle"),
          description: t("homeFreightDesc"),
          accent: COLORS.secondary,
          onClick: () => navigateTo("freight"),
        },
      ],
    },
    {
      key: "ships",
      titleKey: "homeGroupShips",
      tools: fleetCards,
    },
  ];

  return (
    <div className="page-shell" style={{ background: theme.bg, color: theme.text, fontFamily: "inherit" }}>
      <Navbar
        theme={theme}
        view={view}
        goHome={goHome}
        navigateTo={navigateTo}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        t={t}
      />
      <main className="wide-main">
        <PageHeader title={t("homeTitle")} />

        {groups.map(group => (
          <section key={group.key} style={{ marginBottom: 28 }}>
            {/* Rótulo del manual: versalitas naranjas y un filete que cruza el
                ancho, en vez de otra tarjeta alrededor de las tarjetas. */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: COLORS.primary,
                }}
              >
                {t(group.titleKey)}
              </h2>
              <span aria-hidden="true" style={{ flex: 1, height: 1, background: theme.border }} />
            </div>

            <div className="card-grid card-grid--two">
              {group.tools.map(tool => (
                <button
                  key={tool.key}
                  type="button"
                  onClick={tool.comingSoon ? undefined : tool.onClick}
                  disabled={tool.comingSoon}
                  aria-disabled={tool.comingSoon || undefined}
                  style={{
                    textAlign: "left",
                    background: theme.bgCard,
                    border: `1px solid ${theme.border}`,
                    borderLeft: `4px solid ${tool.accent}`,
                    borderRadius: 12,
                    padding: 20,
                    color: theme.text,
                    fontFamily: "inherit",
                    cursor: tool.comingSoon ? "not-allowed" : "pointer",
                    opacity: tool.comingSoon ? 0.6 : 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    transition: "transform 0.12s ease, border-color 0.12s ease",
                  }}
                  onMouseEnter={e => {
                    if (tool.comingSoon) return;
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = tool.accent;
                  }}
                  onMouseLeave={e => {
                    if (tool.comingSoon) return;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = theme.border;
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: tool.accent, fontSize: 18, fontWeight: 500 }}>
                    {tool.icon}
                    <span>{tool.title}</span>
                    {(tool.comingSoon || tool.badge !== undefined) && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: 0.3,
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: `${tool.accent}22`,
                          color: tool.accent,
                          border: `1px solid ${tool.accent}55`,
                        }}
                      >
                        {tool.comingSoon ? t("comingSoon") : tool.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: theme.textDimmed, lineHeight: 1.4 }}>
                    {tool.description}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

      </main>
      <Footer theme={theme} t={t} />

      {createOpen && (
        <ShipCreateModal
          theme={theme}
          t={t}
          onClose={() => setCreateOpen(false)}
          onCreate={(name: string, template: ShipTemplate | null) => {
            createShip(name, template, t);
            setCreateOpen(false);
            navigateTo("ship");
          }}
        />
      )}
    </div>
  );
};