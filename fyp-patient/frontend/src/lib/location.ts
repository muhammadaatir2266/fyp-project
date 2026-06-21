import api from "@/services/api.service";

export interface GpsCoords {
  mode: "gps";
  lat: number;
  lng: number;
}

export interface CityFallback {
  mode: "city";
  city: string;
}

export type PatientLocation = GpsCoords | CityFallback | null;

const SESSION_KEY = "doclink_patient_location";

/** Cache GPS coords to session storage and optionally persist to profile. */
async function cacheAndSaveGps(lat: number, lng: number): Promise<GpsCoords> {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ mode: "gps", lat, lng }));
  // Best-effort profile save — don't block on it
  api.put("/profile", { latitude: lat, longitude: lng }).catch(() => {});
  return { mode: "gps", lat, lng };
}

/**
 * Determine the patient's location:
 * 1. Check session storage for a cached result.
 * 2. Try navigator.geolocation (GPS).
 * 3. On denial or unavailability, fall back to the profile city.
 * 4. Returns null if neither is available.
 */
export async function getPatientLocation(): Promise<PatientLocation> {
  // Check session cache first
  try {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as PatientLocation;
      if (parsed) return parsed;
    }
  } catch {
    // ignore parse errors
  }

  // Try GPS
  if (typeof navigator !== "undefined" && "geolocation" in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 300_000,
        })
      );
      return cacheAndSaveGps(pos.coords.latitude, pos.coords.longitude);
    } catch {
      // GPS denied or unavailable — fall through to city fallback
    }
  }

  // City fallback from profile
  try {
    const res = await api.get<{ city?: string; latitude?: number; longitude?: number }>("/profile");
    const { city, latitude, longitude } = res.data;

    // If profile already has saved GPS coords, use them
    if (latitude != null && longitude != null) {
      const result: GpsCoords = { mode: "gps", lat: latitude, lng: longitude };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
      return result;
    }

    if (city) {
      const result: CityFallback = { mode: "city", city };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
      return result;
    }
  } catch {
    // profile fetch failed
  }

  return null;
}

/** Clear the cached location (e.g., when the user explicitly disables nearby mode). */
export function clearPatientLocation() {
  sessionStorage.removeItem(SESSION_KEY);
}
