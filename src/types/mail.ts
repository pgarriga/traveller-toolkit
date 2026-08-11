// Mail Run type definitions — Mongoose Traveller 2e Core Rulebook (2022) p. 241

import type { TranslationKey } from "./i18n";

export type FreightTrafficBand = "veryLow" | "low" | "neutral" | "high" | "veryHigh";

// Las tres tablas de rangos del manual: Armada (marinería/suboficiales),
// Armada (oficiales) y Servicio de Exploración.
export type MailRankService = "navyEnlisted" | "navyOfficer" | "scout";

export interface MailRankOption {
  id: string;                     // `${service}-${rank}`, único entre grupos
  service: MailRankService;
  rank: number;                   // 0–6 — el valor que aporta el DM
  titleKey: TranslationKey | null; // null = rango sin título en el manual
}

export interface MailRankGroup {
  service: MailRankService;
  labelKey: TranslationKey;
  options: readonly MailRankOption[];
}

export interface MailInputs {
  lowTL: boolean;           // true if world TL ≤5 (applies -4 DM)
  armed: boolean;           // true if ship is armed (+2 DM)
  rank: number;             // 0–6 (highest Navy/Scout rank in group)
  socDM: number;            // -3 to +3 (highest SOC DM in group)
  freightTrafficDM: number; // total freight traffic DM, computed from the Freight base DM
}

export interface MailDMBreakdownItem {
  label: string;
  value: number;
}

export interface MailRoll {
  twoD: number;       // 2D roll for availability
  containerD: number; // 1D roll for container count (1–6)
}

export interface MailResult {
  totalDM: number;
  breakdown: MailDMBreakdownItem[];
  trafficBand: FreightTrafficBand;
  trafficBandDM: number;
  rolled2D: number | null;
  finalRoll: number | null;
  available: boolean | null;
  containers: number | null;
  cargoTons: number | null;
  payment: number | null;
}
