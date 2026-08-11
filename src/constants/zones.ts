import type { ZoneCode } from "../types/uwp";

// Travel zone constants
export const ZONES = {
  GREEN: "V",
  AMBER: "A",
  RED: "R",
} as const satisfies Record<string, ZoneCode>;

export const ZONE_COLORS: Record<ZoneCode, string> = {
  [ZONES.AMBER]: "#f59e0b",
  [ZONES.RED]: "#ef4444",
  [ZONES.GREEN]: "#10b981",
} as const;

// Helper to get zone color
export const getZoneColor = (zone: ZoneCode): string => {
  return ZONE_COLORS[zone] || ZONE_COLORS[ZONES.GREEN];
};
