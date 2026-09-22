import type { FC } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import { COLORS } from "../constants/colors";

interface FooterProps {
  theme: Theme;
  t: TranslationFunction;
}

/** El nombre de la app no se traduce: es como se llama. */
const APP_NAME = "Traveller Toolkit";

/**
 * El pie de página, una banda a todo el ancho por debajo del contenido: filete
 * superior, el nombre de la app con su versión al lado y el descargo.
 *
 * Va FUERA de `<main>` en todas las vistas —por eso la banda llega a los dos
 * bordes de la ventana en vez de quedarse dentro de la caja de 720 px— y es él
 * quien se centra por dentro. Si una vista nueva lo mete dentro del main, la
 * banda se encoge y deja de parecer un pie.
 *
 * La versión se enseña siempre; antes solo salía en Ajustes, escondida donde
 * nadie la busca cuando quiere decirte qué versión tiene abierta.
 */
export const Footer: FC<FooterProps> = ({ theme, t }) => (
  <footer
    style={{
      background: theme.bgCard,
      borderTop: `1px solid ${theme.border}`,
      // El hueco de abajo cuenta con la barra del móvil: sin esto el descargo
      // queda debajo del gesto de inicio en un iPhone.
      padding: "32px 24px calc(32px + env(safe-area-inset-bottom, 0px))",
      marginTop: 32,
    }}
  >
    <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
      <p
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          margin: "0 0 14px",
          color: COLORS.primary,
          textTransform: "uppercase",
          letterSpacing: 2,
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        {APP_NAME}
        <span
          style={{
            textTransform: "none",
            letterSpacing: 0.4,
            color: theme.textDimmed,
            border: `1px solid ${theme.border}`,
            borderRadius: 999,
            padding: "2px 9px",
            fontSize: 12,
          }}
        >
          {/* Leído: "Versión 3.9.5". Visto: "v3.9.5", que es lo que cabe. */}
          <span className="sr-only">{`${t("version")} ${__APP_VERSION__}`}</span>
          <span aria-hidden="true">{`v${__APP_VERSION__}`}</span>
        </span>
      </p>

      <p
        style={{
          maxWidth: 540,
          margin: "0 auto",
          color: theme.textDimmed,
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {`${t("disclaimer")} ${t("manualNote")}`}
      </p>
    </div>
  </footer>
);
