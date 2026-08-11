import type { FC } from "react";
import type { Theme } from "../../types/theme";
import { COLORS } from "../../constants/colors";

interface RowProps {
  label: string;
  value: string;
  warn?: boolean;
  theme?: Theme;
}

export const Row: FC<RowProps> = ({ label, value, warn, theme }) => (
  <div className="data-row">
    <span className="data-row-label" style={{ color: theme?.textMuted }}>{label}</span>
    <span className="data-row-value" style={{ color: warn ? COLORS.warning : (theme?.text || "#e2e8f0") }}>{value}</span>
  </div>
);
