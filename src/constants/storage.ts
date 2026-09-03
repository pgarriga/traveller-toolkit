// Claves de localStorage usadas por la app.
// Los valores "sticky" son propiedades de la nave/tripulación: se conservan
// entre sesiones y NO los borra el botón de "nueva búsqueda".

export const STORAGE_KEYS = {
  recentPlanets: "traveller-recent",
  // La nave es la misma en las dos calculadoras y en "Mi nave", así que
  // comparten clave.
  shipName: "traveller-ship-name",
  // La ficha de "Mi nave". Contiene la bodega y las plazas de pasajero, que
  // antes vivían sueltas en freightCargoBay y passengerBerths.
  ship: "traveller-ship",
  freightSkillEffect: "traveller-freight-skill-effect",
  // Heredadas: hoy las dos capacidades viven dentro de la ficha de la nave y
  // estas claves solo se leen una vez, para no perder lo que el jugador ya tenía
  // puesto cuando "Mi nave" no existía. Ver hooks/useShip.ts.
  freightCargoBay: "traveller-freight-cargo-bay",
  freightMail: "traveller-freight-mail",
  passengerBrokerEffect: "traveller-passenger-broker-effect",
  passengerStewardSkill: "traveller-passenger-steward-skill",
  passengerBerths: "traveller-passenger-berths",
} as const;

export const isFiniteNumber = (raw: unknown): raw is number =>
  typeof raw === "number" && Number.isFinite(raw);

export const isString = (raw: unknown): raw is string => typeof raw === "string";
