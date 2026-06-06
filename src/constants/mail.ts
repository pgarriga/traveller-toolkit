import type { FreightTrafficBand } from "../types/mail";

// Mail Run — Mongoose Traveller 2e Core Rulebook (2022) p. 241

export const MAIL_PAYMENT_PER_CONTAINER = 25_000;
export const MAIL_TONS_PER_CONTAINER = 5;
export const MAIL_AVAILABILITY_TARGET = 12;

export const MAIL_LOW_TL_DM = -4;
export const MAIL_ARMED_DM = 2;

export const MAIL_RANK_MIN = 0;
export const MAIL_RANK_MAX = 6;
export const MAIL_SOC_DM_MIN = -3;
export const MAIL_SOC_DM_MAX = 3;

export const trafficBand = (freightDM: number): FreightTrafficBand => {
  if (freightDM <= -10) return "veryLow";
  if (freightDM <= -5) return "low";
  if (freightDM <= 4) return "neutral";
  if (freightDM <= 9) return "high";
  return "veryHigh";
};

export const TRAFFIC_BAND_DM: Record<FreightTrafficBand, number> = {
  veryLow: -2,
  low: -1,
  neutral: 0,
  high: 1,
  veryHigh: 2,
} as const;

export const rollD6 = (): number => Math.floor(Math.random() * 6) + 1;
