// Traveller Map API helpers
// Docs: https://travellermap.com/doc/api

import type { TravellerMapWorld, ZoneCode } from "../types/uwp";
import { ZONES } from "../constants/zones";

export interface WorldSearchResult extends TravellerMapWorld {
  hex: string;
}

interface RawWorld {
  Name: string;
  Uwp: string;
  Sector: string;
  HexX: number;
  HexY: number;
  SectorX: number;
  SectorY: number;
  SectorTags: string;
}

interface RawSearchResponse {
  Results?: {
    Items?: Array<{ World?: RawWorld }>;
  };
}

interface RawJumpworldsResponse {
  Worlds?: Array<{ Zone?: string }>;
}

const SEARCH_ENDPOINT = "https://travellermap.com/api/search";
const JUMPWORLDS_ENDPOINT = "https://travellermap.com/api/jumpworlds";

const formatHex = (x: number, y: number): string =>
  `${String(x).padStart(2, "0")}${String(y).padStart(2, "0")}`;

export const searchWorlds = async (
  query: string,
  signal?: AbortSignal,
): Promise<WorldSearchResult[]> => {
  const url = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
  if (!res.ok) {
    throw new Error(`Traveller Map search failed: ${res.status}`);
  }
  const data = (await res.json()) as RawSearchResponse;
  const items = data.Results?.Items ?? [];
  const worlds: WorldSearchResult[] = [];
  for (const item of items) {
    const w = item.World;
    if (!w || !w.Uwp) continue;
    worlds.push({
      name: w.Name,
      uwp: w.Uwp.toUpperCase(),
      sector: w.Sector,
      hexX: w.HexX,
      hexY: w.HexY,
      sectorX: w.SectorX,
      sectorY: w.SectorY,
      sectorTags: w.SectorTags,
      hex: formatHex(w.HexX, w.HexY),
    });
  }
  return worlds;
};

// Fetches the Travel Zone for a single world from the jumpworlds endpoint.
// Response `Zone` is "" (green), "A" (amber) or "R" (red).
export const fetchWorldZone = async (
  sector: string,
  hexX: number,
  hexY: number,
  signal?: AbortSignal,
): Promise<ZoneCode | null> => {
  const hex = formatHex(hexX, hexY);
  const url = `${JUMPWORLDS_ENDPOINT}?sector=${encodeURIComponent(sector)}&hex=${encodeURIComponent(hex)}&jump=0`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
  if (!res.ok) {
    throw new Error(`Traveller Map jumpworlds failed: ${res.status}`);
  }
  const data = (await res.json()) as RawJumpworldsResponse;
  const world = data.Worlds?.[0];
  if (!world) return null;
  const raw = (world.Zone ?? "").trim().toUpperCase();
  if (raw === "A") return ZONES.AMBER as ZoneCode;
  if (raw === "R") return ZONES.RED as ZoneCode;
  return ZONES.GREEN as ZoneCode;
};