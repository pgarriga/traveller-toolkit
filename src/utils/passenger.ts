import type {
  ParsecDistance,
  PassengerClass,
  PassengerClassResult,
  PassengerDMBreakdownItem,
  PassengerInputs,
  PassengerResult,
  PassengerWorldInputs,
} from "../types/passenger";
import type { TranslationFunction } from "../types/i18n";
import {
  PASSAGE_PRICES,
  PASSENGER_CLASS_DM,
  PASSENGER_POP_DM,
  PASSENGER_STARPORT_DM,
  PASSENGER_ZONE_DM,
  passengersFromTraffic,
} from "../constants/passenger";

const worldDM = (world: PassengerWorldInputs): number =>
  PASSENGER_POP_DM[world.population] +
  PASSENGER_STARPORT_DM[world.starport] +
  PASSENGER_ZONE_DM[world.zone];

export const calculatePassengers = (
  inputs: PassengerInputs,
  t: TranslationFunction,
): PassengerResult => {
  const {
    origin,
    destination,
    parsecs,
    jumps,
    brokerEffect,
    stewardSkill,
    rollHigh,
    rollMiddle,
    rollBasic,
    rollLow,
    diceHigh,
    diceMiddle,
    diceBasic,
    diceLow,
  } = inputs;

  const breakdown: PassengerDMBreakdownItem[] = [];
  // Todos los factores, también los que suman 0: el bloque de DM ocupa así
  // su altura definitiva desde el principio y no salta al cambiar un select.
  const push = (label: string, value: number): void => {
    breakdown.push({ label, value });
  };

  push(t("passengerOriginPop"), PASSENGER_POP_DM[origin.population]);
  push(t("passengerOriginStarport"), PASSENGER_STARPORT_DM[origin.starport]);
  push(t("passengerOriginZone"), PASSENGER_ZONE_DM[origin.zone]);
  push(t("passengerDestPop"), PASSENGER_POP_DM[destination.population]);
  push(t("passengerDestStarport"), PASSENGER_STARPORT_DM[destination.starport]);
  push(t("passengerDestZone"), PASSENGER_ZONE_DM[destination.zone]);

  const parsecPenalty = -(parsecs - 1);
  push(`${t("passengerParsecPenalty")} (${parsecs})`, parsecPenalty);
  push(t("passengerBrokerEffect"), brokerEffect);
  push(t("passengerStewardSkill"), stewardSkill);

  const baseDM =
    worldDM(origin) + worldDM(destination) + parsecPenalty + brokerEffect + stewardSkill;

  const effectiveJumps: ParsecDistance[] = jumps.length > 0 ? jumps : [parsecs];
  const pricePerSeatFor = (cls: PassengerClass): number =>
    effectiveJumps.reduce((sum, j) => sum + PASSAGE_PRICES[j][cls], 0);

  const buildClass = (
    type: PassengerClass,
    roll: number | null,
    dice: number[],
  ): PassengerClassResult => {
    const dm = baseDM + PASSENGER_CLASS_DM[type];
    const pricePerSeat = pricePerSeatFor(type);

    if (roll === null) {
      return {
        type,
        dm,
        rolled2D: null,
        finalRoll: null,
        diceCount: null,
        dice: null,
        passengers: null,
        pricePerSeat,
      };
    }

    const finalRoll = roll + dm;
    const diceCount = passengersFromTraffic(finalRoll);

    if (dice.length > 0) {
      const passengers = dice.reduce((sum, d) => sum + d, 0);
      return {
        type,
        dm,
        rolled2D: roll,
        finalRoll,
        diceCount,
        dice,
        passengers,
        pricePerSeat,
      };
    }

    return {
      type,
      dm,
      rolled2D: roll,
      finalRoll,
      diceCount,
      dice: null,
      passengers: null,
      pricePerSeat,
    };
  };

  const classes: Record<PassengerClass, PassengerClassResult> = {
    high: buildClass("high", rollHigh, diceHigh),
    middle: buildClass("middle", rollMiddle, diceMiddle),
    basic: buildClass("basic", rollBasic, diceBasic),
    low: buildClass("low", rollLow, diceLow),
  };

  const hasRolls = (Object.values(classes) as PassengerClassResult[]).some(c => c.dice !== null);

  return {
    baseDM,
    breakdown,
    classes,
    hasRolls,
  };
};
