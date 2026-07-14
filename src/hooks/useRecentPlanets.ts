import { useState, useEffect, useCallback } from "react";
import type { RecentPlanet, ZoneCode } from "../types/uwp";
import { ZONES } from "../constants/zones";

const STORAGE_KEY = "traveller-recent";
const MAX_RECENT_PLANETS = 20;

interface UseRecentPlanetsReturn {
  recentPlanets: RecentPlanet[];
  dataLoaded: boolean;
  savePlanet: (uwp: string, name: string, zone?: ZoneCode) => void;
  loadPlanet: (planet: RecentPlanet) => RecentPlanet;
  deletePlanet: (planetUwp: string) => void;
  clearAllPlanets: () => void;
  findPlanet: (uwp: string) => RecentPlanet | undefined;
}

export const useRecentPlanets = (): UseRecentPlanetsReturn => {
  const [recentPlanets, setRecentPlanets] = useState<RecentPlanet[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentPlanets(JSON.parse(stored));
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
  const savePlanet = useCallback((uwp: string, name: string, zone: ZoneCode = ZONES.GREEN as ZoneCode) => {
    const normalizedUwp = uwp.toUpperCase();
    const planetName = name.trim() || normalizedUwp;

    setRecentPlanets(prev => {
      const existing = prev.find(p => p.uwp === normalizedUwp);
      // Skip update if nothing changed
      if (existing && existing.name === planetName && existing.zone === zone) {
        return prev;
      }
      const filtered = prev.filter(p => p.uwp !== normalizedUwp);
      return [
        { name: planetName, uwp: normalizedUwp, zone, timestamp: Date.now() },
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
