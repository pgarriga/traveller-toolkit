// Freight calculator type definitions

export type PopulationTier = "low" | "mid" | "high" | "veryHigh";
export type FreightStarport = "A" | "B" | "C" | "E" | "X";
export type TechLevelTier = "low" | "mid" | "high";
export type FreightZoneTier = "green" | "amber" | "red";
export type ParsecDistance = 1 | 2 | 3 | 4 | 5 | 6;
export type LotType = "major" | "minor" | "incidental";

export interface FreightWorldInputs {
  population: PopulationTier;
  starport: FreightStarport;
  techLevel: TechLevelTier;
  zone: FreightZoneTier;
}

export interface FreightInputs {
  origin: FreightWorldInputs;
  destination: FreightWorldInputs;
  parsecs: ParsecDistance;
  cargoBay: number;
  skillEffect: number;
  rollMajor: number | null;
  rollMinor: number | null;
  rollIncidental: number | null;
  diceMajor: number[];
  diceMinor: number[];
  diceIncidental: number[];
  onTime: boolean;
}

export interface DMBreakdownItem {
  label: string;
  value: number;
}

export interface LotResult {
  type: LotType;
  dm: number;
  lots: number | null;
  tons: number | null;
  perLotTons: number[] | null;
  income: number | null;
}

export interface FreightResult {
  baseDM: number;
  breakdown: DMBreakdownItem[];
  lots: Record<LotType, LotResult>;
  hasRolls: boolean;
  totalTons: number | null;
  cargoBay: number;
  fitsInBay: boolean;
  excessTons: number;
  grossIncome: number | null;
  netIncome: number | null;
  ratePerTon: number;
  onTime: boolean;
  latePaymentMultiplier: number;
}
