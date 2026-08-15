import { useState, useEffect, useCallback } from "react";
import type { RecentPlanet, TravellerMapWorld, ZoneCode } from "../types/uwp";
import { ZONES } from "../constants/zones";
import { STORAGE_KEYS } from "../constants/storage";

const STORAGE_KEY = STORAGE_KEYS.recentPlanets;
const MAX_RECENT_PLANETS = 20;

const ZONE_CODES: readonly string[] = [ZONES.GREEN, ZONES.AMBER, ZONES.RED];

/**
 * Whether one stored entry is still shaped like a `RecentPlanet`.
 *
 * `JSON.parse` succeeding says nothing about the shape, and this key survives
 * app upgrades and anything the user pastes into devtools. Without the check a
 * single malformed entry reaches `p.uwp.toUpperCase()` and takes the app down
 * on load, with the bad value still in storage to do it again on every reload.
 *
 * `world` is optional and only read for the jump map, so it is not validated
 * past being an object — a bad one costs a missing map, not a crash.
 */
const isRecentPlanet = (raw: unknown): raw is RecentPlanet => {
  if (typeof raw !== "object" || raw === null) return false;
  const p = raw as Record<string, unknown>;
  return (
    typeof p.uwp === "string" &&
    typeof p.name === "string" &&
    typeof p.zone === "string" &&
    ZONE_CODES.includes(p.zone) &&
    typeof p.timestamp === "number" &&
    Number.isFinite(p.timestamp)
  );
};

interface UseRecentPlanetsReturn {
  recentPlanets: RecentPlanet[];
  dataLoaded: boolean;
  savePlanet: (uwp: string, name: string, zone?: ZoneCode, world?: TravellerMapWorld) => void;
  loadPlanet: (planet: RecentPlanet) => RecentPlanet;
  deletePlanet: (planetUwp: string) => void;
  clearAllPlanets: () => void;
  findPlanet: (uwp: string) => RecentPlanet | undefined;
}

export const useRecentPlanets = (): UseRecentPlanetsReturn => {
  const [recentPlanets, setRecentPlanets] = useState<RecentPlanet[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load from localStorage on mount. Bad entries are dropped rather than the
  // whole history: one unreadable world should not cost the player the rest.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        setRecentPlanets(Array.isArray(parsed) ? parsed.filter(isRecentPlanet) : []);
      }
    } catch (e) {
      console.error("Failed to load recent planets:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
    setDataLoaded(true);
  }, []);

  // Sync to localStorage when data changes
  useEffect(() => {
    if (dataLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentPlanets));
      } catch (e) {
        console.error("Failed to save recent planets:", e);
      }
    }
  }, [recentPlanets, dataLoaded]);

  // Save or update a planet
  const savePlanet = useCallback((uwp: string, name: string, zone: ZoneCode = ZONES.GREEN as ZoneCode, world?: TravellerMapWorld) => {
    const normalizedUwp = uwp.toUpperCase();
    const planetName = name.trim() || normalizedUwp;

    setRecentPlanets(prev => {
      const existing = prev.find(p => p.uwp === normalizedUwp);
      // Skip update if nothing changed (no world provided, and name/zone match)
      if (!world && existing && existing.name === planetName && existing.zone === zone) {
        return prev;
      }
      const filtered = prev.filter(p => p.uwp !== normalizedUwp);
      return [
        { name: planetName, uwp: normalizedUwp, zone, timestamp: Date.now(), world: world ?? existing?.world },
        ...filtered
      ].slice(0, MAX_RECENT_PLANETS);
    });
  }, []);

  // Load a planet (moves to top of list)
  const loadPlanet = useCallback((planet: RecentPlanet): RecentPlanet => {
    const updatedPlanet = { ...planet, timestamp: Date.now() };
    setRecentPlanets(prev => {
      const filtered = prev.filter(p => p.uwp !== planet.uwp);
      return [updatedPlanet, ...filtered];
    });
    return planet;
  }, []);

  // Delete a planet
  const deletePlanet = useCallback((planetUwp: string) => {
    setRecentPlanets(prev => prev.filter(p => p.uwp !== planetUwp));
  }, []);

  // Clear all planets
  const clearAllPlanets = useCallback(() => {
    setRecentPlanets([]);
  }, []);

  // Find a planet by UWP
  const findPlanet = useCallback((uwp: string): RecentPlanet | undefined => {
    return recentPlanets.find(p => p.uwp.toUpperCase() === uwp.toUpperCase());
  }, [recentPlanets]);

  return {
    recentPlanets,
    dataLoaded,
    savePlanet,
    loadPlanet,
    deletePlanet,
    clearAllPlanets,
    findPlanet,
  };
};
