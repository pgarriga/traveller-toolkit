import { useState, useMemo, useEffect, useRef } from "react";
import type { TravellerMapWorld, ZoneCode, StarportClass } from "./types/uwp";
import type { Language } from "./types/i18n";
import type { StarportData, SizeData, AtmosphereData, GovernmentData } from "./types/game-data";
import { useTranslation, getSTARPORT, getSIZE, getATMO, getHYDRO, getPOP, getGOV, getLAW_WEAPONS, getLAW_ARMOR } from "./i18n";

// Hooks
import { useThemeMode } from "./hooks/useThemeMode";
import { useRecentPlanets } from "./hooks/useRecentPlanets";

// Constants
import { ZONES } from "./constants/zones";

// Utils
import { parseUrl, buildUrl } from "./utils/routing";
import { parseUwp } from "./utils/uwp";

// Views
import { SettingsView } from "./views/SettingsView";
import { PlanetView } from "./views/PlanetView";
import { FreightView } from "./views/FreightView";
import { PassengerView } from "./views/PassengerView";
import { SearchView } from "./views/SearchView";
import { HomeView } from "./views/HomeView";

type ViewType = "home" | "settings" | "planet" | "freight" | "passenger" | "search";

interface RecentPlanet {
  uwp: string;
  name: string;
  zone: ZoneCode;
  timestamp: number;
}

