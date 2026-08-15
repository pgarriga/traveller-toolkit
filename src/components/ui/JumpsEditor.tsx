import type { FC, ReactNode } from "react";
import type { Theme } from "../../types/theme";
import type { ParsecDistance } from "../../types/freight";
import type { TranslationFunction } from "../../types/i18n";
import { COLORS } from "../../constants/colors";
import { Field } from "./Field";

const MAX_JUMP_COUNT = 5;

export const distributeJumps = (parsecs: number, jumpCount: number): ParsecDistance[] => {
  const count = Math.max(1, Math.min(jumpCount, parsecs));
  const base = Math.floor(parsecs / count);
  const remainder = parsecs % count;
  const result: ParsecDistance[] = [];
  for (let i = 0; i < count; i++) {
    result.push((base + (i < remainder ? 1 : 0)) as ParsecDistance);
  }
  return result;
};

export const clampJumpCount = (parsecs: number, jumpCount: number): number =>
  Math.max(1, Math.min(MAX_JUMP_COUNT, parsecs, jumpCount));

interface JumpCountFieldProps {
  parsecs: number;
  jumpCount: number;
  setJumpCount: (n: number) => void;
  theme: Theme;
  t: TranslationFunction;
}

export const JumpCountField: FC<JumpCountFieldProps> = ({
  parsecs,
  jumpCount,
  setJumpCount,
  theme,
  t,
}) => {
  const maxCount = Math.min(MAX_JUMP_COUNT, parsecs);
  const effectiveCount = clampJumpCount(parsecs, jumpCount);

  const inputStyle = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    color: theme.text,
    fontSize: 14,
    width: "100%",
    fontFamily: "inherit",
  } as const;

  return (
    <Field label={t("routeJumpsLabel")} theme={theme}>
      {id => (
        <select
          id={id}
          style={inputStyle}
          value={effectiveCount}
          onChange={e => setJumpCount(parseInt(e.target.value, 10))}
        >
          {Array.from({ length: maxCount }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      )}
    </Field>
  );
};

interface JumpsBreakdownProps {
  parsecs: number;
  jumpCount: number;
  theme: Theme;
  t: TranslationFunction;
  priceFor?: (jump: ParsecDistance) => number;
  formatPrice?: (n: number) => string;
  priceSuffix?: ReactNode;
}

export const JumpsBreakdown: FC<JumpsBreakdownProps> = ({
  parsecs,
  jumpCount,
  theme,
  t,
  priceFor,
  formatPrice,
  priceSuffix,
}) => {
  const effectiveCount = clampJumpCount(parsecs, jumpCount);
  const jumps = distributeJumps(parsecs, effectiveCount);
  const showPrices = priceFor !== undefined && formatPrice !== undefined;
  const total = showPrices ? jumps.reduce((sum, j) => sum + priceFor(j), 0) : 0;

  return (
    <div style={{ marginTop: 12 }}>
      {showPrices ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 12, color: theme.textDimmed, fontWeight: 500 }}>
            {t("routeJumpsBreakdown")}
          </div>
          {jumps.map((j, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: 13,
                fontFamily: "monospace",
                padding: "3px 0",
                borderBottom: `1px dashed ${theme.border}`,
              }}
            >
              <span style={{ color: COLORS.primary, fontWeight: 500 }}>J-{j}</span>
              <span style={{ color: theme.text }}>
                {formatPrice(priceFor(j))}
                {priceSuffix}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: 13,
              fontFamily: "monospace",
              padding: "6px 0 0",
              fontWeight: 500,
            }}
          >
            <span style={{ color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>
              {t("routeJumpsTotal")}
            </span>
            <span style={{ color: COLORS.success }}>
              {formatPrice(total)}
              {priceSuffix}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: theme.textDimmed, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span>{t("routeJumpsBreakdown")}:</span>
          <span style={{ fontFamily: "monospace", color: COLORS.primary, fontWeight: 500 }}>
            {jumps.map(j => `J-${j}`).join(" + ")}
          </span>
        </div>
      )}
      <div style={{ fontSize: 11, color: theme.textDimmed, marginTop: 6 }}>
        {t("routeJumpsHint")}
      </div>
    </div>
  );
};