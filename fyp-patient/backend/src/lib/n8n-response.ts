// Types for the new n8n array-based disease response format

export interface InternalDoctor {
  source: 'internal_db'
  id: string
  name: string
  specialty: string
  city: string
  rating: number
  experience: number
  consultationFee: number
  workingHours?: { from: string; to: string }
  workingDays?: string[]
}

export interface GoogleDoctor {
  source: 'google_maps'
  name: string
  rating: number
  totalReviews?: number
  address?: string
  location?: { lat: number; lng: number }
  googleMapsUrl?: string
}

export type RecommendedDoctor = InternalDoctor | GoogleDoctor

export interface DoctorRecommendations {
  source: 'internal_db' | 'google_maps'
  doctors: RecommendedDoctor[]
}

export interface ParsedN8nResponse {
  message: string
  predictions: Array<{ disease: string; confidence: number; specialty?: string }>
  symptoms: string[]
  doctorRecommendations: DoctorRecommendations | undefined
  diseaseDetected: boolean
}

// Shape of a single new-format item from n8n
interface RawNewItem {
  predicted_disease?: string
  doctor_recommendations?: unknown
  source?: string
  message?: string
}

// Shape of a raw internal DB doctor from n8n
interface RawInternalDoc {
  id?: string
  name?: string
  specialty?: string
  city?: string
  experience?: number
  rating?: number
  consultationFee?: number
  workingHours?: { from: string; to: string }
  workingDays?: string[]
}

// Shape of a raw Google Maps place from n8n
interface RawGoogleDoc {
  name?: string
  rating?: number
  total_reviews?: number
  address?: string
  location?: { lat: number; lng: number }
  google_maps_url?: string
}

function parseInternalDoctors(raw: unknown[]): InternalDoctor[] {
  return (raw as RawInternalDoc[])
    .filter((d) => d && typeof d === 'object')
    .map((d) => ({
      source: 'internal_db' as const,
      id: d.id ?? '',
      name: d.name ?? 'Unknown',
      specialty: d.specialty ?? '',
      city: d.city ?? '',
      rating: d.rating ?? 0,
      experience: d.experience ?? 0,
      consultationFee: d.consultationFee ?? 0,
      workingHours: d.workingHours,
      workingDays: d.workingDays,
    }))
}

function parseGoogleDoctors(raw: unknown[]): GoogleDoctor[] {
  return (raw as RawGoogleDoc[])
    .filter((d) => d && typeof d === 'object')
    .map((d) => ({
      source: 'google_maps' as const,
      name: d.name ?? 'Unknown',
      rating: d.rating ?? 0,
      totalReviews: d.total_reviews,
      address: d.address,
      location: d.location,
      googleMapsUrl: d.google_maps_url,
    }))
}

function flattenDoctorRecommendations(raw: unknown, source: string): DoctorRecommendations | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined

  // google_maps wraps results in a nested array: [[...doctors]]
  const items: unknown[] = Array.isArray(raw[0]) ? (raw[0] as unknown[]) : raw

  if (source === 'google_maps') {
    const doctors = parseGoogleDoctors(items)
    return doctors.length > 0 ? { source: 'google_maps', doctors } : undefined
  }

  // internal_db
  const doctors = parseInternalDoctors(items)
  return doctors.length > 0 ? { source: 'internal_db', doctors } : undefined
}

/**
 * Normalizes any n8n webhook response into a consistent shape.
 *
 * Handles three shapes n8n can return:
 *   1. New object:  `{ predicted_disease, doctor_recommendations, source }`
 *   2. New array:   `[{ predicted_disease, doctor_recommendations, source }]`
 *   3. Legacy:      `{ message, prediction/predictions, symptoms, status? }`
 */
export function parseN8nChatResponse(data: unknown): ParsedN8nResponse {
  // Helper: parse a single new-format item (object with predicted_disease)
  function parseNewItem(item: RawNewItem): ParsedN8nResponse {
    const disease = item.predicted_disease ?? ''
    const source = item.source ?? 'internal_db'

    const doctorRecommendations = flattenDoctorRecommendations(item.doctor_recommendations, source)

    // Derive specialty from first internal doctor when available
    const specialty =
      doctorRecommendations?.source === 'internal_db'
        ? (doctorRecommendations.doctors[0] as InternalDoctor | undefined)?.specialty
        : undefined

    const predictions = disease
      ? [{ disease, confidence: 1, specialty }]
      : []

    const message =
      (item.message as string | undefined)?.trim() ||
      (disease
        ? `Based on your symptoms, a possible condition is ${disease}.`
        : 'I received your message. How can I help you?')

    return {
      message,
      predictions,
      symptoms: [],
      doctorRecommendations,
      diseaseDetected: predictions.length > 0,
    }
  }

  // ── New object format: { predicted_disease, doctor_recommendations, source } ──
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const d = data as Record<string, unknown>
    if ('predicted_disease' in d) {
      return parseNewItem(d as RawNewItem)
    }
  }

  // ── New array format: [{ predicted_disease, doctor_recommendations, source }] ──
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown>
    if (first && typeof first === 'object' && 'predicted_disease' in first) {
      return parseNewItem(first as RawNewItem)
    }
  }

  // ── Legacy object format: { message, prediction/predictions, symptoms } ──────
  const d = data as Record<string, unknown> | null | undefined

  let message = ''
  if (typeof data === 'string') {
    message = data
  } else if (d?.data) {
    const inner = d.data as Record<string, unknown>
    message = typeof inner === 'string' ? inner : (inner.message as string) || (inner.response as string) || ''
  } else {
    message =
      (d?.message as string) ||
      (d?.response as string) ||
      (d?.output as string) ||
      (d?.text as string) ||
      'I received your message. How can I help you?'
  }

  const rawPredictions: Array<{ disease: string; confidence: number; specialty?: string }> =
    ((d?.prediction || d?.predictions) as Array<{ disease: string; confidence: number; specialty?: string }>) ?? []

  const predictions = rawPredictions.map((p) =>
    typeof p === 'string'
      ? { disease: p as string, confidence: 1.0, specialty: undefined }
      : { disease: p.disease, confidence: p.confidence ?? 1.0, specialty: p.specialty }
  )

  const symptoms: string[] = (d?.symptoms as string[]) ?? []

  return {
    message,
    predictions,
    symptoms,
    doctorRecommendations: undefined,
    diseaseDetected: predictions.length > 0,
  }
}
