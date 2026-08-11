import type { Language, TranslationFunction } from "../types/i18n";
import type { StarportData, SizeData, AtmosphereData, GovernmentData } from "../types/game-data";
import type { StarportClass } from "../types/uwp";

// Game data with translations
export function getSTARPORT(t: TranslationFunction): Record<Language, Record<StarportClass, StarportData>> {
  const none = t("none");
  const na = t("na");
  const free = t("free");

  return {
    es: {
      A: { name: "Excelente", fuel: "Refinado", berth: "1D×1.000 Cr", services: "Astillero (todos), Reparación", bases: "Naval 8+, Exploración 10+, Investigación 8+, SAV" },
      B: { name: "Buena", fuel: "Refinado", berth: "1D×500 Cr", services: "Astillero (astronaves), Reparación", bases: "Naval 8+, Exploración 8+, Investigación 10+, SAV" },
      C: { name: "Rutinaria", fuel: "Sin refinar", berth: "1D×100 Cr", services: "Astillero (lanzaderas), Reparación", bases: "Exploración 8+, Investigación 10+, SAV 10+" },
      D: { name: "Pobre", fuel: "Sin refinar", berth: "1D×10 Cr", services: "Reparación limitada", bases: "Exploración 7+" },
      E: { name: "Fronteriza", fuel: "Ninguno", berth: "Gratis", services: "Ninguno", bases: "Ninguno" },
      X: { name: "Sin astropuerto", fuel: "Ninguno", berth: "N/A", services: "Ninguno", bases: "Ninguno" },
    },
    en: {
      A: { name: "Excellent", fuel: "Refined", berth: "1D×1,000 Cr", services: "Shipyard (all), Repair", bases: "Naval 8+, Scout 10+, Research 8+, TAS" },
      B: { name: "Good", fuel: "Refined", berth: "1D×500 Cr", services: "Shipyard (starships), Repair", bases: "Naval 8+, Scout 8+, Research 10+, TAS" },
      C: { name: "Routine", fuel: "Unrefined", berth: "1D×100 Cr", services: "Shipyard (shuttles), Repair", bases: "Scout 8+, Research 10+, TAS 10+" },
      D: { name: "Poor", fuel: "Unrefined", berth: "1D×10 Cr", services: "Limited repair", bases: "Scout 7+" },
      E: { name: "Frontier", fuel: none, berth: free, services: none, bases: none },
      X: { name: "No starport", fuel: none, berth: na, services: none, bases: none },
    },
    ca: {
      A: { name: "Excel·lent", fuel: "Refinat", berth: "1D×1.000 Cr", services: "Drassana (tots), Reparació", bases: "Naval 8+, Explorador 10+, Investigació 8+, SAV" },
      B: { name: "Bo", fuel: "Refinat", berth: "1D×500 Cr", services: "Drassana (astronaus), Reparació", bases: "Naval 8+, Explorador 8+, Investigació 10+, SAV" },
      C: { name: "Rutinari", fuel: "Sense refinar", berth: "1D×100 Cr", services: "Drassana (llançadores), Reparació", bases: "Explorador 8+, Investigació 10+, SAV 10+" },
      D: { name: "Pobre", fuel: "Sense refinar", berth: "1D×10 Cr", services: "Reparació limitada", bases: "Explorador 7+" },
      E: { name: "Fronterer", fuel: none, berth: free, services: none, bases: none },
      X: { name: "Sense astroport", fuel: none, berth: na, services: none, bases: none },
    },
  };
}