export default function App() {
  const { t, lang, langMode, setLangMode } = useTranslation();
  const { themeMode, setThemeMode, theme } = useThemeMode();
  const {
    recentPlanets,
    dataLoaded,
    savePlanet,
    loadPlanet: loadPlanetFromRecent,
    deletePlanet,
    clearAllPlanets,
    findPlanet
  } = useRecentPlanets();

  const [uwp, setUwp] = useState("");
  const [name, setName] = useState("");
  const [zoneInput, setZoneInput] = useState<ZoneCode>(ZONES.GREEN as ZoneCode);
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<ViewType>("home");
  const isInitialLoad = useRef(true);

  // Get translated game data
  const STARPORT: Record<StarportClass, StarportData> = useMemo(
    () => getSTARPORT(t)[lang],
    [lang, t]
  );
  const SIZE: SizeData[] = useMemo(() => getSIZE(lang), [lang]);
  const ATMO: AtmosphereData[] = useMemo(() => getATMO(lang), [lang]);
  const HYDRO: string[] = useMemo(() => getHYDRO(lang), [lang]);
  const POP: string[] = useMemo(() => getPOP(lang), [lang]);
  const GOV: GovernmentData[] = useMemo(() => getGOV(lang), [lang]);
  const LAW_WEAPONS: string[] = useMemo(() => getLAW_WEAPONS(lang), [lang]);
  const LAW_ARMOR: string[] = useMemo(() => getLAW_ARMOR(lang), [lang]);

  // Parse URL on initial load
  useEffect(() => {
    if (!dataLoaded) return;

    const { view: urlView, uwp: urlUwp } = parseUrl();

    if (urlView === "planet" && urlUwp) {
      const planet = findPlanet(urlUwp);
      if (planet) {
        setName(planet.name);
        setUwp(planet.uwp);
        setZoneInput(planet.zone || (ZONES.GREEN as ZoneCode));
        setView("planet");
      } else {
        setUwp(urlUwp);
        setName("");
        setZoneInput(ZONES.GREEN as ZoneCode);
        setView("planet");
      }
    } else {
      setView(urlView as ViewType);
    }
    isInitialLoad.current = false;
  }, [dataLoaded, findPlanet]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const { view: urlView, uwp: urlUwp } = parseUrl();

      if (urlView === "planet" && urlUwp) {
        const planet = findPlanet(urlUwp);
        if (planet) {
          setName(planet.name);
          setUwp(planet.uwp);
          setZoneInput(planet.zone || (ZONES.GREEN as ZoneCode));
        } else {
          setUwp(urlUwp);
          setName("");
          setZoneInput(ZONES.GREEN as ZoneCode);
        }
        setView("planet");
      } else if (urlView === "settings") {
        setView("settings");
      } else if (urlView === "freight") {
        setView("freight");
      } else if (urlView === "passenger") {
        setView("passenger");
      } else if (urlView === "search") {
        setView("search");
      } else {
        setName("");
        setUwp("");
        setZoneInput(ZONES.GREEN as ZoneCode);
        setView("home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [findPlanet]);

  // Navigation functions
  const navigateTo = (newView: ViewType, newUwp: string | null = null) => {
    const url = buildUrl(newView, newUwp);
    window.history.pushState({ view: newView, uwp: newUwp }, "", url);
    setView(newView);
    setMenuOpen(false);
  };

  const goHome = () => {
    setName("");
    setUwp("");
    setZoneInput(ZONES.GREEN as ZoneCode);
    navigateTo("home");
  };

  const loadPlanet = (planet: RecentPlanet) => {
    setName(planet.name);
    setUwp(planet.uwp);
    setZoneInput(planet.zone || (ZONES.GREEN as ZoneCode));
    loadPlanetFromRecent(planet);
    navigateTo("planet", planet.uwp);
  };

  const loadWorldFromSearch = (worldUwp: string, worldName: string, world: TravellerMapWorld) => {
    const existing = findPlanet(worldUwp);
    const zone = existing?.zone || (ZONES.GREEN as ZoneCode);
    const resolvedName = existing?.name || worldName;
    setName(resolvedName);
    setUwp(worldUwp);
    setZoneInput(zone);
    savePlanet(worldUwp, resolvedName, zone, world);
    navigateTo("planet", worldUwp);
  };

  // Parse UWP
  const parsed = useMemo(() => parseUwp(uwp, STARPORT), [uwp, STARPORT]);

  // Auto-save to recent when on planet view
  useEffect(() => {
    if (view === "planet" && parsed && uwp.trim()) {
      savePlanet(uwp, name, zoneInput);
    }
  }, [view, uwp, parsed, name, zoneInput, savePlanet]);

  // Redirect to home if planet view has no valid UWP
  useEffect(() => {
    if (view === "planet" && !parsed && !isInitialLoad.current) {
      navigateTo("home");
    }
  }, [view, parsed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Common props for all views
  const commonProps = {
    theme,
    view,
    goHome,
    navigateTo,
    menuOpen,
    setMenuOpen,
    t
  };

  // Render views
  if (view === "settings") {
    return (
      <SettingsView
        {...commonProps}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        langMode={langMode}
        setLangMode={setLangMode}
      />
    );
  }

  if (view === "planet") {
    return (
      <PlanetView
        {...commonProps}
        parsed={parsed}
        uwp={uwp}
        name={name}
        setName={setName}
        zoneInput={zoneInput}
        setZoneInput={setZoneInput}
        world={findPlanet(uwp)?.world}
        lang={lang}
        STARPORT={STARPORT}
        SIZE={SIZE}
        ATMO={ATMO}
        HYDRO={HYDRO}
        POP={POP}
        GOV={GOV}
        LAW_WEAPONS={LAW_WEAPONS}
        LAW_ARMOR={LAW_ARMOR}
      />
    );
  }

  if (view === "freight") {
    return <FreightView {...commonProps} lang={lang} />;
  }

  if (view === "passenger") {
    return <PassengerView {...commonProps} lang={lang} />;
  }

  if (view === "search") {
    return (
      <SearchView
        {...commonProps}
        onSelectWorld={loadWorldFromSearch}
        recentPlanets={recentPlanets}
        loadPlanet={loadPlanet}
        deletePlanet={deletePlanet}
        clearAllPlanets={clearAllPlanets}
      />
    );
  }

  // Default: Home view (tool list)
  return <HomeView {...commonProps} />;
}
