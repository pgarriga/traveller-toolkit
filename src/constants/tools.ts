// Las herramientas de la app: cuáles hay, en qué bloque van y en qué orden.
//
// Una sola lista para los dos sitios donde se enseña la navegación —el índice de
// la portada y el menú desplegable—, porque son lo mismo visto dos veces. Cuando
// cada uno llevaba la suya se separaron sin que nadie se diera cuenta: el menú
// ponía "Mundos visitados" al final, al lado de Ajustes, y el índice la tenía
// con las de navegación, que es su sitio.
//
// Ajustes NO está aquí: no es una herramienta, es la página de la aplicación.
// Por eso el menú la pone aparte, detrás de un filete, y el índice no la pone.

/** Las vistas a las que lleva una herramienta. "ship" no está: el bloque de
 * naves no lleva herramientas, lleva la flota. */
export type ToolViewId = "search" | "nearby" | "recent" | "passenger" | "freight";

/** El icono de cada una, por nombre: los constantes no pintan JSX. */
export type ToolIconId = "search" | "radar" | "pin" | "users" | "box" | "ship";

export interface ToolEntry {
  view: ToolViewId;
  icon: ToolIconId;
  titleKey: string;
}

export interface ToolGroupDef {
  key: string;
  titleKey: string;
  tools: readonly ToolEntry[];
}

/**
 * Tres bloques —dónde estás, qué se mueve y con qué lo mueves— porque una lista
 * de seis herramientas sueltas no dice cuál sirve para qué. Un bloque con una
 * sola es normal: los tres son sitios donde crecer.
 */
export const TOOL_GROUPS: readonly ToolGroupDef[] = [
  {
    key: "navigation",
    titleKey: "homeGroupNavigation",
    tools: [
      { view: "search", icon: "search", titleKey: "searchTitle" },
      { view: "nearby", icon: "radar", titleKey: "nearbyTitle" },
      { view: "recent", icon: "pin", titleKey: "recentWorldsTitle" },
    ],
  },
  {
    key: "traffic",
    titleKey: "homeGroupTraffic",
    tools: [
      { view: "passenger", icon: "users", titleKey: "passengerTitle" },
      { view: "freight", icon: "box", titleKey: "freightTitle" },
    ],
  },
  {
    // Este bloque no lista herramientas: lista la FLOTA, y las naves las pone
    // quien lo dibuja, porque no se saben de antemano. El índice pinta una
    // tarjeta por nave más las de crear e importar; el menú, una entrada por
    // nave, que la elige y abre su ficha. Por eso `tools` va vacío y no con una
    // entrada genérica: "Mi nave" no dice cuál de las tuyas es.
    key: "ships",
    titleKey: "homeGroupShips",
    tools: [],
  },
];