export function getSIZE(lang: Language): SizeData[] {
  const data: Record<Language, SizeData[]> = {
    es: [
      { d: "<1.000 km", g: "Desdeñable", ex: "Asteroide", desc: "Asteroide o complejo orbital. Sin atmósfera." },
      { d: "1.600 km", g: "0,05", ex: "Tritón", desc: "Cuerpo muy pequeño, sin atmósfera respirable." },
      { d: "3.200 km", g: "0,15", ex: "Luna, Europa", desc: "Pequeño satélite." },
      { d: "4.800 km", g: "0,25", ex: "Mercurio", desc: "Mundo pequeño." },
      { d: "6.400 km", g: "0,35", ex: "", desc: "Mundo pequeño, baja gravedad." },
      { d: "8.000 km", g: "0,45", ex: "Marte", desc: "Mundo mediano-pequeño, baja gravedad." },
      { d: "9.600 km", g: "0,7", ex: "", desc: "Mundo mediano. Baja gravedad (≤0,7g)." },
      { d: "11.200 km", g: "0,9", ex: "", desc: "Mundo mediano-grande." },
      { d: "12.800 km", g: "1,0", ex: "Tierra", desc: "Similar a la Tierra." },
      { d: "14.400 km", g: "1,25", ex: "", desc: "Mundo grande." },
      { d: "16.000 km", g: "1,4", ex: "", desc: "Mundo muy grande. Alta gravedad (≥1,4g)." },
    ],
    en: [
      { d: "<1,000 km", g: "Negligible", ex: "Asteroid", desc: "Asteroid or orbital complex. No atmosphere." },
      { d: "1,600 km", g: "0.05", ex: "Triton", desc: "Very small body, no breathable atmosphere." },
      { d: "3,200 km", g: "0.15", ex: "Luna, Europa", desc: "Small satellite." },
      { d: "4,800 km", g: "0.25", ex: "Mercury", desc: "Small world." },
      { d: "6,400 km", g: "0.35", ex: "", desc: "Small world, low gravity." },
      { d: "8,000 km", g: "0.45", ex: "Mars", desc: "Medium-small world, low gravity." },
      { d: "9,600 km", g: "0.7", ex: "", desc: "Medium world. Low gravity (≤0.7g)." },
      { d: "11,200 km", g: "0.9", ex: "", desc: "Medium-large world." },
      { d: "12,800 km", g: "1.0", ex: "Earth", desc: "Similar to Earth." },
      { d: "14,400 km", g: "1.25", ex: "", desc: "Large world." },
      { d: "16,000 km", g: "1.4", ex: "", desc: "Very large world. High gravity (≥1.4g)." },
    ],
    ca: [
      { d: "<1.000 km", g: "Insignificant", ex: "Asteroide", desc: "Asteroide o complex orbital. Sense atmosfera." },
      { d: "1.600 km", g: "0,05", ex: "Tritó", desc: "Cos molt petit, sense atmosfera respirable." },
      { d: "3.200 km", g: "0,15", ex: "Lluna, Europa", desc: "Petit satèl·lit." },
      { d: "4.800 km", g: "0,25", ex: "Mercuri", desc: "Món petit." },
      { d: "6.400 km", g: "0,35", ex: "", desc: "Món petit, gravetat baixa." },
      { d: "8.000 km", g: "0,45", ex: "Mart", desc: "Món mitjà-petit, gravetat baixa." },
      { d: "9.600 km", g: "0,7", ex: "", desc: "Món mitjà. Gravetat baixa (≤0,7g)." },
      { d: "11.200 km", g: "0,9", ex: "", desc: "Món mitjà-gran." },
      { d: "12.800 km", g: "1,0", ex: "Terra", desc: "Similar a la Terra." },
      { d: "14.400 km", g: "1,25", ex: "", desc: "Món gran." },
      { d: "16.000 km", g: "1,4", ex: "", desc: "Món molt gran. Gravetat alta (≥1,4g)." },
    ],
  };
  return data[lang];
}

