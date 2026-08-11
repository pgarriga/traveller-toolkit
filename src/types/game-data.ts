// Game data type definitions

export interface StarportData {
  name: string;
  fuel: string;
  berth: string;
  services: string;
  bases: string;
}

export interface SizeData {
  d: string;    // diameter
  g: string;    // gravity
  ex: string;   // example
  desc: string; // description
}

export interface AtmosphereData {
  comp: string;  // composition
  pres: string;  // pressure
  equip: string; // equipment required
  desc: string;  // description
}

export interface GovernmentData {
  type: string;
  desc: string;
  contra: string; // contraband
}

// Tech level description keys
export type TechLevelKey =
  | "primitive"
  | "preindustrial"
  | "industrial"
  | "preatomic"
  | "earlySpace"
  | "earlyStellar"
  | "midStellar"
  | "advancedStellar";
