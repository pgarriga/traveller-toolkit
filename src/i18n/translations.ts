import type { Language } from "../types/i18n";

// Detect language based on browser settings
// Spanish for es, ca, gl, eu (languages of Spain)
// English for everything else
export function detectLanguage(): Language {
  const lang = navigator.language?.toLowerCase() || "en";
  const prefix = lang.split("-")[0];
  return ["es", "ca", "gl", "eu"].includes(prefix) ? "es" : "en";
}

export const translations: Record<Language, Record<string, string>> = {
  es: {

    // Form labels
    worldName: "Nombre del mundo",
    zone: "Zona",
    zoneGreen: "Verde",
    zoneAmber: "Ámbar",
    zoneRed: "Rojo",
    uwpCode: "Código UWP (ej: A788899-C)",
    uwpPlaceholder: "A788899-C",

    // Buttons
    viewRecent: "Planetas recientes",
    decode: "Decodificar",
    decodeUWP: "Decodificador de UWP",
    newScan: "Nuevo escaneo",

    // Recent planets
    recentPlanets: "Planetas recientes",
    noRecentPlanets: "No hay planetas recientes",
    delete: "Eliminar",
    clearAll: "Borrar todo",

    // Planet display
    unnamed: "Sin nombre",
    zoneLabel: "Zona",

    // Invalid UWP
    invalidUwp: "Introduce un código UWP válido (formato: Xnnnnnn-n)",

    // Section titles
    starport: "Astropuerto",
    class: "Clase",
    size: "Tamaño",
    atmosphere: "Atmósfera",
    hydrographics: "Hidrografía",
    population: "Población",
    government: "Gobierno",
    lawLevel: "Nivel de Ley",
    techLevel: "Nivel Tecnológico",
    travelZone: "Zona de Viaje",

    // Starport labels
    quality: "Calidad",
    fuel: "Combustible",
    berth: "Atraque",
    services: "Servicios",
    possibleBases: "Bases posibles",

    // Size labels
    diameter: "Diámetro",
    gravity: "Gravedad",
    example: "Ejemplo",
    description: "Descripción",
    lowGravity: "Baja gravedad (≤0,7g)",
    highGravity: "Alta gravedad (≥1,4g)",
    gravityWarning: "Gravedad",

    // Atmosphere labels
    composition: "Composición",
    pressure: "Presión (atm)",
    equipRequired: "Equipo requerido",
    danger: "Peligro",
    dangerousAtmo: "¡Atmósfera peligrosa!",
    unknown: "Desconocida",

    // Hydrographics labels
    liquidCoverage: "Cobertura líquida",
    liquidNote: "El líquido puede no ser agua (atmósfera exótica/corrosiva)",

    // Population labels
    inhabitants: "Habitantes",
    level: "Nivel",
    uninhabitedNote: "Deshabitado: Gobierno, Ley y NT = 0",
    smallColonyNote: "Colonia muy pequeña. Puede diferir mucho de lo estándar.",

    // Government labels
    type: "Tipo",
    commonContraband: "Contrabando común",

    // Law labels
    bannedWeapons: "Armas prohibidas",
    bannedArmor: "Armadura prohibida",
    noRestrictions: "Sin restricciones. Se recomienda ir armado.",
    martialLaw: "Ley marcial",
    allWeaponsArmorBanned: "Todas las armas y armaduras prohibidas",
    note: "Nota",

    // Tech level
    tl: "NT",
    equivalent: "Equivalente",
    primitive: "Primitivo",
    preindustrial: "Era preindustrial",
    industrial: "Era industrial",
    preatomic: "Era preatómica / atómica",
    earlySpace: "Era espacial temprana",
    earlyStellar: "Era estelar temprana",
    midStellar: "Era estelar media",
    advancedStellar: "Era estelar avanzada",
    communications: "Comunicaciones",
    noTelecom: "Sin telecomunicaciones (solo astropuerto)",
    radioPhone: "Radio/teléfono entre ciudades, sin satélites",
    fullNetwork: "Red completa, accesible desde cualquier punto",

    // Travel zone
    amberCaution: "Ámbar — Precaución",
    redProhibited: "Rojo — Prohibido",
    code: "Código",
    meaning: "Significado",
    amberMeaning: "Peligro potencial: xenofobia, inestabilidad política u otros peligros.",
    redMeaning: "Interdicción: cuarentena, guerra activa o protección imperial. Viaje prohibido.",

    // Footer
    worldLine: "Línea completa del mundo",
    disclaimer: "Herramienta no oficial diseñada para agilizar el juego.",
    manualNote: "Para información detallada, consulta el manual oficial.",

    // None/varies
    none: "Ninguno",
    varies: "Varía",
    na: "N/A",
    free: "Gratis",

    // Scanner
    home: "Inicio",
    scan: "Escanear",
    scanning: "Escaneando...",
    scanError: "Error al procesar la imagen",
    or: "o",
    enterManually: "Introducir código manualmente",
    noUwpFound: "No se encontró código UWP en la imagen",
    uwpDetected: "UWP detectado",
    nameDetected: "Nombre detectado",
    loadingOcr: "Cargando OCR...",

    // Saved planets page
    back: "Volver",
    viewInfo: "Ver información",
    confirmDelete: "¿Eliminar este planeta?",
    planetCount: "planetas",
    edit: "Editar",
    newPlanet: "Nuevo planeta",

    // Settings
    settings: "Ajustes",
    theme: "Tema",
    themeAuto: "Auto",
    themeDark: "Oscuro",
    themeLight: "Claro",
    themeDescription: "El modo automático sigue la configuración de tu sistema",
    language: "Idioma",
    langAuto: "Auto",
    langEs: "Español",
    langEn: "English",
    langDescription: "El modo automático detecta el idioma de tu navegador",

    // Freight calculator
    freightTitle: "Calculadora de Flete",
    freightOriginSection: "Mundo de origen",
    freightDestinationSection: "Mundo de destino",
    freightRouteSection: "Ruta",
    freightSkillsSection: "Habilidades",
    freightLotsCountSection: "Cantidad de lotes",
    freightLotsCountIntro: "Tira 2D para cada tipo de lote. Se aplicarán automáticamente los modificadores acumulados (DM base) de los pasos anteriores para determinar cuántos D6 — es decir, cuántos lotes — hay disponibles.",
    freightPopulation: "Población",
    freightStarport: "Astropuerto",
    freightTL: "Nivel Tecnológico",
    freightZone: "Zona",
    freightParsecs: "Parsecs al destino",
    freightCargoBay: "Toneladas libres en bodega",
    freightSkillEffect: "Efecto Broker / Streetwise",
    freightSkillNote: "Efecto de la tirada Average 8+ (puede ser negativo)",
    freightPopLow: "0–1",
    freightPopMid: "2–5",
    freightPopHigh: "6–7",
    freightPopVeryHigh: "8+",
    freightTLLow: "≤6",
    freightTLMid: "7–8",
    freightTLHigh: "≥9",
    freightRollMajor: "Lote Mayor",
    freightRollMinor: "Lote Menor",
    freightRollIncidental: "Lote Incidental",
    freightRollPlaceholder: "2–12",
    freightPerLot: "Toneladas por lote",
    freightRateSection: "Precio por tonelada",
    freightRateNote: "Determinado por la distancia en parsecs al destino",
    freightRollHelp: "Vacío = mostrar solo los DM finales para tirar en mesa",
    freightCalculate: "Calcular lotes",
    freightOnTime: "Entrega a tiempo",
    freightLateNote: "Pago reducido 1D+4 × 10% (referencia −50%)",
    freightDMsSection: "Modificadores (DM)",
    freightLotsSection: "Lotes disponibles",
    freightSummarySection: "Resumen",
    freightOriginPop: "Origen · Población",
    freightOriginStarport: "Origen · Astropuerto",
    freightOriginTL: "Origen · Nivel Tecnológico",
    freightOriginZone: "Origen · Zona",
    freightDestPop: "Destino · Población",
    freightDestStarport: "Destino · Astropuerto",
    freightDestTL: "Destino · Nivel Tecnológico",
    freightDestZone: "Destino · Zona",
    freightParsecPenalty: "Parsecs adicionales",
    freightBaseDM: "DM base",
    freightNoFactors: "Sin modificadores aplicables",
    freightLotMajor: "Mayor",
    freightLotMinor: "Menor",
    freightLotIncidental: "Incidental",
    freightLotMajorDesc: "1D × 10 t",
    freightLotMinorDesc: "1D × 5 t",
    freightLotIncidentalDesc: "1D t",
    freightColFinalDM: "DM final",
    freightColLots: "Nº lotes",
    freightColTons: "Toneladas est.",
    freightSelectedTons: "Toneladas seleccionadas",
    freightSelectedCount: "lotes seleccionados",
    freightSelectionHint: "Toca los lotes para añadirlos al pedido",
    freightFitTons: "Caben en bodega",
    freightExcessTons: "Exceso",
    freightGrossIncome: "Ingreso bruto",
    freightNetIncome: "Ingreso neto (con retraso)",
    freightExcessWarning: "El flete supera la capacidad de la bodega",
    freightRollsMissing: "Introduce las tiradas para ver lotes y toneladas",
    freightTrafficNote: "Tirada de tráfico: 2D + DM final",
    freightDash: "—",

    // Home (tools list)
    homeTitle: "Herramientas",
    homeDecoderDesc: "Decodifica códigos UWP (Universal World Profile) del Traveller 2e con OCR o entrada manual",
    homeFreightDesc: "Calcula DMs, lotes e ingresos por flete entre dos mundos",
    homeRecentDesc: "Consulta los planetas que has guardado anteriormente",
  },

  en: {

    // Form labels
    worldName: "World name",
    zone: "Zone",
    zoneGreen: "Green",
    zoneAmber: "Amber",
    zoneRed: "Red",
    uwpCode: "UWP Code (e.g.: A788899-C)",
    uwpPlaceholder: "A788899-C",

    // Buttons
    viewRecent: "Recent planets",
    decode: "Decode",
    decodeUWP: "UWP Decoder",
    newScan: "New scan",

    // Recent planets
    recentPlanets: "Recent planets",
    noRecentPlanets: "No recent planets",
    delete: "Delete",
    clearAll: "Clear all",

    // Planet display
    unnamed: "Unnamed",
    zoneLabel: "Zone",

    // Invalid UWP
    invalidUwp: "Enter a valid UWP code (format: Xnnnnnn-n)",

    // Section titles
    starport: "Starport",
    class: "Class",
    size: "Size",
    atmosphere: "Atmosphere",
    hydrographics: "Hydrographics",
    population: "Population",
    government: "Government",
    lawLevel: "Law Level",
    techLevel: "Tech Level",
    travelZone: "Travel Zone",

    // Starport labels
    quality: "Quality",
    fuel: "Fuel",
    berth: "Berthing",
    services: "Services",
    possibleBases: "Possible Bases",

    // Size labels
    diameter: "Diameter",
    gravity: "Gravity",
    example: "Example",
    description: "Description",
    lowGravity: "Low gravity (≤0.7g)",
    highGravity: "High gravity (≥1.4g)",
    gravityWarning: "Gravity",

    // Atmosphere labels
    composition: "Composition",
    pressure: "Pressure (atm)",
    equipRequired: "Equipment required",
    danger: "Danger",
    dangerousAtmo: "Dangerous atmosphere!",
    unknown: "Unknown",

    // Hydrographics labels
    liquidCoverage: "Liquid coverage",
    liquidNote: "Liquid may not be water (exotic/corrosive atmosphere)",

    // Population labels
    inhabitants: "Inhabitants",
    level: "Level",
    uninhabitedNote: "Uninhabited: Government, Law and TL = 0",
    smallColonyNote: "Very small colony. May differ greatly from standard.",

    // Government labels
    type: "Type",
    commonContraband: "Common contraband",

    // Law labels
    bannedWeapons: "Banned weapons",
    bannedArmor: "Banned armor",
    noRestrictions: "No restrictions. Being armed is recommended.",
    martialLaw: "Martial law",
    allWeaponsArmorBanned: "All weapons and armor banned",
    note: "Note",

    // Tech level
    tl: "TL",
    equivalent: "Equivalent",
    primitive: "Primitive",
    preindustrial: "Pre-industrial era",
    industrial: "Industrial era",
    preatomic: "Pre-atomic / atomic era",
    earlySpace: "Early space era",
    earlyStellar: "Early stellar era",
    midStellar: "Mid stellar era",
    advancedStellar: "Advanced stellar era",
    communications: "Communications",
    noTelecom: "No telecommunications (starport only)",
    radioPhone: "Radio/phone between cities, no satellites",
    fullNetwork: "Full network, accessible from anywhere",

    // Travel zone
    amberCaution: "Amber — Caution",
    redProhibited: "Red — Prohibited",
    code: "Code",
    meaning: "Meaning",
    amberMeaning: "Potential danger: xenophobia, political instability or other hazards.",
    redMeaning: "Interdiction: quarantine, active war or imperial protection. Travel prohibited.",

    // Footer
    worldLine: "Complete world line",
    disclaimer: "Unofficial tool designed to speed up gameplay.",
    manualNote: "For detailed information, check the official manual.",

    // None/varies
    none: "None",
    varies: "Varies",
    na: "N/A",
    free: "Free",

    // Scanner
    home: "Home",
    scan: "Scan",
    scanning: "Scanning...",
    scanError: "Error processing image",
    or: "or",
    enterManually: "Enter code manually",
    noUwpFound: "No UWP code found in image",
    uwpDetected: "UWP detected",
    nameDetected: "Name detected",
    loadingOcr: "Loading OCR...",

    // Saved planets page
    back: "Back",
    viewInfo: "View info",
    confirmDelete: "Delete this planet?",
    planetCount: "planets",
    edit: "Edit",
    newPlanet: "New planet",

    // Settings
    settings: "Settings",
    theme: "Theme",
    themeAuto: "Auto",
    themeDark: "Dark",
    themeLight: "Light",
    themeDescription: "Auto mode follows your system settings",
    language: "Language",
    langAuto: "Auto",
    langEs: "Español",
    langEn: "English",
    langDescription: "Auto mode detects your browser language",

    // Freight calculator
    freightTitle: "Freight Calculator",
    freightOriginSection: "Origin world",
    freightDestinationSection: "Destination world",
    freightRouteSection: "Route",
    freightSkillsSection: "Skills",
    freightLotsCountSection: "Number of lots",
    freightLotsCountIntro: "Roll 2D for each lot type. The accumulated modifiers (base DM) from the previous steps will be applied automatically to determine how many D6 — i.e. how many lots — are available.",
    freightPopulation: "Population",
    freightStarport: "Starport",
    freightTL: "Tech Level",
    freightZone: "Zone",
    freightParsecs: "Parsecs to destination",
    freightCargoBay: "Free tons in cargo bay",
    freightSkillEffect: "Broker / Streetwise effect",
    freightSkillNote: "Average 8+ check effect (may be negative)",
    freightPopLow: "0–1",
    freightPopMid: "2–5",
    freightPopHigh: "6–7",
    freightPopVeryHigh: "8+",
    freightTLLow: "≤6",
    freightTLMid: "7–8",
    freightTLHigh: "≥9",
    freightRollMajor: "Major lot",
    freightRollMinor: "Minor lot",
    freightRollIncidental: "Incidental lot",
    freightRollPlaceholder: "2–12",
    freightPerLot: "Tons per lot",
    freightRateSection: "Price per ton",
    freightRateNote: "Determined by the parsec distance to destination",
    freightRollHelp: "Leave empty to show only the final DMs for tabletop rolling",
    freightCalculate: "Calculate lots",
    freightOnTime: "On-time delivery",
    freightLateNote: "Payment reduced by 1D+4 × 10% (reference −50%)",
    freightDMsSection: "Modifiers (DM)",
    freightLotsSection: "Available lots",
    freightSummarySection: "Summary",
    freightOriginPop: "Origin · Population",
    freightOriginStarport: "Origin · Starport",
    freightOriginTL: "Origin · Tech Level",
    freightOriginZone: "Origin · Zone",
    freightDestPop: "Destination · Population",
    freightDestStarport: "Destination · Starport",
    freightDestTL: "Destination · Tech Level",
    freightDestZone: "Destination · Zone",
    freightParsecPenalty: "Additional parsecs",
    freightBaseDM: "Base DM",
    freightNoFactors: "No applicable modifiers",
    freightLotMajor: "Major",
    freightLotMinor: "Minor",
    freightLotIncidental: "Incidental",
    freightLotMajorDesc: "1D × 10 t",
    freightLotMinorDesc: "1D × 5 t",
    freightLotIncidentalDesc: "1D t",
    freightColFinalDM: "Final DM",
    freightColLots: "# lots",
    freightColTons: "Est. tons",
    freightSelectedTons: "Selected tons",
    freightSelectedCount: "lots selected",
    freightSelectionHint: "Tap lots to add them to your order",
    freightFitTons: "Fits in cargo bay",
    freightExcessTons: "Excess",
    freightGrossIncome: "Gross income",
    freightNetIncome: "Net income (late delivery)",
    freightExcessWarning: "Freight exceeds cargo bay capacity",
    freightRollsMissing: "Enter rolls to see lots and tonnage",
    freightTrafficNote: "Traffic roll: 2D + final DM",
    freightDash: "—",

    // Home (tools list)
    homeTitle: "Tools",
    homeDecoderDesc: "Decode Traveller 2e UWP (Universal World Profile) codes via OCR or manual entry",
    homeFreightDesc: "Compute DMs, lots, and freight income between two worlds",
    homeRecentDesc: "Browse the planets you've previously saved",
  },
};