export function getATMO(lang: Language): AtmosphereData[] {
  const data: Record<Language, AtmosphereData[]> = {
    es: [
      { comp: "Ninguno", pres: "0,00", equip: "Traje espacial", desc: "Sin atmósfera." },
      { comp: "Trazas", pres: "0,001-0,09", equip: "Traje espacial", desc: "Atmósfera vestigial." },
      { comp: "Muy tenue, Nociva", pres: "0,1-0,42", equip: "Respirador + Filtro", desc: "Muy tenue y tóxica." },
      { comp: "Muy tenue", pres: "0,1-0,42", equip: "Respirador", desc: "Muy tenue pero no tóxica." },
      { comp: "Tenue, Nociva", pres: "0,43-0,7", equip: "Filtro", desc: "Tenue y tóxica." },
      { comp: "Tenue", pres: "0,43-0,7", equip: "Ninguno", desc: "Tenue pero respirable." },
      { comp: "Estándar", pres: "0,71-1,49", equip: "Ninguno", desc: "Atmósfera similar a la Tierra." },
      { comp: "Estándar, Nociva", pres: "0,71-1,49", equip: "Filtro", desc: "Presión estándar pero tóxica." },
      { comp: "Densa", pres: "1,5-2,49", equip: "Ninguno", desc: "Atmósfera densa pero respirable." },
      { comp: "Densa, Nociva", pres: "1,5-2,49", equip: "Filtro", desc: "Densa y tóxica." },
      { comp: "Exótica", pres: "Varía", equip: "Suministro de aire", desc: "No respirable pero no peligrosa." },
      { comp: "Corrosiva", pres: "Varía", equip: "Traje espacial", desc: "¡Altamente peligrosa! 1D daño/turno." },
      { comp: "Insidiosa", pres: "Varía", equip: "Traje espacial", desc: "Corrosiva + destruye equipo en 2D horas." },
      { comp: "Densidad alta", pres: "2,5+", equip: "Varía", desc: "N₂/O₂ a muy alta presión. Solo habitable en altitud." },
      { comp: "Densidad baja", pres: "≤0,5", equip: "Varía", desc: "Solo respirable en tierras bajas y depresiones." },
      { comp: "Inusual", pres: "Varía", equip: "Varía", desc: "Atmósfera con comportamiento extraño." },
    ],
    en: [
      { comp: "None", pres: "0.00", equip: "Vacc suit", desc: "No atmosphere." },
      { comp: "Trace", pres: "0.001-0.09", equip: "Vacc suit", desc: "Vestigial atmosphere." },
      { comp: "Very thin, Tainted", pres: "0.1-0.42", equip: "Respirator + Filter", desc: "Very thin and toxic." },
      { comp: "Very thin", pres: "0.1-0.42", equip: "Respirator", desc: "Very thin but not toxic." },
      { comp: "Thin, Tainted", pres: "0.43-0.7", equip: "Filter", desc: "Thin and toxic." },
      { comp: "Thin", pres: "0.43-0.7", equip: "None", desc: "Thin but breathable." },
      { comp: "Standard", pres: "0.71-1.49", equip: "None", desc: "Earth-like atmosphere." },
      { comp: "Standard, Tainted", pres: "0.71-1.49", equip: "Filter", desc: "Standard pressure but toxic." },
      { comp: "Dense", pres: "1.5-2.49", equip: "None", desc: "Dense but breathable atmosphere." },
      { comp: "Dense, Tainted", pres: "1.5-2.49", equip: "Filter", desc: "Dense and toxic." },
      { comp: "Exotic", pres: "Varies", equip: "Air supply", desc: "Not breathable but not dangerous." },
      { comp: "Corrosive", pres: "Varies", equip: "Vacc suit", desc: "Highly dangerous! 1D damage/turn." },
      { comp: "Insidious", pres: "Varies", equip: "Vacc suit", desc: "Corrosive + destroys equipment in 2D hours." },
      { comp: "High density", pres: "2.5+", equip: "Varies", desc: "N₂/O₂ at very high pressure. Only habitable at altitude." },
      { comp: "Low density", pres: "≤0.5", equip: "Varies", desc: "Only breathable in lowlands and depressions." },
      { comp: "Unusual", pres: "Varies", equip: "Varies", desc: "Atmosphere with strange behavior." },
    ],
    ca: [
      { comp: "Cap", pres: "0,00", equip: "Vestit espacial", desc: "Sense atmosfera." },
      { comp: "Traces", pres: "0,001-0,09", equip: "Vestit espacial", desc: "Atmosfera vestigial." },
      { comp: "Molt tènue, Nociva", pres: "0,1-0,42", equip: "Respirador + Filtre", desc: "Molt tènue i tòxica." },
      { comp: "Molt tènue", pres: "0,1-0,42", equip: "Respirador", desc: "Molt tènue però no tòxica." },
      { comp: "Tènue, Nociva", pres: "0,43-0,7", equip: "Filtre", desc: "Tènue i tòxica." },
      { comp: "Tènue", pres: "0,43-0,7", equip: "Cap", desc: "Tènue però respirable." },
      { comp: "Estàndard", pres: "0,71-1,49", equip: "Cap", desc: "Atmosfera similar a la Terra." },
      { comp: "Estàndard, Nociva", pres: "0,71-1,49", equip: "Filtre", desc: "Pressió estàndard però tòxica." },
      { comp: "Densa", pres: "1,5-2,49", equip: "Cap", desc: "Atmosfera densa però respirable." },
      { comp: "Densa, Nociva", pres: "1,5-2,49", equip: "Filtre", desc: "Densa i tòxica." },
      { comp: "Exòtica", pres: "Varia", equip: "Subministrament d'aire", desc: "No respirable però no perillosa." },
      { comp: "Corrosiva", pres: "Varia", equip: "Vestit espacial", desc: "Altament perillosa! 1D dany/torn." },
      { comp: "Insidiosa", pres: "Varia", equip: "Vestit espacial", desc: "Corrosiva + destrueix l'equip en 2D hores." },
      { comp: "Densitat alta", pres: "2,5+", equip: "Varia", desc: "N₂/O₂ a molt alta pressió. Només habitable en altitud." },
      { comp: "Densitat baixa", pres: "≤0,5", equip: "Varia", desc: "Només respirable a terres baixes i depressions." },
      { comp: "Inusual", pres: "Varia", equip: "Varia", desc: "Atmosfera amb comportament estrany." },
    ],
  };
  return data[lang];
}

