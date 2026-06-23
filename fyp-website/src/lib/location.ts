const GUEST_LOCATION_KEY = "doclink_guest_location";

/**
 * Resolve the guest's location as a "lat,lng" string.
 * - Checks sessionStorage cache first to avoid re-prompting.
 * - Falls back to the browser Geolocation API (best-effort; silently fails if denied).
 * - Guests have no profile, so a city name fallback is not available.
 */
export async function getGuestLocation(): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;

  // Check session cache first
  try {
    const cached = sessionStorage.getItem(GUEST_LOCATION_KEY);
    if (cached) return cached;
  } catch {
    // ignore
  }

  if (!("geolocation" in navigator)) return undefined;

  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 300_000,
      })
    );
    const value = `${pos.coords.latitude},${pos.coords.longitude}`;
    try {
      sessionStorage.setItem(GUEST_LOCATION_KEY, value);
    } catch {
      // ignore storage errors
    }
    return value;
  } catch {
    return undefined;
  }
}
