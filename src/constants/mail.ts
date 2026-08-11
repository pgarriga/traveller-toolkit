import type {
  FreightTrafficBand,
  MailRankGroup,
  MailRankOption,
  MailRankService,
} from "../types/mail";
import type { TranslationKey } from "../types/i18n";

// Mail Run — Mongoose Traveller 2e Core Rulebook (2022) p. 241

export const MAIL_PAYMENT_PER_CONTAINER = 25_000;
export const MAIL_TONS_PER_CONTAINER = 5;
export const MAIL_AVAILABILITY_TARGET = 12;

export const MAIL_LOW_TL_DM = -4;
export const MAIL_ARMED_DM = 2;

export const MAIL_RANK_MIN = 0;
export const MAIL_RANK_MAX = 6;
export const MAIL_SOC_DM_MIN = -3;
export const MAIL_SOC_DM_MAX = 3;

// Tablas de rangos (Core Rulebook: Armada y Servicio de Exploración).
// El DM del Mail Run es el número de rango, así que un mismo número aparece
// en los tres grupos; el `id` es lo que distingue la opción elegida.
export const MAIL_RANK_NONE_ID = "none";

const rankOption = (
  service: MailRankService,
  rank: number,
  titleKey: TranslationKey | null,
): MailRankOption => ({ id: `${service}-${rank}`, service, rank, titleKey });

export const MAIL_RANK_GROUPS: readonly MailRankGroup[] = [
  {
    service: "navyEnlisted",
    labelKey: "mailRankGroupNavyEnlisted",
    options: [
      rankOption("navyEnlisted", 0, "mailRankNavyEnlisted0"),
      rankOption("navyEnlisted", 1, "mailRankNavyEnlisted1"),
      rankOption("navyEnlisted", 2, "mailRankNavyEnlisted2"),
      rankOption("navyEnlisted", 3, "mailRankNavyEnlisted3"),
      rankOption("navyEnlisted", 4, "mailRankNavyEnlisted4"),
      rankOption("navyEnlisted", 5, "mailRankNavyEnlisted5"),
      rankOption("navyEnlisted", 6, "mailRankNavyEnlisted6"),
    ],
  },
  {
    service: "navyOfficer",
    labelKey: "mailRankGroupNavyOfficer",
    // La tabla de oficiales del manual empieza en 1: no hay oficial de rango 0.
    options: [
      rankOption("navyOfficer", 1, "mailRankNavyOfficer1"),
      rankOption("navyOfficer", 2, "mailRankNavyOfficer2"),
      rankOption("navyOfficer", 3, "mailRankNavyOfficer3"),
      rankOption("navyOfficer", 4, "mailRankNavyOfficer4"),
      rankOption("navyOfficer", 5, "mailRankNavyOfficer5"),
      rankOption("navyOfficer", 6, "mailRankNavyOfficer6"),
    ],
  },
  {
    service: "scout",
    labelKey: "mailRankGroupScout",
    // Sólo los rangos 1 y 3 tienen título en el manual; el resto se listan igual
    // para poder elegir el DM. Posiciones según la edición inglesa: la española
    // los coloca en 0 y 2, pero las bonificaciones son las mismas y el original
    // manda.
    options: [
      rankOption("scout", 0, null),
      rankOption("scout", 1, "mailRankScout1"),
      rankOption("scout", 2, null),
      rankOption("scout", 3, "mailRankScout3"),
      rankOption("scout", 4, null),
      rankOption("scout", 5, null),
      rankOption("scout", 6, null),
    ],
  },
] as const;

export const findMailRank = (id: string): MailRankOption | undefined =>
  MAIL_RANK_GROUPS.flatMap(g => g.options).find(o => o.id === id);

export const trafficBand = (freightDM: number): FreightTrafficBand => {
  if (freightDM <= -10) return "veryLow";
  if (freightDM <= -5) return "low";
  if (freightDM <= 4) return "neutral";
  if (freightDM <= 9) return "high";
  return "veryHigh";
};

export const TRAFFIC_BAND_DM: Record<FreightTrafficBand, number> = {
  veryLow: -2,
  low: -1,
  neutral: 0,
  high: 1,
  veryHigh: 2,
} as const;

export const rollD6 = (): number => Math.floor(Math.random() * 6) + 1;