export function getHYDRO(lang: Language): string[] {
  const data: Record<Language, string[]> = {
    es: [
      "0%-5% — Mundo desértico", "6%-15% — Mundo seco", "16%-25% — Algunos mares pequeños",
      "26%-35% — Pequeños mares y océanos", "36%-45% — Mundo húmedo", "46%-55% — Grandes océanos",
      "56%-65%", "66%-75% — Similar a la Tierra", "76%-85% — Mundo acuático",
      "86%-95% — Solo islas y archipiélagos", "96%-100% — Casi todo agua",
    ],
    en: [
      "0%-5% — Desert world", "6%-15% — Dry world", "16%-25% — Some small seas",
      "26%-35% — Small seas and oceans", "36%-45% — Wet world", "46%-55% — Large oceans",
      "56%-65%", "66%-75% — Similar to Earth", "76%-85% — Water world",
      "86%-95% — Only islands and archipelagos", "96%-100% — Almost all water",
    ],
    ca: [
      "0%-5% — Món desèrtic", "6%-15% — Món sec", "16%-25% — Alguns petits mars",
      "26%-35% — Petits mars i oceans", "36%-45% — Món humit", "46%-55% — Grans oceans",
      "56%-65%", "66%-75% — Similar a la Terra", "76%-85% — Món aquàtic",
      "86%-95% — Només illes i arxipèlags", "96%-100% — Gairebé tot aigua",
    ],
  };
  return data[lang];
}

export function getPOP(lang: Language): string[] {
  const data: Record<Language, string[]> = {
    es: [
      "Ninguna (deshabitado)", "Pocos (1+) — Granja/familia", "Cientos (100+) — Aldea",
      "Miles (1.000+)", "Decenas de miles (10.000+) — Pueblo", "Cientos de miles (100.000+) — Ciudad mediana",
      "Millones (1.000.000+)", "Decenas de millones (10.000.000+) — Gran ciudad",
      "Cientos de millones (100.000.000+)", "Millardos (1.000.000.000+) — Tierra actual",
      "Decenas de millardos (10.000.000.000+)", "Cientos de millardos", "Billones — Mundo-ciudad",
    ],
    en: [
      "None (uninhabited)", "Few (1+) — Farm/family", "Hundreds (100+) — Village",
      "Thousands (1,000+)", "Tens of thousands (10,000+) — Town", "Hundreds of thousands (100,000+) — Medium city",
      "Millions (1,000,000+)", "Tens of millions (10,000,000+) — Large city",
      "Hundreds of millions (100,000,000+)", "Billions (1,000,000,000+) — Current Earth",
      "Tens of billions (10,000,000,000+)", "Hundreds of billions", "Trillions — Ecumenopolis",
    ],
    ca: [
      "Cap (deshabitat)", "Pocs (1+) — Granja/família", "Centenars (100+) — Poblet",
      "Milers (1.000+)", "Desenes de milers (10.000+) — Poble", "Centenars de milers (100.000+) — Ciutat mitjana",
      "Milions (1.000.000+)", "Desenes de milions (10.000.000+) — Gran ciutat",
      "Centenars de milions (100.000.000+)", "Milers de milions (1.000.000.000+) — Terra actual",
      "Desenes de milers de milions (10.000.000.000+)", "Centenars de milers de milions", "Bilions — Món-ciutat",
    ],
  };
  return data[lang];
}

