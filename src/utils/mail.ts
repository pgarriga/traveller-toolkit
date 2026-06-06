import type {
  MailDMBreakdownItem,
  MailInputs,
  MailResult,
  MailRoll,
} from "../types/mail";
import type { TranslationFunction } from "../types/i18n";
import {
  MAIL_ARMED_DM,
  MAIL_AVAILABILITY_TARGET,
  MAIL_LOW_TL_DM,
  MAIL_PAYMENT_PER_CONTAINER,
  MAIL_TONS_PER_CONTAINER,
  TRAFFIC_BAND_DM,
  trafficBand,
} from "../constants/mail";

const formatSigned = (n: number): string => (n > 0 ? `+${n}` : `${n}`);

export const calculateMail = (
  inputs: MailInputs,
  t: TranslationFunction,
  roll?: MailRoll | null,
): MailResult => {
  const band = trafficBand(inputs.freightTrafficDM);
  const trafficBandDM = TRAFFIC_BAND_DM[band];
  const lowTLDM = inputs.lowTL ? MAIL_LOW_TL_DM : 0;
  const armedDM = inputs.armed ? MAIL_ARMED_DM : 0;

  const breakdown: MailDMBreakdownItem[] = [];
  const push = (label: string, value: number): void => {
    if (value !== 0) breakdown.push({ label, value });
  };
  // Siempre se muestra aunque el bono sea 0, así queda claro qué bono aporta el DM de carga.
  breakdown.push({
    label: `${t("mailDMFreightTraffic")} (${formatSigned(inputs.freightTrafficDM)})`,
    value: trafficBandDM,
  });
  push(t("mailDMArmed"), armedDM);
  push(t("mailDMLowTL"), lowTLDM);
  push(t("mailDMRank"), inputs.rank);
  push(t("mailDMSoc"), inputs.socDM);

  const totalDM = trafficBandDM + armedDM + lowTLDM + inputs.rank + inputs.socDM;

  if (!roll) {
    return {
      totalDM,
      breakdown,
      trafficBand: band,
      trafficBandDM,
      rolled2D: null,
      finalRoll: null,
      available: null,
      containers: null,
      cargoTons: null,
      payment: null,
    };
  }

  const finalRoll = roll.twoD + totalDM;
  const available = finalRoll >= MAIL_AVAILABILITY_TARGET;
  const containers = available ? roll.containerD : null;
  const cargoTons = containers !== null ? containers * MAIL_TONS_PER_CONTAINER : null;
  const payment = containers !== null ? containers * MAIL_PAYMENT_PER_CONTAINER : null;

  return {
    totalDM,
    breakdown,
    trafficBand: band,
    trafficBandDM,
    rolled2D: roll.twoD,
    finalRoll,
    available,
    containers,
    cargoTons,
    payment,
  };
};
