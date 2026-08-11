import type { FC, ReactNode } from "react";
import type { Theme } from "../../types/theme";
import { COLORS } from "../../constants/colors";

interface SectionProps {
  title: string;
  children: ReactNode;
  color?: string;
  theme?: Theme;
}

export const Section: FC<SectionProps> = ({ title, children, color = COLORS.primary, theme }) => (
  <div style={{ background: theme?.bgCard || "#1e293b", borderRadius: 12, padding: "16px 20px", marginBottom: 12, borderLeft: `4px solid ${color}` }}>
    <div className="section-title" style={{ color, fontWeight: 500, fontSize: 14, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{title}</div>
    {children}
  </div>
);