export function getGOV(lang: Language): GovernmentData[] {
  const data: Record<Language, GovernmentData[]> = {
    es: [
      { type: "Ninguno", desc: "Sin estructura. Predominan lazos familiares.", contra: "Ninguno" },
      { type: "Compañía/Corporación", desc: "Élite gerencial de empresa. Ciudadanos son empleados.", contra: "Armas, drogas, Viajeros" },
      { type: "Democracia participativa", desc: "Decisiones por consentimiento directo de la ciudadanía.", contra: "Drogas" },
      { type: "Oligarquía autoperpetuante", desc: "Gobernada por una minoría restringida.", contra: "Tecnología, armas, viajeros" },
      { type: "Democracia representativa", desc: "Representantes elegidos toman decisiones.", contra: "Drogas, armas, psiónicos" },
      { type: "Tecnocracia feudal", desc: "Gobernantes elegidos por competencia técnica.", contra: "Tecnología, armas, ordenadores" },
      { type: "Gobierno cautivo", desc: "Liderazgo impuesto por grupo externo.", contra: "Armas, tecnología, viajeros" },
      { type: "Balcanización", desc: "Sin autoridad central. Gobiernos rivales compiten.", contra: "Varía" },
      { type: "Burocracia de servicio civil", desc: "Organismos con personal seleccionado por experiencia.", contra: "Drogas, armas" },
      { type: "Burocracia impersonal", desc: "Agencias aisladas de los ciudadanos.", contra: "Tecnología, armas, drogas, Viajeros, psiónicos" },
      { type: "Dictador carismático", desc: "Líder único con confianza abrumadora.", contra: "Ninguno" },
      { type: "Líder no carismático", desc: "Dictadura militar o reinado hereditario.", contra: "Armas, tecnología, ordenadores" },
      { type: "Oligarquía carismática", desc: "Grupo selecto con confianza popular.", contra: "Armas" },
      { type: "Dictadura religiosa", desc: "Organización religiosa gobierna.", contra: "Varía" },
      { type: "Autocracia religiosa", desc: "Líder religioso con poder absoluto.", contra: "Varía" },
      { type: "Oligarquía totalitaria", desc: "Minoría con control absoluto por coacción.", contra: "Varía" },
    ],
    en: [
      { type: "None", desc: "No structure. Family ties predominate.", contra: "None" },
      { type: "Company/Corporation", desc: "Corporate management elite. Citizens are employees.", contra: "Weapons, drugs, Travellers" },
      { type: "Participatory democracy", desc: "Decisions by direct citizen consent.", contra: "Drugs" },
      { type: "Self-perpetuating oligarchy", desc: "Ruled by a restricted minority.", contra: "Technology, weapons, travellers" },
      { type: "Representative democracy", desc: "Elected representatives make decisions.", contra: "Drugs, weapons, psionics" },
      { type: "Feudal technocracy", desc: "Rulers chosen by technical competence.", contra: "Technology, weapons, computers" },
      { type: "Captive government", desc: "Leadership imposed by external group.", contra: "Weapons, technology, travellers" },
      { type: "Balkanization", desc: "No central authority. Rival governments compete.", contra: "Varies" },
      { type: "Civil service bureaucracy", desc: "Agencies with staff selected by experience.", contra: "Drugs, weapons" },
      { type: "Impersonal bureaucracy", desc: "Agencies isolated from citizens.", contra: "Technology, weapons, drugs, Travellers, psionics" },
      { type: "Charismatic dictator", desc: "Single leader with overwhelming confidence.", contra: "None" },
      { type: "Non-charismatic leader", desc: "Military dictatorship or hereditary rule.", contra: "Weapons, technology, computers" },
      { type: "Charismatic oligarchy", desc: "Select group with popular trust.", contra: "Weapons" },
      { type: "Religious dictatorship", desc: "Religious organization governs.", contra: "Varies" },
      { type: "Religious autocracy", desc: "Religious leader with absolute power.", contra: "Varies" },
      { type: "Totalitarian oligarchy", desc: "Minority with absolute control by coercion.", contra: "Varies" },
    ],
    ca: [
      { type: "Cap", desc: "Sense estructura. Predominen els lligams familiars.", contra: "Cap" },
      { type: "Companyia/Corporació", desc: "Elit gerencial d'empresa. Els ciutadans són empleats.", contra: "Armes, drogues, Viatgers" },
      { type: "Democràcia participativa", desc: "Decisions pel consentiment directe de la ciutadania.", contra: "Drogues" },
      { type: "Oligarquia autoperpetuada", desc: "Governada per una minoria restringida.", contra: "Tecnologia, armes, viatgers" },
      { type: "Democràcia representativa", desc: "Els representants elegits prenen les decisions.", contra: "Drogues, armes, psiònics" },
      { type: "Tecnocràcia feudal", desc: "Governants elegits per competència tècnica.", contra: "Tecnologia, armes, ordinadors" },
      { type: "Govern captiu", desc: "Lideratge imposat per un grup extern.", contra: "Armes, tecnologia, viatgers" },
      { type: "Balcanització", desc: "Sense autoritat central. Governs rivals competeixen.", contra: "Varia" },
      { type: "Burocràcia de servei civil", desc: "Organismes amb personal seleccionat per experiència.", contra: "Drogues, armes" },
      { type: "Burocràcia impersonal", desc: "Agències aïllades dels ciutadans.", contra: "Tecnologia, armes, drogues, Viatgers, psiònics" },
      { type: "Dictador carismàtic", desc: "Un líder únic amb confiança aclaparadora.", contra: "Cap" },
      { type: "Líder no carismàtic", desc: "Dictadura militar o regnat hereditari.", contra: "Armes, tecnologia, ordinadors" },
      { type: "Oligarquia carismàtica", desc: "Grup selecte amb confiança popular.", contra: "Armes" },
      { type: "Dictadura religiosa", desc: "Una organització religiosa governa.", contra: "Varia" },
      { type: "Autocràcia religiosa", desc: "Líder religiós amb poder absolut.", contra: "Varia" },
      { type: "Oligarquia totalitària", desc: "Minoria amb control absolut per coacció.", contra: "Varia" },
    ],
  };
  return data[lang];
}

