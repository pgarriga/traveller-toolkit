// Passenger calculator type definitions (Mongoose Traveller 2e, Seeking Passengers pp. 239-240).

export type PassengerClass = "high" | "middle" | "basic" | "low";
export type PassengerStarport = "A" | "B" | "C" | "D" | "E" | "X";
export type PassengerZoneTier = "green" | "amber" | "red";
export type PassengerPopTier = "veryLow" | "mid" | "high" | "veryHigh";
export type ParsecDistance = 1 | 2 | 3 | 4 | 5 | 6;

export interface PassengerWorldInputs {
  population: PassengerPopTier;
  starport: PassengerStarport;
  zone: PassengerZoneTier;
}

export interface PassengerInputs {
  origin: PassengerWorldInputs;
  destination: PassengerWorldInputs;
  parsecs: ParsecDistance;
  jumps: ParsecDistance[];
  brokerEffect: number;
  stewardSkill: number;
  rollHigh: number | null;
  rollMiddle: number | null;
  rollBasic: number | null;
  rollLow: number | null;
  diceHigh: number[];
  diceMiddle: number[];
  diceBasic: number[];
  diceLow: number[];
}

// Plazas que la nave puede vender de cada clase. 0 significa que no hay: esa
// clase no se puede aceptar, por muchos pasajeros que ofrezca el mercado.
export type ShipBerths = Record<PassengerClass, number>;

export interface PassengerDMBreakdownItem {
  label: string;
  value: number;
}

export interface PassengerClassResult {
  type: PassengerClass;
  dm: number;
  rolled2D: number | null;
  finalRoll: number | null;
  diceCount: number | null;
  dice: number[] | null;
  passengers: number | null;
  pricePerSeat: number;
}

export interface PassengerResult {
  baseDM: number;
  breakdown: PassengerDMBreakdownItem[];
  classes: Record<PassengerClass, PassengerClassResult>;
  hasRolls: boolean;
}