import type { FC, ReactNode } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PageHeader } from "../components/ui/PageHeader";
import { IconGlobe, IconBox, IconClock } from "../components/icons";
import { COLORS } from "../constants/colors";

type ViewType = "home" | "decoder" | "saved" | "settings" | "planet" | "freight";

interface HomeViewProps {
  theme: Theme;
  view: ViewType;
  resetDecoder: () => void;
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
  onClick: () => void;
}

export const HomeView: FC<HomeViewProps> = ({
  theme,
  view,
  resetDecoder,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t,
}) => {
  const tools: ToolCard[] = [
    {
      key: "decoder",
      icon: <IconGlobe />,
      title: t("decodeUWP"),
      description: t("homeDecoderDesc"),
      accent: COLORS.primary,
      onClick: resetDecoder,
    },
    {
      key: "freight",
      icon: <IconBox />,
      title: t("freightTitle"),
      description: t("homeFreightDesc"),
      accent: COLORS.secondary,
      onClick: () => navigateTo("freight"),
    },
    {
      key: "recent",
      icon: <IconClock />,
      title: t("recentPlanets"),
      description: t("homeRecentDesc"),
      accent: COLORS.warning,
      onClick: () => navigateTo("saved"),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Navbar
        theme={theme}
        view={view}
        resetDecoder={resetDecoder}
        goHome={goHome}
        navigateTo={navigateTo}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        t={t}
      />
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px" }}>
        <PageHeader title={t("homeTitle")} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {tools.map(tool => (
            <button
              key={tool.key}
              type="button"
              onClick={tool.onClick}
              style={{
                textAlign: "left",
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderLeft: `4px solid ${tool.accent}`,
                borderRadius: 12,
                padding: 20,
                color: theme.text,
                fontFamily: "inherit",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.12s ease, border-color 0.12s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = tool.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: tool.accent, fontSize: 18, fontWeight: 700 }}>
                {tool.icon}
                <span>{tool.title}</span>
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