export function getLAW_WEAPONS(lang: Language): string[] {
  const data: Record<Language, string[]> = {
    es: [
      "Sin restricciones", "Gas venenoso, explosivos, ADM", "Armas energéticas portátiles y láser",
      "Armas militares", "Armas de asalto ligeras y subfusiles", "Armas personales ocultas",
      "Toda arma de fuego excepto escopetas/aturdidores", "Escopetas", "Todas las armas de filo, aturdidores", "Todas las armas",
    ],
    en: [
      "No restrictions", "Poison gas, explosives, WMD", "Portable energy weapons and lasers",
      "Military weapons", "Light assault weapons and SMGs", "Concealed personal weapons",
      "All firearms except shotguns/stunners", "Shotguns", "All bladed weapons, stunners", "All weapons",
    ],
    ca: [
      "Sense restriccions", "Gas verinós, explosius, ADM", "Armes energètiques portàtils i làser",
      "Armes militars", "Armes d'assalt lleugeres i subfusells", "Armes personals amagades",
      "Totes les armes de foc excepte escopetes/atordidors", "Escopetes", "Totes les armes blanques, atordidors", "Totes les armes",
    ],
  };
  return data[lang];
}

export function getLAW_ARMOR(lang: Language): string[] {
  const data: Record<Language, string[]> = {
    es: [
      "Sin restricciones", "Traje de combate", "Armadura de combate", "Chaleco antibalas",
      "Tejido", "Malla", "Jack", "Nada visible", "Toda armadura visible", "Todas las armaduras",
    ],
    en: [
      "No restrictions", "Battle dress", "Combat armor", "Flak jacket",
      "Cloth", "Mesh", "Jack", "Nothing visible", "All visible armor", "All armor",
    ],
    ca: [
      "Sense restriccions", "Vestit de combat", "Armadura de combat", "Armilla antibales",
      "Teixit", "Malla", "Jack", "Res visible", "Tota armadura visible", "Totes les armadures",
    ],
  };
  return data[lang];
}
