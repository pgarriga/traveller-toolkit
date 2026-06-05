import { useState, useMemo, useEffect, useRef, ChangeEvent } from "react";
import type { ZoneCode, StarportClass } from "./types/uwp";
import type { Language } from "./types/i18n";
import type { StarportData, SizeData, AtmosphereData, GovernmentData } from "./types/game-data";
import { useTranslation, getSTARPORT, getSIZE, getATMO, getHYDRO, getPOP, getGOV, getLAW_WEAPONS, getLAW_ARMOR } from "./i18n";

// Hooks
import { useThemeMode } from "./hooks/useThemeMode";
import { useRecentPlanets } from "./hooks/useRecentPlanets";

// Constants
import { ZONES } from "./constants/zones";
import { isCommonWord, OCR_SETTINGS } from "./constants/ocr";

// Utils
import { parseUrl, buildUrl } from "./utils/routing";
import { UWP_PATTERN, parseUwp, formatUwp } from "./utils/uwp";

// Views
import { SettingsView } from "./views/SettingsView";
import { PlanetView } from "./views/PlanetView";
import { RecentView } from "./views/RecentView";
import { DecoderView } from "./views/DecoderView";
import { FreightView } from "./views/FreightView";
import { HomeView } from "./views/HomeView";

// OCR
import { createWorker } from "tesseract.js";

type ViewType = "home" | "decoder" | "saved" | "settings" | "planet" | "freight";

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
  const [view, setView] = useState<ViewType>("decoder");
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      } else if (urlView === "saved") {
        setView("saved");
      } else if (urlView === "settings") {
        setView("settings");
      } else if (urlView === "freight") {
        setView("freight");
      } else if (urlView === "decoder") {
        setName("");
        setUwp("");
        setZoneInput(ZONES.GREEN as ZoneCode);
        setScanStatus("");
        setView("decoder");
      } else {
        setName("");
        setUwp("");
        setZoneInput(ZONES.GREEN as ZoneCode);
        setScanStatus("");
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

  const resetDecoder = () => {
    setName("");
    setUwp("");
    setZoneInput(ZONES.GREEN as ZoneCode);
    setScanStatus("");
    navigateTo("decoder");
  };

  const goHome = () => {
    setName("");
    setUwp("");
    setZoneInput(ZONES.GREEN as ZoneCode);
    setScanStatus("");
    navigateTo("home");
  };

  const loadPlanet = (planet: RecentPlanet) => {
    setName(planet.name);
    setUwp(planet.uwp);
    setZoneInput(planet.zone || (ZONES.GREEN as ZoneCode));
    loadPlanetFromRecent(planet);
    navigateTo("planet", planet.uwp);
  };

  // OCR Scanner function
  const handleScan = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUwp("");
    setName("");
    setScanStatus("");
    setScanning(true);
    setScanStatus(t("loadingOcr"));

    try {
      const worker = await createWorker("eng");
      setScanStatus(t("scanning"));

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const matches = text.match(UWP_PATTERN);

      if (matches && matches.length > 0) {
        const formattedUwp = formatUwp(matches[0]);
        setUwp(formattedUwp);
        setScanStatus(`${t("uwpDetected")}: ${formattedUwp}`);

        // Try to find planet name
        const uwpIndex = text.indexOf(matches[0]);
        const textAfter = text.slice(
          uwpIndex + matches[0].length,
          uwpIndex + matches[0].length + OCR_SETTINGS.NAME_SEARCH_LENGTH
        );

        const lines = text.split(/[\n\r]+/);
        const uwpLineIndex = lines.findIndex(line => line.includes(matches[0]));

        let detectedName: string | null = null;

        if (uwpLineIndex >= 0) {
          const maxLine = Math.min(uwpLineIndex + OCR_SETTINGS.NAME_SEARCH_LINES, lines.length);
          for (let i = uwpLineIndex + 1; i < maxLine; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cleaned = line.replace(/[^a-zA-Z\s'-]/g, "").trim();

            if (cleaned.length < OCR_SETTINGS.NAME_MIN_LENGTH) continue;
            if (cleaned.length > OCR_SETTINGS.NAME_MAX_LENGTH) continue;
            if (isCommonWord(cleaned)) continue;
            if (/^[ABCDEX][0-9A-F]/i.test(cleaned)) continue;

            detectedName = cleaned.split(/\s+/).map(w =>
              w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            ).join(" ");
            break;
          }
        }

        if (!detectedName) {
          const capsPattern = /\b([A-Z][A-Za-z'-]{2,}(?:\s+[A-Z][A-Za-z'-]+)*)\b/g;
          const capsMatches: string[] = textAfter.match(capsPattern) || [];
          const filtered = capsMatches.filter((w: string) =>
            w.length >= OCR_SETTINGS.NAME_MIN_LENGTH &&
            w.length <= OCR_SETTINGS.NAME_MAX_LENGTH &&
            !isCommonWord(w)
          );
          if (filtered.length > 0) {
            detectedName = filtered[0];
          }
        }

        if (detectedName) {
          setName(detectedName);
          setScanStatus(prev => `${prev} | ${t("nameDetected")}: ${detectedName}`);
        }

        navigateTo("planet", formattedUwp);
      } else {
        setScanStatus(t("noUwpFound"));
      }
    } catch (error) {
      console.error("OCR Error:", error);
      setScanStatus(t("scanError"));
    } finally {
      setScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
    resetDecoder,
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

  if (view === "saved") {
    return (
      <RecentView
        {...commonProps}
        recentPlanets={recentPlanets}
        loadPlanet={loadPlanet}
        deletePlanet={deletePlanet}
        clearAllPlanets={clearAllPlanets}
      />
    );
  }

  if (view === "freight") {
    return <FreightView {...commonProps} lang={lang} />;
  }

  if (view === "decoder") {
    return (
      <DecoderView
        {...commonProps}
        uwp={uwp}
        setUwp={setUwp}
        parsed={!!parsed}
        scanning={scanning}
        scanStatus={scanStatus}
        fileInputRef={fileInputRef}
        handleScan={handleScan}
      />
    );
  }

  // Default: Home view (tool list)
  return <HomeView {...commonProps} />;
}
