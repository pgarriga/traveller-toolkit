import type { FC, ChangeEvent, RefObject } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { IconCamera, IconGlobe } from "../components/icons";
import { COLORS } from "../constants/colors";

type ViewType = "home" | "decoder" | "saved" | "settings" | "planet" | "freight" | "passenger";

interface DecoderViewProps {
  theme: Theme;
  uwp: string;
  setUwp: (uwp: string) => void;
  parsed: boolean;
  scanning: boolean;
  scanStatus: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleScan: (e: ChangeEvent<HTMLInputElement>) => void;
  view: ViewType;
  resetDecoder: () => void;
  goHome: () => void;
  navigateTo: (view: ViewType, uwp?: string) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  t: TranslationFunction;
}

export const DecoderView: FC<DecoderViewProps> = ({
  theme,
  uwp,
  setUwp,
  parsed,
  scanning,
  scanStatus,
  fileInputRef,
  handleScan,
  view,
  resetDecoder,
  goHome,
  navigateTo,
  menuOpen,
  setMenuOpen,
  t
}) => (
  <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "inherit" }}>
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
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
      <PageHeader title={t("decodeUWP")} icon={<IconGlobe />} />

      {/* Main scan button */}
      <div style={{ background: theme.bgCard, borderRadius: 12, padding: 24, marginBottom: 16, border: `1px solid ${theme.border}` }}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleScan}
          style={{ display: "none" }}
        />
        <Button
          variant="secondary"
          size="xl"
          disabled={scanning}
          theme={theme}
          onClick={() => fileInputRef.current?.click()}
          fullWidth
          style={{ borderRadius: 12, cursor: scanning ? "wait" : "pointer" }}
        >
          <IconCamera />
          {scanning ? t("scanning") : t("scan")}
        </Button>
        {scanStatus && (
          <div style={{ fontSize: 12, color: scanStatus.includes(t("uwpDetected")) ? COLORS.success : COLORS.warning, marginTop: 12, textAlign: "center" }}>
            {scanStatus}
          </div>
        )}

        {/* Separator */}
        <div style={{ display: "flex", alignItems: "center", margin: "20px 0", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
          <span style={{ color: theme.textDimmed, fontSize: 12 }}>{t("or")}</span>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
        </div>

        {/* Manual input (secondary) */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <label htmlFor="uwp-code" style={{ fontSize: 12, color: theme.textDimmed }}>{t("enterManually")}</label>
        </div>
        <div className="manual-input-row">
          <input
            id="uwp-code"
            aria-label={t("uwpCode") || "UWP Code"}
            value={uwp}
            onChange={e => setUwp(e.target.value)}
            placeholder={t("uwpPlaceholder")}
            style={{
              flex: 1,
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: "10px 14px",
              color: theme.text,
              fontSize: 14,
              fontFamily: "monospace",
              fontWeight: 500,
              letterSpacing: 1,
              textAlign: "center"
            }}
          />
          <Button
            variant="primary"
            disabled={!parsed}
            theme={theme}
            onClick={() => navigateTo("planet", uwp)}
          >
            {t("decode")}
          </Button>
        </div>
        {!parsed && uwp.trim() && (
          <div style={{ textAlign: "center", marginTop: 8, color: COLORS.warning, fontSize: 11 }}>
            {t("invalidUwp")}
          </div>
        )}
      </div>

      <Footer theme={theme} t={t} />
    </main>
  </div>
);
