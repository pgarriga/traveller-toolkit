// Paints a ContractData onto a canvas and returns it as a PNG blob, so the
// contract can be shared as an image (Telegram, WhatsApp, email…).
//
// Drawn by hand with the Canvas 2D API instead of rasterising the DOM: the
// project ships no external libraries, and the usual DOM-to-canvas trick
// (serialising the node into an SVG <foreignObject>) silently drops the Inter
// webfont and every rule that lives in index.css, including `.traveller-table`.
// `ContractData` is already flat, fully-formatted text, so painting it directly
// is smaller, deterministic, and identical in every browser.
//
// The sheet is always painted light — a shared image has no theme to follow,
// and the dark surface would be unreadable on a white chat bubble.

import type { ContractData, ContractMetaItem } from "../types/contract";
import { COLORS, THEMES, TRAVELLER } from "../constants/colors";

const WIDTH = 760;
const PAD = 36;
const SCALE = 2; // pinta al doble para que no se vea borroso en pantallas HiDPI

const INK = THEMES.light.text;
const MUTED = THEMES.light.textMuted;
const DIM = THEMES.light.textDimmed;
const RULE = THEMES.light.border;
const SANS = "Inter, system-ui, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const ROW_H = 30;
const COL_QTY = 90;
const COL_RATE = 110;
const COL_AMOUNT = 120;

export interface ContractImageLabels {
  // Referencia, fecha de emisión y nave: lo que va bajo el título.
  header: ContractMetaItem[];
  colItem: string;
  colQty: string;
  colRate: string;
  colAmount: string;
  noLines: string;
  total: string;
  footer: string;
  url: string;
  dash: string;
}

