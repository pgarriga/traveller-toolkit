// Traveller Map API helpers
// Docs: https://travellermap.com/doc/api

export interface WorldSearchResult {
  name: string;
  uwp: string;
  sector: string;
  hex: string;
}

interface RawWorld {
  Name: string;
  Uwp: string;
  Sector: string;
  HexX: number;
  HexY: number;
}

interface RawSearchResponse {
  Results?: {
    Items?: Array<{ World?: RawWorld }>;
  };
}

const SEARCH_ENDPOINT = "https://travellermap.com/api/search";

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
      hex: formatHex(w.HexX, w.HexY),
    });
  }
  return worlds;
};