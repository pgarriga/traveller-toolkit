import type { ChangeEvent, FC, ReactNode } from "react";
import { useRef, useState } from "react";
import type { Theme } from "../types/theme";
import type { Language, TranslationFunction } from "../types/i18n";
import type { ShipSheet } from "../types/ship";
import type { ShipTemplate } from "../constants/shipTemplates";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PageHeader } from "../components/ui/PageHeader";
import { ShipCreateModal } from "../components/ShipCreateModal";
import { IconShip, IconUpload, toolIcon } from "../components/icons";
import { COLORS } from "../constants/colors";
import type { ToolViewId } from "../constants/tools";
import { TOOL_GROUPS } from "../constants/tools";
import { useShip } from "../hooks/useShip";
import { shipTypeName } from "../utils/ship";
import { shipFromJson } from "../utils/shipExport";
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
 * Lo que cada herramienta cuenta de sí misma en el índice, y con qué color.
 *
 * Cuáles hay, en qué bloque y en qué orden lo dice `TOOL_GROUPS`, que es la
 * lista que comparte con el menú desplegable; esto es solo lo que el índice
 * pinta de más, porque el menú no lleva ni descripción ni color.
 */
const TOOL_CARDS: Record<ToolViewId, { descKey: string; accent: string }> = {
  search: { descKey: "homeSearchDesc", accent: COLORS.primary },
  nearby: { descKey: "homeNearbyDesc", accent: COLORS.secondary },
  recent: { descKey: "homeRecentDesc", accent: COLORS.info },
  passenger: { descKey: "homePassengerDesc", accent: COLORS.success },
  freight: { descKey: "homeFreightDesc", accent: COLORS.secondary },
  // El bloque de naves no pinta esta tarjeta: lista la flota. La entrada está
  // para que añadir una herramienta obligue a decir qué cuenta de sí misma.
  ship: { descKey: "homeShipCreateDesc", accent: COLORS.warning },
};

/**
 * Las herramientas van en tres bloques —dónde estás, qué se mueve y con qué lo
 * mueves— porque una lista de seis tarjetas sueltas no dice cuál sirve para qué.
 * Un bloque con una sola herramienta es normal: los tres son sitios donde crecer.
 */
interface ToolGroup {
  key: string;
  titleKey: string;
  tools: ToolCard[];
  /** Un aviso bajo la rejilla del bloque. Solo lo usa la flota, al importar. */
  error?: string;
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
  const { ships, activeId, createShip, importShip, selectShip } = useShip();
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  // El <input type="file"> va escondido: quien abre el diálogo es la tarjeta,
  // que tiene que parecerse a las otras y no a un campo de formulario.
  const fileInput = useRef<HTMLInputElement>(null);

  /**
   * Importar una nave: se lee el fichero, se valida y entra en la flota como
   * activa. Lo que no pase `isShipSheet` no entra, y el bloque lo dice debajo.
   */
  const handleImport = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    // Se limpia siempre: si no, elegir el mismo fichero dos veces no dispara
    // el evento y la segunda importación no llega a pasar.
    e.target.value = "";
    if (file === undefined) return;

    const sheet = shipFromJson(await file.text());
    if (sheet === null) {
      setImportError(t("shipImportError"));
      return;
    }
    setImportError(null);
    importShip(sheet);
    navigateTo("ship");
  };

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
    {
      key: "ship-import",
      icon: <IconUpload />,
      title: t("shipImportAction"),
      description: t("homeShipImportDesc"),
      accent: COLORS.info,
      onClick: () => fileInput.current?.click(),
    },
  ];

  /**
   * Los bloques salen de la lista única (`constants/tools.ts`), la misma que
   * pinta el menú desplegable, para que no se vuelvan a separar. El de naves es
   * el que cambia: ahí el índice no lista una herramienta, lista la flota.
   */
  const groups: ToolGroup[] = TOOL_GROUPS.map(group => ({
    key: group.key,
    titleKey: group.titleKey,
    tools:
      group.key === "ships"
        ? fleetCards
        : group.tools.map(tool => ({
            key: tool.view,
            icon: toolIcon(tool.icon),
            title: t(tool.titleKey),
            description: t(TOOL_CARDS[tool.view].descKey),
            accent: TOOL_CARDS[tool.view].accent,
            onClick: () => navigateTo(tool.view),
          })),
    ...(group.key === "ships" && importError !== null ? { error: importError } : {}),
  }));

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
            {group.error !== undefined && (
              <div style={{ marginTop: 10, fontSize: 13, color: COLORS.danger }} role="alert">
                {group.error}
              </div>
            )}
          </section>
        ))}

        {/* El diálogo de ficheros lo abre la tarjeta de importar; el campo no se
            ve, pero tiene que existir en el documento para poder abrirlo. */}
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          // Ni se ve ni se tabula: quien manda es la tarjeta, que es la que
          // tiene nombre accesible. Un campo escondido en el orden de tabulación
          // sería un segundo mando para lo mismo.
          tabIndex={-1}
          aria-hidden="true"
          onChange={e => void handleImport(e)}
        />
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