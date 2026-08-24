// Contract / invoice export type definitions.
//
// The Freight and Passenger calculators both end in a "print this as a small
// contract" modal. Neither of them knows how the sheet is laid out: each view
// builds a `ContractData` with everything already formatted for the current
// language, and `ContractModal` renders it. Keeping the numbers formatted at
// the source avoids duplicating `formatCredits`/`formatTons` in the modal.

export type ContractKind = "freight" | "passenger";

export interface ContractParty {
  role: string;   // "Origin" / "Destination"
  name: string;   // world name, or a placeholder when none was linked
  detail: string; // UWP + sector, or the manually picked world profile
}

export interface ContractMetaItem {
  label: string;
  value: string;
}

// One billable row of the invoice: a cargo lot, a mail container batch, or a
// block of seats of one passenger class.
export interface ContractLine {
  id: string;
  label: string;         // "Major lot #1", "High passage"
  detail: string | null; // secondary note under the label
  qty: string;           // "40 t", "x3"
  rate: string | null;   // "Cr 1,000 /t"
  amount: string;        // "Cr 40,000"
  accent: string;        // row marker color
}

export interface ContractTotal {
  label: string;
  value: string;
  strong?: boolean;
  warn?: boolean;
}

export interface ContractData {
  kind: ContractKind;
  title: string;
  ship: string | null; // null cuando el jugador no ha puesto nombre a la nave
  parties: ContractParty[];
  meta: ContractMetaItem[];
  lines: ContractLine[];
  totals: ContractTotal[];
  notes: string[];
}
