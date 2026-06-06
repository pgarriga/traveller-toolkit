// Mail Run type definitions — Mongoose Traveller 2e Core Rulebook (2022) p. 241

export type FreightTrafficBand = "veryLow" | "low" | "neutral" | "high" | "veryHigh";

export interface MailInputs {
  lowTL: boolean;           // true if world TL ≤5 (applies -4 DM)
  armed: boolean;           // true if ship is armed (+2 DM)
  rank: number;             // 0–6 (highest Naval/Scout rank in group)
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
