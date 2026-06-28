/**
 * Typed HTTP client for the fyp-admin backend (/api/v1 routes).
 * All business logic lives in the admin backend — this is a thin fetch wrapper.
 */

const ADMIN_API_URL = (process.env.ADMIN_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '')
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN ?? ''

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${ADMIN_API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_API_TOKEN}`,
      ...((options.headers as Record<string, string>) ?? {}),
    },
  })
  const body = await res.json() as T
  if (!res.ok) {
    const msg = (body as any)?.message ?? (body as any)?.error ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  return body
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface Doctor {
  id: string
  name: string
  specialty: string
  city: string
  experience: number
  rating: number
  consultationFee: number
  workingHours: { from: string; to: string }
  workingDays: string[]
}

export interface DoctorsResponse {
  success: boolean
  count: number
  doctors: Doctor[]
}

export interface AvailabilityResponse {
  success: boolean
  available: boolean
  message: string
  doctor?: { id: string; name: string; specialty: string }
  suggestedTimes?: string[]
  workingDays?: string[]
  workingHours?: { from: string; to: string }
  slot?: { date: string; time: string; duration: number }
}

export interface SlotsResponse {
  success: boolean
  available?: boolean
  message?: string
  doctor?: { id: string; name: string; specialty: string }
  date?: string
  slots: string[]
  workingDays?: string[]
}

export interface BookedAppointment {
  id: string
  patient: { name: string; phone: string }
  doctor: { name: string; specialty: string }
  scheduledAt: string
  duration: number
  status: string
  reason: string
}

export interface BookResponse {
  success: boolean
  message: string
  appointment: BookedAppointment
}

export interface SpecialtiesResponse {
  success: boolean
  count: number
  specialties: Array<{ id: string; name: string; description: string; aliases: string[] }>
  names: string[]
}

export interface CitiesResponse {
  success: boolean
  count: number
  cities: string[]
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export async function getDoctors(params: { specialty?: string; city?: string } = {}): Promise<DoctorsResponse> {
  const qs = new URLSearchParams()
  if (params.specialty) qs.set('specialty', params.specialty)
  if (params.city) qs.set('city', params.city)
  const query = qs.toString() ? `?${qs}` : ''
  return request<DoctorsResponse>(`/doctors${query}`)
}

export async function checkAvailability(
  doctorId: string,
  date: string,
  time: string,
): Promise<AvailabilityResponse> {
  const qs = new URLSearchParams({ date, time })
  return request<AvailabilityResponse>(`/doctors/${doctorId}/availability?${qs}`)
}

export async function getAvailableSlots(
  doctorId: string,
  date: string,
): Promise<SlotsResponse> {
  const qs = new URLSearchParams({ date })
  return request<SlotsResponse>(`/doctors/${doctorId}/slots?${qs}`)
}

export interface BookParams {
  doctorId: string
  date: string
  time: string
  patientId?: string
  intentId?: string
  patientName?: string
  patientPhone?: string
  patientEmail?: string
  reason?: string
  duration?: number
}

export async function bookAppointment(params: BookParams): Promise<BookResponse> {
  const { doctorId, ...body } = params
  return request<BookResponse>(`/doctors/${doctorId}/appointments`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getSpecialties(): Promise<SpecialtiesResponse> {
  return request<SpecialtiesResponse>('/specialties')
}

export async function getCities(): Promise<CitiesResponse> {
  return request<CitiesResponse>('/cities')
}
