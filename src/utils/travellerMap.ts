// Traveller Map API helpers
// Docs: https://travellermap.com/doc/api

import type { TravellerMapWorld, ZoneCode } from "../types/uwp";
import type { NearbyWorld } from "../types/nearby";
import { ZONES } from "../constants/zones";

// A world straight from the map, before its distance to the origin is known.
export type RawNearbyWorld = Omit<NearbyWorld, "distance">;

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

interface RawJumpWorld {
  Name?: string;
  UWP?: string;
  Hex?: string;
  PBG?: string;
  Sector?: string;
  SubsectorName?: string;
  Zone?: string;
  Allegiance?: string;
  AllegianceName?: string;
  Stellar?: string;
  Remarks?: string;
  WorldX?: number;
  WorldY?: number;
}

interface RawJumpWorldsFullResponse {
  Worlds?: RawJumpWorld[];
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
  return toZone(world.Zone);
};

const toZone = (raw: string | undefined): ZoneCode => {
  const z = (raw ?? "").trim().toUpperCase();
  if (z === "A") return ZONES.AMBER as ZoneCode;
  if (z === "R") return ZONES.RED as ZoneCode;
  return ZONES.GREEN as ZoneCode;
};

// PBG packs Population multiplier / Belts / Gas giants into three digits; the
// last one is the gas giant count. Unsurveyed worlds use "?" placeholders, and
// an unknown count is treated as none so no route relies on it.
const gasGiantCount = (pbg: string | undefined): number => {
  const digit = parseInt((pbg ?? "").trim()[2] ?? "", 16);
  return Number.isNaN(digit) ? 0 : digit;
};

// Every world within `jump` parsecs of a location, straight from the map data.
// The endpoint caps `jump` at 12 and the result includes the origin world itself.
export const fetchJumpWorlds = async (
  sector: string,
  hex: string,
  jump: number,
  signal?: AbortSignal,
): Promise<RawNearbyWorld[]> => {
  const params = new URLSearchParams({ sector, hex, jump: String(jump) });
  const res = await fetch(`${JUMPWORLDS_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Traveller Map jumpworlds failed: ${res.status}`);
  }
  const data = (await res.json()) as RawJumpWorldsFullResponse;
  const worlds: RawNearbyWorld[] = [];
  for (const w of data.Worlds ?? []) {
    // Without coordinates the world cannot be placed, so it is unusable here.
    if (typeof w.WorldX !== "number" || typeof w.WorldY !== "number") continue;
    worlds.push({
      name: w.Name?.trim() || "",
      uwp: (w.UWP ?? "").toUpperCase(),
      sector: w.Sector ?? "",
      hex: w.Hex ?? "",
      subsector: w.SubsectorName ?? "",
      zone: toZone(w.Zone),
      allegiance: w.AllegianceName?.trim() || w.Allegiance?.trim() || "",
      stellar: w.Stellar?.trim() || "",
      remarks: w.Remarks?.trim() || "",
      gasGiants: gasGiantCount(w.PBG),
      worldX: w.WorldX,
      worldY: w.WorldY,
    });
  }
  return worlds;
};