// Un único recorrido de pintado. Con `draw = false` no dibuja nada y sólo
// devuelve la altura final, que es lo que hace falta para crear el lienzo
// definitivo antes de repetir el recorrido de verdad.
const paint = (
  ctx: CanvasRenderingContext2D,
  draw: boolean,
  data: ContractData,
  l: ContractImageLabels,
): number => {
  const inner = WIDTH - PAD * 2;
  const right = PAD + inner;
  let y = 0;

  ctx.textBaseline = "top";

  const setFont = (weight: number, size: number, family = SANS, tracking = 0): void => {
    ctx.font = `${weight} ${size}px ${family}`;
    // letterSpacing es reciente; donde no exista, el texto sale sin tracking.
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${tracking}px`;
  };

  const fill = (x: number, top: number, w: number, h: number, color: string): void => {
    if (!draw) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, top, w, h);
  };

  const put = (s: string, x: number, top: number, color: string, align: CanvasTextAlign = "left"): void => {
    if (!draw) return;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(s, x, top);
  };

  const clip = (s: string, max: number): string => {
    if (ctx.measureText(s).width <= max) return s;
    let out = s;
    while (out.length > 1 && ctx.measureText(`${out}…`).width > max) out = out.slice(0, -1);
    return `${out}…`;
  };

  const wrap = (s: string, max: number): string[] => {
    const out: string[] = [];
    let line = "";
    s.split(/\s+/).forEach(word => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= max || !line) {
        line = next;
      } else {
        out.push(line);
        line = word;
      }
    });
    if (line) out.push(line);
    return out;
  };

  const rule = (): void => {
    fill(PAD, y, inner, 1, RULE);
    y += 1;
  };

  // Bloque "etiqueta en versalitas + valor monoespaciado", 32 px de alto.
  const capValue = (label: string, value: string, x: number, w: number): void => {
    setFont(500, 10, SANS, 1);
    put(label.toUpperCase(), x, y, DIM);
    setFont(400, 13, MONO);
    put(clip(value, w), x, y + 15, INK);
  };

  // ---- cabecera --------------------------------------------------------
  fill(0, 0, WIDTH, 6, TRAVELLER.orange);
  y = 34;

  setFont(500, 22, SANS, 2);
  put(data.title.toUpperCase(), PAD, y, TRAVELLER.orange);
  y += 40;
  rule();
  y += 16;

  const headerW = inner / Math.max(1, l.header.length);
  l.header.forEach((item, idx) => capValue(item.label, item.value, PAD + idx * headerW, headerW - 12));
  y += 32 + 16;
  rule();
  y += 16;

  const half = inner / 2;

  // ---- origen / destino ------------------------------------------------
  data.parties.forEach((party, idx) => {
    const x = PAD + idx * half;
    const w = half - 16;
    setFont(500, 10, SANS, 1);
    put(party.role.toUpperCase(), x, y, DIM);
    setFont(500, 16, SANS);
    put(clip(party.name, w), x, y + 14, INK);
    setFont(400, 11, MONO);
    put(clip(party.detail, w), x, y + 36, MUTED);
  });
  y += 52 + 16;

  if (data.meta.length > 0) {
    rule();
    y += 16;
    const colW = inner / data.meta.length;
    data.meta.forEach((item, idx) => capValue(item.label, item.value, PAD + idx * colW, colW - 12));
    y += 32 + 16;
  }

  rule();
  y += 32;

  // ---- conceptos -------------------------------------------------------
  if (data.lines.length === 0) {
    setFont(400, 13, SANS);
    put(l.noLines, PAD, y, DIM);
    y += 24;
  } else {
    const itemW = inner - COL_QTY - COL_RATE - COL_AMOUNT - 24;
    const xQty = right - COL_RATE - COL_AMOUNT;
    const xRate = right - COL_AMOUNT;

    fill(PAD, y, inner, 28, TRAVELLER.orange);
    setFont(500, 11, SANS, 1);
    put(l.colItem.toUpperCase(), PAD + 12, y + 9, TRAVELLER.cream);
    put(l.colQty.toUpperCase(), xQty, y + 9, TRAVELLER.cream, "right");
    put(l.colRate.toUpperCase(), xRate, y + 9, TRAVELLER.cream, "right");
    put(l.colAmount.toUpperCase(), right - 12, y + 9, TRAVELLER.cream, "right");
    y += 28;

    data.lines.forEach((line, idx) => {
      if (idx % 2 === 0) fill(PAD, y, inner, ROW_H, "rgba(212, 82, 28, 0.06)");
      fill(PAD + 12, y + 12, 6, 6, line.accent);
      setFont(400, 13, SANS);
      put(clip(line.label, itemW), PAD + 26, y + 8, INK);
      setFont(400, 13, MONO);
      put(line.qty, xQty, y + 8, INK, "right");
      put(line.rate ?? l.dash, xRate, y + 8, MUTED, "right");
      put(line.amount, right - 12, y + 8, INK, "right");
      fill(PAD, y + ROW_H - 1, inner, 1, "rgba(212, 82, 28, 0.15)");
      y += ROW_H;
    });

    if (data.total) {
      fill(PAD, y, inner, 2, TRAVELLER.orange);
      y += 10;
      setFont(500, 14, SANS);
      put(l.total.toUpperCase(), PAD + 12, y, INK);
      setFont(500, 14, MONO);
      put(data.total.qty, xQty, y, INK, "right");
      put(data.total.amount, right - 12, y, INK, "right");
      y += 24;
    }
  }

  // ---- totales ---------------------------------------------------------
  if (data.totals.length > 0) {
    y += 14;
    fill(PAD, y, inner, 2, RULE);
    y += 14;
    data.totals.forEach(total => {
      const size = total.strong ? 17 : 13;
      // El ámbar del tema se pierde sobre papel blanco: en la imagen los
      // avisos van en rojo-óxido, que sí contrasta.
      const color = total.warn ? COLORS.danger : total.strong ? COLORS.success : INK;
      setFont(total.strong ? 500 : 400, total.strong ? 14 : 13, SANS);
      put(total.label, PAD, y + (total.strong ? 2 : 0), total.strong ? INK : DIM);
      setFont(500, size, MONO);
      put(total.value, right, y, color, "right");
      y += size + 12;
    });
  }

  // ---- notas -----------------------------------------------------------
  if (data.notes.length > 0) {
    y += 8;
    setFont(400, 11, SANS);
    data.notes.forEach(note => {
      const rows = wrap(note, inner - 14);
      fill(PAD, y, 2, rows.length * 16, RULE);
      rows.forEach(row => {
        put(row, PAD + 10, y, MUTED);
        y += 16;
      });
      y += 6;
    });
  }

  // ---- pie -------------------------------------------------------------
  y += 14;
  rule();
  y += 12;
  setFont(500, 10, SANS, 1);
  const footer = l.footer.toUpperCase();
  put(footer, PAD, y + 1, DIM);
  const footerW = ctx.measureText(footer).width;
  setFont(400, 11, MONO);
  put(l.url, PAD + footerW + 12, y, TRAVELLER.orange);
  y += 24;

  return y + PAD;
};

export const renderContractImage = async (
  data: ContractData,
  labels: ContractImageLabels,
): Promise<Blob> => {
  // Sin esperar a las fuentes, el primer render mide con la de sistema y el
  // texto se sale de sus columnas.
  if (document.fonts?.ready) await document.fonts.ready;

  const gauge = document.createElement("canvas").getContext("2d");
  if (!gauge) throw new Error("Canvas 2D is not available");
  const height = paint(gauge, false, data, labels);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = Math.ceil(height) * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, WIDTH, height);
  paint(ctx, true, data, labels);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Could not encode the contract image"));
    }, "image/png");
  });
};
