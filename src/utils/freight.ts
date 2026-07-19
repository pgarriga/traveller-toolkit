import type {
  FreightInputs,
  FreightResult,
  FreightWorldInputs,
  DMBreakdownItem,
  LotResult,
  LotType,
  ParsecDistance,
} from "../types/freight";
import type { TranslationFunction } from "../types/i18n";
import {
  POPULATION_DM,
  STARPORT_DM,
  TECH_LEVEL_DM,
  ZONE_DM,
  LOT_TYPE_DM,
  MEAN_TONS_PER_LOT,
  TONS_PER_LOT_DIE,
  FREIGHT_RATES_PER_TON,
  lotsFromTraffic,
  LATE_PAYMENT_MULTIPLIER,
} from "../constants/freight";

const worldDM = (world: FreightWorldInputs): number =>
  POPULATION_DM[world.population] +
  STARPORT_DM[world.starport] +
  TECH_LEVEL_DM[world.techLevel] +
  ZONE_DM[world.zone];

export const calculateFreight = (
  inputs: FreightInputs,
  t: TranslationFunction
): FreightResult => {
  const {
    origin,
    destination,
    parsecs,
    jumps,
    cargoBay,
    skillEffect,
    rollMajor,
    rollMinor,
    rollIncidental,
    diceMajor,
    diceMinor,
    diceIncidental,
    onTime,
  } = inputs;

  const breakdown: DMBreakdownItem[] = [];
  const push = (label: string, value: number): void => {
    if (value !== 0) breakdown.push({ label, value });
  };

  push(t("freightOriginPop"), POPULATION_DM[origin.population]);
  push(t("freightOriginStarport"), STARPORT_DM[origin.starport]);
  push(t("freightOriginTL"), TECH_LEVEL_DM[origin.techLevel]);
  push(t("freightOriginZone"), ZONE_DM[origin.zone]);
  push(t("freightDestPop"), POPULATION_DM[destination.population]);
  push(t("freightDestStarport"), STARPORT_DM[destination.starport]);
  push(t("freightDestTL"), TECH_LEVEL_DM[destination.techLevel]);
  push(t("freightDestZone"), ZONE_DM[destination.zone]);

  const parsecPenalty = -(parsecs - 1);
  push(`${t("freightParsecPenalty")} (${parsecs})`, parsecPenalty);
  push(t("freightSkillEffect"), skillEffect);

  const baseDM =
    worldDM(origin) + worldDM(destination) + parsecPenalty + skillEffect;

  const effectiveJumps: ParsecDistance[] = jumps.length > 0 ? jumps : [parsecs];
  const ratePerTon = effectiveJumps.reduce(
    (sum, j) => sum + FREIGHT_RATES_PER_TON[j],
    0,
  );

  const buildLot = (type: LotType, roll: number | null, dice: number[]): LotResult => {
    const dm = baseDM + LOT_TYPE_DM[type];
    const multiplier = TONS_PER_LOT_DIE[type];
    const trafficLots = roll === null ? null : lotsFromTraffic(roll + dm);

    if (dice.length > 0) {
      const perLotTons = dice.map(d => d * multiplier);
      const tons = perLotTons.reduce((sum, t) => sum + t, 0);
      const income = Math.round(tons * ratePerTon);
      return { type, dm, lots: dice.length, tons, perLotTons, income };
    }

    if (trafficLots === null) {
      return { type, dm, lots: null, tons: null, perLotTons: null, income: null };
    }

    const tons = trafficLots * MEAN_TONS_PER_LOT[type];
    const income = Math.round(tons * ratePerTon);
    return { type, dm, lots: trafficLots, tons, perLotTons: null, income };
  };

  const lots: Record<LotType, LotResult> = {
    major: buildLot("major", rollMajor, diceMajor),
    minor: buildLot("minor", rollMinor, diceMinor),
    incidental: buildLot("incidental", rollIncidental, diceIncidental),
  };

  const hasRolls =
    rollMajor !== null || rollMinor !== null || rollIncidental !== null ||
    diceMajor.length > 0 || diceMinor.length > 0 || diceIncidental.length > 0;

  const totalTons = hasRolls
    ? (lots.major.tons ?? 0) + (lots.minor.tons ?? 0) + (lots.incidental.tons ?? 0)
    : null;

  const grossIncome = hasRolls
    ? (lots.major.income ?? 0) + (lots.minor.income ?? 0) + (lots.incidental.income ?? 0)
    : null;

  const latePaymentMultiplier = onTime ? 1 : LATE_PAYMENT_MULTIPLIER;
  const netIncome =
    grossIncome !== null ? Math.round(grossIncome * latePaymentMultiplier) : null;

  const excessTons = totalTons !== null ? Math.max(0, totalTons - cargoBay) : 0;
  const fitsInBay = excessTons === 0;

  return {
    baseDM,
    breakdown,
    lots,
    hasRolls,
    totalTons,
    cargoBay,
    fitsInBay,
    excessTons,
    grossIncome,
    netIncome,
    ratePerTon,
    onTime,
    latePaymentMultiplier,
  };
};
