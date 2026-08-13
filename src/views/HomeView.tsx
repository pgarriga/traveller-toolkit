import type { FC, ReactNode } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PageHeader } from "../components/ui/PageHeader";
import { IconBox, IconUsers, IconSearch, IconPin, IconRadar } from "../components/icons";
import { COLORS } from "../constants/colors";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search" | "recent" | "nearby";

interface HomeViewProps {
  theme: Theme;
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
}

export const HomeView: FC<HomeViewProps> = ({
  theme,
  view,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
}) => {
  const tools: ToolCard[] = [
    {
      key: "search",
      icon: <IconSearch />,
      title: t("searchTitle"),
      description: t("homeSearchDesc"),
      accent: COLORS.primary,
      onClick: () => navigateTo("search"),
    },
    {
      key: "recent",
      icon: <IconPin />,
      title: t("recentWorldsTitle"),
      description: t("homeRecentDesc"),
      accent: COLORS.info,
      onClick: () => navigateTo("recent"),
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
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "inherit" }}>
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

        <div className="card-grid card-grid--two" style={{ marginBottom: 24 }}>
          {tools.map(tool => (
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
                {tool.comingSoon && (
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
                    {t("comingSoon")}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: theme.textDimmed, lineHeight: 1.4 }}>
                {tool.description}
              </div>
            </button>
          ))}
        </div>

        <Footer theme={theme} t={t} />
      </main>
    </div>
  );
};