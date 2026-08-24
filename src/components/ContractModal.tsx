import type { CSSProperties, FC } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { TranslationFunction } from "../types/i18n";
import type { ContractData, ContractKind, ContractMetaItem } from "../types/contract";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { IconDownload, IconShare } from "./icons";
import { COLORS } from "../constants/colors";
import { renderContractImage } from "../utils/contractImage";

interface ContractModalProps {
  theme: Theme;
  t: TranslationFunction;
  data: ContractData;
  onClose: () => void;
}

// Mismo canonical que declara index.html: el contrato acaba impreso o pegado
// en un chat, así que lleva de vuelta a la app.
const APP_URL = "https://pgarriga.github.io/traveller-toolkit/";

// NAVE-FRE-AAAAMMDDHHMM. La referencia es también el nombre del PNG que se
// descarga, así que el nombre de la nave se reduce a A-Z y 0-9: fuera tildes,
// espacios y cualquier cosa que un sistema de ficheros mire con recelo. Sin
// nombre de nave, el segmento simplemente no aparece.
const makeReference = (kind: ContractKind, ship: string | null): string => {
  const tag = kind === "freight" ? "FRE" : "PAS";
  const name = (ship ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}`;
  return [name, tag, stamp].filter(Boolean).join("-");
};

// Un único aviso para las acciones del pie: sólo una está activa a la vez.
type Status = "idle" | "downloaded" | "error";

const STATUS_KEY: Record<Exclude<Status, "idle">, string> = {
  downloaded: "contractDownloaded",
  error: "contractImageError",
};

// Los botones del pie son acciones táctiles: 44 px mínimo.
const touchTarget: CSSProperties = { minHeight: 44 };

export const ContractModal: FC<ContractModalProps> = ({ theme, t, data, onClose }) => {
  const [reference] = useState(() => makeReference(data.kind, data.ship));
  const [status, setStatus] = useState<Status>("idle");
  // Las dos acciones pintan el mismo PNG: mientras dura, se deshabilitan ambas.
  const [rendering, setRendering] = useState(false);

  // La nave encabeza el contrato: es de quién es el trato, no un metadato más.
  const header = useMemo<ContractMetaItem[]>(() => {
    const items: ContractMetaItem[] = [];
    if (data.ship) items.push({ label: t("contractShip"), value: data.ship });
    items.push({ label: t("contractReference"), value: reference });
    return items;
  }, [data.ship, reference, t]);

  const settle = (state: Status): void => {
    setStatus(state);
    window.setTimeout(() => setStatus("idle"), 2500);
  };

  const buildImage = (): Promise<File> =>
    renderContractImage(data, {
      header,
      colItem: t("contractColItem"),
      colQty: t("contractColQty"),
      colRate: t("contractColRate"),
      colAmount: t("contractColAmount"),
      noLines: t("contractNoLines"),
      total: t("contractTotal"),
      footer: t("contractFooter"),
      url: APP_URL,
      dash: t("freightDash"),
    }).then(blob => new File([blob], `${reference}.png`, { type: "image/png" }));

  const saveFile = (file: File): void => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    // El ancla tiene que estar en el documento y la URL no se puede revocar en
    // el mismo tick: algunos navegadores cancelan la descarga.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const runImageAction = (action: (file: File) => Promise<Status>): void => {
    if (rendering) return;
    setRendering(true);
    buildImage()
      .then(action)
      .then(next => {
        if (next !== "idle") settle(next);
      })
      .catch((err: Error) => {
        // Cerrar la hoja de compartir nativa no es un fallo.
        if (err.name === "AbortError") return;
        console.error("Contract image failed:", err);
        settle("error");
      })
      .finally(() => setRendering(false));
  };

  const handleDownload = (): void =>
    runImageAction(file => {
      saveFile(file);
      return Promise.resolve("downloaded" as Status);
    });

  // Donde el navegador sabe compartir ficheros (móvil, sobre todo) abre la hoja
  // nativa — Telegram, WhatsApp, correo…; si no, descarga la imagen igualmente.
  const handleShare = (): void =>
    runImageAction(file => {
      if (navigator.canShare?.({ files: [file] })) {
        return navigator.share({ files: [file], title: data.title }).then(() => "idle" as Status);
      }
      saveFile(file);
      return Promise.resolve("downloaded" as Status);
    });

  const capLabel: CSSProperties = {
    fontSize: 10,
    color: theme.textDimmed,
    textTransform: "uppercase",
    letterSpacing: 1,
  };

  const monoValue: CSSProperties = {
    fontFamily: "monospace",
    fontSize: 13,
    color: theme.text,
  };

  // La fila de cierre de la tabla: es la cifra que se firma, así que lleva la
  // línea naranja encima y no la trama de las filas normales.
  const totalCell: CSSProperties = {
    borderTop: `2px solid ${COLORS.primary}`,
    background: "transparent",
    fontWeight: 500,
    fontSize: 14,
    textAlign: "left",
    padding: "10px 12px",
    color: theme.text,
  };


  return (
    <Modal
      theme={theme}
      title={data.title}
      closeLabel={t("close")}
      onClose={onClose}
      maxWidth={620}
      panelClassName="contract-sheet"
      footer={
        <>
          <span
            role="status"
            style={{
              fontSize: 12,
              marginRight: "auto",
              color: status === "error" ? COLORS.warning : COLORS.success,
            }}
          >
            {rendering ? t("contractRendering") : status === "idle" ? "" : t(STATUS_KEY[status])}
          </span>
          <Button
            variant="ghost"
            theme={theme}
            onClick={handleDownload}
            disabled={rendering}
            style={touchTarget}
          >
            <IconDownload />{t("contractDownload")}
          </Button>
          <Button
            variant="ghost"
            theme={theme}
            onClick={handleShare}
            disabled={rendering}
            style={touchTarget}
          >
            <IconShare />{t("contractShare")}
          </Button>
          <Button variant="primary" theme={theme} onClick={onClose} style={touchTarget}>
            {t("close")}
          </Button>
        </>
      }
    >
      {/* Reference block */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          paddingBottom: 12,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        {header.map(item => (
          <div key={item.label}>
            <div style={capLabel}>{item.label}</div>
            <div style={monoValue}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Route */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          padding: "12px 0",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        {data.parties.map(party => (
          <div key={party.role}>
            <div style={capLabel}>{party.role}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>{party.name}</div>
            {party.detail && (
              <div style={{ fontSize: 11, fontFamily: "monospace", color: theme.textDimmed }}>
                {party.detail}
              </div>
            )}
          </div>
        ))}
      </div>

      {data.meta.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 12,
            padding: "12px 0",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          {data.meta.map(item => (
            <div key={item.label}>
              <div style={capLabel}>{item.label}</div>
              <div style={monoValue}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Line items */}
      {data.lines.length === 0 ? (
        <div style={{ fontSize: 13, color: theme.textDimmed, fontStyle: "italic", marginTop: 24 }}>
          {t("contractNoLines")}
        </div>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 24 }}>
          <table className="traveller-table">
            <thead>
              <tr>
                <th scope="col">{t("contractColItem")}</th>
                <th scope="col">{t("contractColQty")}</th>
                <th scope="col">{t("contractColRate")}</th>
                <th scope="col" style={{ textAlign: "right" }}>{t("contractColAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map(line => (
                <tr key={line.id}>
                  <td>
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: line.accent,
                        marginRight: 8,
                      }}
                    />
                    {line.label}
                    {line.detail && (
                      <div style={{ fontSize: 11, color: theme.textDimmed, marginLeft: 16 }}>
                        {line.detail}
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{line.qty}</td>
                  <td style={{ fontFamily: "monospace", whiteSpace: "nowrap", color: theme.textDimmed }}>
                    {line.rate ?? t("freightDash")}
                  </td>
                  <td style={{ fontFamily: "monospace", whiteSpace: "nowrap", textAlign: "right" }}>
                    {line.amount}
                  </td>
                </tr>
              ))}
            </tbody>
            {data.total && (
              <tfoot>
                <tr>
                  <th scope="row" style={totalCell}>{t("contractTotal")}</th>
                  <td style={{ ...totalCell, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {data.total.qty}
                  </td>
                  <td style={totalCell} />
                  <td style={{ ...totalCell, fontFamily: "monospace", whiteSpace: "nowrap", textAlign: "right" }}>
                    {data.total.amount}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Totals */}
      {data.totals.length > 0 && (
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: `2px solid ${theme.border}` }}>
          {data.totals.map(total => (
            <div
              key={total.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 12,
                padding: "4px 0",
              }}
            >
              <span style={{ fontSize: total.strong ? 14 : 13, color: total.strong ? theme.text : theme.textDimmed, fontWeight: total.strong ? 500 : 400 }}>
                {total.label}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 500,
                  fontSize: total.strong ? 18 : 13,
                  color: total.warn ? COLORS.warning : total.strong ? COLORS.success : theme.text,
                }}
              >
                {total.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {data.notes.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          {data.notes.map(note => (
            <div
              key={note}
              style={{
                fontSize: 11,
                color: theme.textDimmed,
                lineHeight: 1.5,
                borderLeft: `2px solid ${theme.border}`,
                paddingLeft: 8,
              }}
            >
              {note}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          paddingTop: 10,
          borderTop: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 10, color: theme.textDimmed, textTransform: "uppercase", letterSpacing: 1 }}>
          {t("contractFooter")}
        </span>
        <a
          href={APP_URL}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 11, fontFamily: "monospace", color: COLORS.primary, textDecoration: "none" }}
        >
          {APP_URL}
        </a>
      </div>
    </Modal>
  );
};
