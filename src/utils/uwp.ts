import type { StarportClass } from "../types/uwp";
import type { StarportData } from "../types/game-data";

const hex = (v: string): number => parseInt(v, 16);

type StarportLookup = Record<StarportClass, StarportData>;

interface InternalParsedUWP {
  sp: StarportClass;
  sz: number;
  at: number;
  hy: number;
  po: number;
  go: number;
  la: number;
  tl: number;
}

export const parseUwp = (uwpString: string, STARPORT: StarportLookup): InternalParsedUWP | null => {
  const clean = uwpString.replace(/\s|-/g, "").toUpperCase();
  if (clean.length < 8) return null;

  const sp = clean[0] as StarportClass;
  if (!STARPORT[sp]) return null;

  const vals: number[] = [];
  for (let i = 1; i < 8; i++) {
    const v = hex(clean[i]);
    if (isNaN(v)) return null;
    vals.push(v);
  }

  const [sz, at, hy, po, go, la] = vals;
  const tl = clean.length >= 9 ? hex(clean[clean.length - 1]) : vals[6];

  return { sp, sz, at, hy, po, go, la, tl };
};
