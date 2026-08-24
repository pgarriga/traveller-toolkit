import type { CSSProperties, FC } from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../types/theme";
import type { Language, TranslationFunction } from "../types/i18n";
import type { ContractData, ContractKind, ContractMetaItem } from "../types/contract";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { IconCopy, IconPrinter, IconShare } from "./icons";
import { COLORS } from "../constants/colors";
import { renderContractImage } from "../utils/contractImage";
import { localeFor } from "../utils/format";

interface ContractModalProps {
  theme: Theme;
  lang: Language;
  t: TranslationFunction;
  data: ContractData;
  onClose: () => void;
}

// Mismo canonical que declara index.html: el contrato acaba impreso o pegado
// en un chat, así que lleva de vuelta a la app.
const APP_URL = "https://pgarriga.github.io/traveller-toolkit/";

// Every export is its own document, so the reference is minted when the modal
// opens rather than derived from the calculation.
const makeReference = (kind: ContractKind): string => {
  const prefix = kind === "freight" ? "FRT" : "PSG";
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const tail = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0");
  return `${prefix}-${stamp}-${tail}`;
};

// Plain-text twin of the sheet, for the clipboard.
const toPlainText = (data: ContractData, header: ContractMetaItem[], t: TranslationFunction): string => {
  const out: string[] = [data.title.toUpperCase()];
  header.forEach(h => out.push(`${h.label}: ${h.value}`));
  out.push("");
  data.parties.forEach(p => out.push(`${p.role}: ${p.name}${p.detail ? ` (${p.detail})` : ""}`));
  if (data.meta.length > 0) {
    out.push("");
    data.meta.forEach(m => out.push(`${m.label}: ${m.value}`));
  }
  out.push("", `--- ${t("contractItems")} ---`);
  if (data.lines.length === 0) {
    out.push(t("contractNoLines"));
  } else {
    data.lines.forEach(l => {
      const rate = l.rate ? ` @ ${l.rate}` : "";
      out.push(`- ${l.label} · ${l.qty}${rate} = ${l.amount}`);
    });
  }
  if (data.totals.length > 0) {
    out.push("");
    data.totals.forEach(x => out.push(`${x.label}: ${x.value}`));
  }
  if (data.notes.length > 0) {
    out.push("");
    data.notes.forEach(n => out.push(n));
  }
  out.push("", `${t("contractFooter")} · ${APP_URL}`);
  return out.join("\n");
};

// Un único aviso para las acciones del pie: sólo una está activa a la vez.
type Status = "idle" | "copied" | "copyError" | "downloaded" | "shareError";

const STATUS_KEY: Record<Exclude<Status, "idle">, string> = {
  copied: "contractCopied",
  copyError: "contractCopyError",
  downloaded: "contractDownloaded",
  shareError: "contractShareError",
};

const isError = (s: Status): boolean => s === "copyError" || s === "shareError";

// Los botones del pie son acciones táctiles: 44 px mínimo.
const touchTarget: CSSProperties = { minHeight: 44 };

export const ContractModal: FC<ContractModalProps> = ({ theme, lang, t, data, onClose }) => {
  const [reference] = useState(() => makeReference(data.kind));
  const [issued] = useState(() =>
    new Date().toLocaleString(localeFor(lang), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const [status, setStatus] = useState<Status>("idle");
  const [sharing, setSharing] = useState(false);

  // La nave encabeza el contrato: es de quién es el trato, no un metadato más.
  const header = useMemo<ContractMetaItem[]>(() => {
    const items: ContractMetaItem[] = [];
    if (data.ship) items.push({ label: t("contractShip"), value: data.ship });
    items.push({ label: t("contractReference"), value: reference });
    items.push({ label: t("contractIssued"), value: issued });
    return items;
  }, [data.ship, reference, issued, t]);

  const plainText = useMemo(() => toPlainText(data, header, t), [data, header, t]);

  const settle = (state: Status): void => {
    setStatus(state);
    window.setTimeout(() => setStatus("idle"), 2500);
  };

  const handleCopy = (): void => {
    // navigator.clipboard no existe fuera de un contexto seguro (http en LAN),
    // así que hay que comprobarlo antes de llamarlo, no sólo capturar el rechazo.
    if (!navigator.clipboard) {
      settle("copyError");
      return;
    }
    navigator.clipboard
      .writeText(plainText)
      .then(() => settle("copied"))
      .catch((err: Error) => {
        console.error("Clipboard write failed:", err);
        settle("copyError");
      });
  };

  // Comparte el contrato como PNG. Donde el navegador sabe compartir ficheros
  // (móvil, sobre todo) abre la hoja nativa — Telegram, WhatsApp, correo…; si
  // no, descarga la imagen para adjuntarla a mano.
  const handleShare = (): void => {
    if (sharing) return;
    setSharing(true);
    renderContractImage(data, {
      header,
      items: t("contractItems"),
      colItem: t("contractColItem"),
      colQty: t("contractColQty"),
      colRate: t("contractColRate"),
      colAmount: t("contractColAmount"),
      noLines: t("contractNoLines"),
      footer: t("contractFooter"),
      url: APP_URL,
      dash: t("freightDash"),
    })
      .then(blob => {
        const file = new File([blob], `${reference}.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          return navigator.share({ files: [file], title: data.title }).then(() => "idle" as Status);
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        // El ancla tiene que estar en el documento y la URL no se puede
        // revocar en el mismo tick: algunos navegadores cancelan la descarga.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
        return "downloaded" as Status;
      })
      .then(next => {
        if (next !== "idle") settle(next);
      })
      .catch((err: Error) => {
        // Cerrar la hoja de compartir nativa no es un fallo.
        if (err.name === "AbortError") return;
        console.error("Contract image share failed:", err);
        settle("shareError");
      })
      .finally(() => setSharing(false));
  };

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

  // <h3> under the modal's <h2>: the sheet's blocks are real structure, so a
  // screen reader can jump between them.
  const blockTitle: CSSProperties = {
    fontSize: 11,
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: 500,
    margin: "18px 0 8px",
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
              color: isError(status) ? COLORS.warning : COLORS.success,
            }}
          >
            {sharing ? t("contractSharing") : status === "idle" ? "" : t(STATUS_KEY[status])}
          </span>
          <Button variant="ghost" theme={theme} onClick={handleCopy} style={touchTarget}>
            <IconCopy />{t("contractCopy")}
          </Button>
          <Button
            variant="ghost"
            theme={theme}
            onClick={handleShare}
            disabled={sharing}
            style={touchTarget}
          >
            <IconShare />{t("contractShare")}
          </Button>
          <Button variant="ghost" theme={theme} onClick={() => window.print()} style={touchTarget}>
            <IconPrinter />{t("contractPrint")}
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
          <div key={party.role} style={{ borderLeft: `3px solid ${COLORS.primary}`, paddingLeft: 10 }}>
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
      <h3 style={blockTitle}>{t("contractItems")}</h3>
      {data.lines.length === 0 ? (
        <div style={{ fontSize: 13, color: theme.textDimmed, fontStyle: "italic" }}>
          {t("contractNoLines")}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
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
