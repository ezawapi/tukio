import { useCallback, useEffect, useState } from "react";

export type LocationSource = "gps" | "manual" | null;

export interface UserLocation {
  lat: number;
  lng: number;
  label?: string;
}

const STORAGE_KEY = "tukio_manual_location";

const readManual = (): UserLocation | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === "number" && typeof parsed?.lng === "number") return parsed;
  } catch {
    /* ignore */
  }
  return null;
};

/**
 * Resolves the user's effective location for proximity features.
 * Order of precedence:
 *  1. Manual city/zone chosen by the user (persisted in localStorage)
 *  2. Browser geolocation (GPS / network)
 *  3. null (no location available)
 */
export const useUserLocation = () => {
  const [manual, setManualState] = useState<UserLocation | null>(() => readManual());
  const [gps, setGps] = useState<UserLocation | null>(null);
  const [gpsDenied, setGpsDenied] = useState(false);

  useEffect(() => {
    if (manual) return; // manual choice wins, no need to query GPS
    if (!("geolocation" in navigator)) {
      setGpsDenied(true);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (pos.coords.accuracy < 200) navigator.geolocation.clearWatch(watchId);
      },
      () => setGpsDenied(true),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [manual]);

  const setManual = useCallback((loc: UserLocation | null) => {
    if (loc) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      setManualState(loc);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setManualState(null);
    }
  }, []);

  const location: UserLocation | null = manual || gps;
  const source: LocationSource = manual ? "manual" : gps ? "gps" : null;

  return { location, source, gpsDenied, setManual };
};

/** Haversine distance in kilometers */
export const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Format distance for UI badges (e.g. "350 m", "4,2 km", "127 km") */
export const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
};
