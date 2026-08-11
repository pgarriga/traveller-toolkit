// Claves de localStorage usadas por la app.
// Los valores "sticky" son propiedades de la nave/tripulación: se conservan
// entre sesiones y NO los borra el botón de "nueva búsqueda".

export const STORAGE_KEYS = {
  recentPlanets: "traveller-recent",
  freightSkillEffect: "traveller-freight-skill-effect",
  freightCargoBay: "traveller-freight-cargo-bay",
  freightMail: "traveller-freight-mail",
  passengerBrokerEffect: "traveller-passenger-broker-effect",
  passengerStewardSkill: "traveller-passenger-steward-skill",
} as const;

export const isFiniteNumber = (raw: unknown): raw is number =>
  typeof raw === "number" && Number.isFinite(raw);
