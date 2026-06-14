// City-centroid coordinates for common Pakistani cities.
// Used as fallback when Nominatim is unavailable or for seeding.
const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  karachi:     { lat: 24.8607,  lng: 67.0011 },
  lahore:      { lat: 31.5204,  lng: 74.3587 },
  islamabad:   { lat: 33.6844,  lng: 73.0479 },
  rawalpindi:  { lat: 33.5651,  lng: 73.0169 },
  faisalabad:  { lat: 31.4504,  lng: 73.1350 },
  peshawar:    { lat: 34.0151,  lng: 71.5249 },
  quetta:      { lat: 30.1798,  lng: 66.9750 },
  multan:      { lat: 30.1575,  lng: 71.5249 },
  hyderabad:   { lat: 25.3960,  lng: 68.3578 },
  gujranwala:  { lat: 32.1877,  lng: 74.1945 },
}

export function cityCentroid(city: string): { lat: number; lng: number } | null {
  return CITY_CENTROIDS[city.trim().toLowerCase()] ?? null
}

/** Haversine distance in km between two points. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Resolve lat/lng from explicit coords or fall back to city centroid.
 * Returns null when neither is available.
 */
export function resolveCoords(
  lat?: number | null,
  lng?: number | null,
  city?: string | null,
): { lat: number; lng: number } | null {
  if (lat != null && lng != null) return { lat, lng }
  if (city) return cityCentroid(city)
  return null
}
