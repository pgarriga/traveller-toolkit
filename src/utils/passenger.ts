import type {
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
  const push = (label: string, value: number): void => {
    if (value !== 0) breakdown.push({ label, value });
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

  const pricesForRoute = PASSAGE_PRICES[parsecs];

  const buildClass = (
    type: PassengerClass,
    roll: number | null,
    dice: number[],
  ): PassengerClassResult => {
    const dm = baseDM + PASSENGER_CLASS_DM[type];
    const pricePerSeat = pricesForRoute[type];

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
        income: null,
      };
    }

    const finalRoll = roll + dm;
    const diceCount = passengersFromTraffic(finalRoll);

    if (dice.length > 0) {
      const passengers = dice.reduce((sum, d) => sum + d, 0);
      const income = passengers * pricePerSeat;
      return {
        type,
        dm,
        rolled2D: roll,
        finalRoll,
        diceCount,
        dice,
        passengers,
        pricePerSeat,
        income,
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
      income: null,
    };
  };

  const classes: Record<PassengerClass, PassengerClassResult> = {
    high: buildClass("high", rollHigh, diceHigh),
    middle: buildClass("middle", rollMiddle, diceMiddle),
    basic: buildClass("basic", rollBasic, diceBasic),
    low: buildClass("low", rollLow, diceLow),
  };

  const hasRolls = (Object.values(classes) as PassengerClassResult[]).some(c => c.dice !== null);
  const totalPassengers = hasRolls
    ? (Object.values(classes) as PassengerClassResult[]).reduce(
        (sum, c) => sum + (c.passengers ?? 0),
        0,
      )
    : null;
  const totalRevenue = hasRolls
    ? (Object.values(classes) as PassengerClassResult[]).reduce(
        (sum, c) => sum + (c.income ?? 0),
        0,
      )
    : null;

  return {
    baseDM,
    breakdown,
    classes,
    hasRolls,
    totalPassengers,
    totalRevenue,
  };
};
