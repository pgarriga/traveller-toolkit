import type { RecentPlanet, ZoneCode } from "../types/uwp";
import type {
  FreightWorldInputs,
  PopulationTier,
  FreightStarport,
  TechLevelTier,
  FreightZoneTier,
} from "../types/freight";
import type {
  PassengerWorldInputs,
  PassengerPopTier,
  PassengerStarport,
  PassengerZoneTier,
} from "../types/passenger";
import { ZONES } from "../constants/zones";

const hex = (c: string): number => {
  const n = parseInt(c, 16);
  return Number.isNaN(n) ? 0 : n;
};

interface UwpKeyDigits {
  sp: string;
  po: number;
  tl: number;
}

const readKeyDigits = (rawUwp: string): UwpKeyDigits | null => {
  const clean = rawUwp.replace(/\s|-/g, "").toUpperCase();
  if (clean.length < 8) return null;
  return {
    sp: clean[0],
    po: hex(clean[4]),
    tl: hex(clean[clean.length - 1]),
  };
};

const freightPopTier = (po: number): PopulationTier => {
  if (po <= 3) return "low";
  if (po <= 6) return "mid";
  if (po <= 8) return "high";
  return "veryHigh";
};

const passengerPopTier = (po: number): PassengerPopTier => {
  if (po <= 3) return "veryLow";
  if (po <= 6) return "mid";
  if (po <= 8) return "high";
  return "veryHigh";
};

const isFreightStarport = (sp: string): sp is FreightStarport =>
  sp === "A" || sp === "B" || sp === "C" || sp === "E" || sp === "X";

const isPassengerStarport = (sp: string): sp is PassengerStarport =>
  sp === "A" || sp === "B" || sp === "C" || sp === "D" || sp === "E" || sp === "X";

// Freight table has no D — map to C (both share DM 0).
const freightStarport = (sp: string): FreightStarport =>
  isFreightStarport(sp) ? sp : "C";

const passengerStarport = (sp: string): PassengerStarport =>
  isPassengerStarport(sp) ? sp : "C";

const tlTier = (tl: number): TechLevelTier => {
  if (tl <= 5) return "low";
  if (tl <= 11) return "mid";
  return "high";
};

const freightZone = (zone: ZoneCode): FreightZoneTier => {
  if (zone === ZONES.AMBER) return "amber";
  if (zone === ZONES.RED) return "red";
  return "green";
};

const passengerZone = (zone: ZoneCode): PassengerZoneTier => {
  if (zone === ZONES.AMBER) return "amber";
  if (zone === ZONES.RED) return "red";
  return "green";
};

export const planetToFreightWorld = (planet: RecentPlanet): FreightWorldInputs | null => {
  const d = readKeyDigits(planet.uwp);
  if (!d) return null;
  return {
    population: freightPopTier(d.po),
    starport: freightStarport(d.sp),
    techLevel: tlTier(d.tl),
    zone: freightZone(planet.zone),
  };
};

export const planetToPassengerWorld = (planet: RecentPlanet): PassengerWorldInputs | null => {
  const d = readKeyDigits(planet.uwp);
  if (!d) return null;
  return {
    population: passengerPopTier(d.po),
    starport: passengerStarport(d.sp),
    zone: passengerZone(planet.zone),
  };
};
