// Claves de localStorage usadas por la app.
// Los valores "sticky" son propiedades de la nave/tripulación: se conservan
// entre sesiones y NO los borra el botón de "nueva búsqueda".

export const STORAGE_KEYS = {
  recentPlanets: "traveller-recent",
  // La nave es la misma en las dos calculadoras, así que comparten clave.
  shipName: "traveller-ship-name",
  freightSkillEffect: "traveller-freight-skill-effect",
  freightCargoBay: "traveller-freight-cargo-bay",
  freightMail: "traveller-freight-mail",
  passengerBrokerEffect: "traveller-passenger-broker-effect",
  passengerStewardSkill: "traveller-passenger-steward-skill",
  passengerBerths: "traveller-passenger-berths",
} as const;

export const isFiniteNumber = (raw: unknown): raw is number =>
  typeof raw === "number" && Number.isFinite(raw);

export const isString = (raw: unknown): raw is string => typeof raw === "string";
