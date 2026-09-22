// Claves de localStorage usadas por la app.
// Los valores "sticky" son propiedades de la nave/tripulación: se conservan
// entre sesiones y NO los borra el botón de "nueva búsqueda".

export const STORAGE_KEYS = {
  recentPlanets: "traveller-recent",
  // Preferencias de la aplicación, no de la partida.
  theme: "traveller-theme",
  lang: "traveller-lang",
  // La flota de "Mi nave": todas las naves creadas y cuál está activa. La nave
  // activa es la que leen las dos calculadoras, así que su nombre, su bodega y
  // sus plazas de pasajero viven aquí dentro.
  fleet: "traveller-fleet",
  freightSkillEffect: "traveller-freight-skill-effect",
  // Heredadas: hoy todo esto vive dentro de la nave activa, y estas claves solo
  // se leen una vez, al construir la flota, para no perder lo que el jugador ya
  // tenía puesto antes de que hubiera flota. Ver hooks/useShip.ts.
  //   ship      — la ficha única, de cuando solo había una nave.
  //   shipName  — su nombre, que las dos calculadoras compartían.
  ship: "traveller-ship",
  shipName: "traveller-ship-name",
  freightCargoBay: "traveller-freight-cargo-bay",
  freightMail: "traveller-freight-mail",
  passengerBrokerEffect: "traveller-passenger-broker-effect",
  passengerStewardSkill: "traveller-passenger-steward-skill",
  passengerBerths: "traveller-passenger-berths",
} as const;

export const isFiniteNumber = (raw: unknown): raw is number =>
  typeof raw === "number" && Number.isFinite(raw);

export const isString = (raw: unknown): raw is string => typeof raw === "string";
