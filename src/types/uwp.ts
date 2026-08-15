// UWP (Universal World Profile) type definitions

export type StarportClass = "A" | "B" | "C" | "D" | "E" | "X";

export type ZoneCode = "V" | "A" | "R"; // Verde/Amber/Red

export interface ParsedUWP {
  st: StarportClass;  // Starport
  sz: number;         // Size (0-10+)
  at: number;         // Atmosphere (0-15)
  hy: number;         // Hydrographics (0-10)
  po: number;         // Population (0-12)
  go: number;         // Government (0-15)
  la: number;         // Law level (0-9+)
  tl: number;         // Tech level (0-15+)
}

export interface TravellerMapWorld {
  name: string;
  uwp: string;
  sector: string;
  hexX: number;
  hexY: number;
  // Only /api/search reports these; jumpworlds does not. Nothing reads them
  // today, so they stay optional rather than being filled with placeholders.
  sectorX?: number;
  sectorY?: number;
  sectorTags?: string;
}

export interface RecentPlanet {
  uwp: string;
  name: string;
  zone: ZoneCode;
  timestamp: number;
  world?: TravellerMapWorld;
}
