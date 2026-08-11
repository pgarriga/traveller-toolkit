import type { FC } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";

interface FooterProps {
  theme: Theme;
  t: TranslationFunction;
  showVersion?: boolean;
}

export const Footer: FC<FooterProps> = ({ theme, t, showVersion = false }) => (
  <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: theme.textDimmed }}>
    {t("disclaimer")}<br />
    {t("manualNote")}
    {showVersion && (
      <div style={{ marginTop: 16 }}>
        v{__APP_VERSION__}
      </div>
    )}
  </div>
);
