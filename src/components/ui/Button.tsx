import type { FC, ReactNode, CSSProperties, ButtonHTMLAttributes } from "react";
import type { Theme } from "../../types/theme";
import { COLORS } from "../../constants/colors";

type ButtonVariant = "primary" | "secondary" | "ghost" | "nav" | "nav-mobile" | "danger" | "option" | "icon";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  fullWidth?: boolean;
  theme?: Theme;
  style?: CSSProperties;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  active = false,
  disabled = false,
  fullWidth = false,
  theme,
  style = {},
  ...props
}) => {
  const sizes: Record<ButtonSize, { padding: string; fontSize: number }> = {
    sm: { padding: "8px 12px", fontSize: 12 },
    md: { padding: "10px 16px", fontSize: 14 },
    lg: { padding: "16px 20px", fontSize: 16 },
    xl: { padding: "24px 20px", fontSize: 18 },
  };

  const getVariantStyles = (): CSSProperties => {
    switch (variant) {
      case "primary":
        return {
          background: disabled ? theme?.border : COLORS.primary,
          color: disabled ? theme?.textDimmed : "#fff",
          border: "none",
        };
      case "secondary":
        return {
          background: disabled ? theme?.border : COLORS.secondary,
          color: disabled ? theme?.textDimmed : "#fff",
          border: "none",
        };
      case "danger":
        return {
          background: disabled ? theme?.border : COLORS.danger,
          color: disabled ? theme?.textDimmed : "#fff",
          border: "none",
        };
      case "ghost":
        return {
          background: "transparent",
          color: theme?.textMuted,
          border: "none",
        };
      case "nav":
        return {
          background: active ? theme?.border : "transparent",
          color: active ? theme?.text : theme?.textMuted,
          border: "none",
        };
      case "nav-mobile":
        return {
          background: active ? theme?.border : theme?.bgCard,
          color: theme?.text,
          border: "none",
        };
      case "option":
        return {
          background: active ? COLORS.primary : theme?.border,
          color: active ? "#fff" : theme?.text,
          border: "none",
        };
      case "icon":
        return {
          background: "transparent",
          color: theme?.textDimmed,
          border: "none",
          padding: "8px",
        };
      default:
        return {
          background: theme?.border,
          color: theme?.text,
          border: "none",
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = sizes[size] || sizes.md;

  return (
    <button
      disabled={disabled}
      style={{
        borderRadius: 8,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: fullWidth ? "100%" : undefined,
        ...sizeStyles,
        ...variantStyles,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};
