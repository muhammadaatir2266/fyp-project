import axios from 'axios'

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

/**
 * Detect a "lat,lng" string (e.g. "32.93,72.86" or "-33.8688,151.2093").
 * Returns the parsed coords or null if the string is a plain place name.
 */
export function parseCoordString(value: string): { lat: number; lng: number } | null {
  const trimmed = value.trim()
  const match = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(trimmed)
  if (!match) return null
  const lat = parseFloat(match[1])
  const lng = parseFloat(match[2])
  if (isNaN(lat) || isNaN(lng)) return null
  return { lat, lng }
}

// Simple in-memory cache keyed by rounded coords (3 decimal places).
const geocodeCache = new Map<string, string>()

/**
 * Reverse-geocode lat/lng to a locality/city name using the Google Geocoding API.
 * Returns null if the API key is missing, the request fails, or no suitable
 * address component is found — callers should fall back to raw coords in that case.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = process.env['GOOGLE_MAPS_API_KEY']?.trim()
  if (!key) return null

  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)!

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`
    const res = await axios.get<{
      status: string
      results: Array<{ address_components: Array<{ long_name: string; types: string[] }> }>
    }>(url, {
      params: { latlng: `${lat},${lng}`, key },
      timeout: 5000,
    })

    if (res.data.status !== 'OK' || !res.data.results.length) return null

    // Preferred component types in priority order
    const preferred = ['locality', 'sublocality', 'administrative_area_level_2', 'administrative_area_level_1']

    for (const type of preferred) {
      for (const result of res.data.results) {
        const comp = result.address_components.find((c) => c.types.includes(type))
        if (comp?.long_name) {
          geocodeCache.set(cacheKey, comp.long_name)
          return comp.long_name
        }
      }
    }

    return null
  } catch {
    return null
  }
}
