import type { FC, ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, icon }) => (
  <header style={{ textAlign: "center", marginBottom: 32 }}>
    <h1
      className="app-title"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
    >
      {icon}
      {title}
    </h1>
  </header>
);
