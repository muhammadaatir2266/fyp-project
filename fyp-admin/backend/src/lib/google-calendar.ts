/**
 * Shared Google Calendar availability-sync helper.
 *
 * Same file is kept in the doctor, patient, and admin backends. It reads a
 * doctor's external free/busy and writes confirmed appointments back to their
 * Google Calendar. All read/write helpers are fail-open: if Google is not
 * configured, the doctor is not connected, or any API/token error occurs, they
 * return empty/null so the in-app DB availability keeps working.
 *
 * Only the doctor backend uses the OAuth consent/exchange helpers.
 */
import { google } from 'googleapis'
import crypto from 'crypto'

// Inferred OAuth2 client type (avoids a direct dependency on google-auth-library).
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>

export interface GoogleDoctor {
  googleCalendarConnected?: boolean | null
  googleRefreshToken?: string | null
  googleCalendarId?: string | null
}

export interface BusyInterval {
  start: Date
  end: Date
}

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

/** True when the OAuth client credentials are present in env. */
export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

function encKey(): Buffer {
  const raw =
    process.env.GOOGLE_TOKEN_ENC_KEY || process.env.JWT_SECRET || 'dev-insecure-google-key'
  // Derive a stable 32-byte key regardless of the configured string length.
  return crypto.createHash('sha256').update(raw).digest()
}

/** AES-256-GCM encrypt a refresh token for storage. Format: ivHex:tagHex:ctHex */
export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey(), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`
}

/** Decrypt a stored refresh token. Returns null on any tamper/format error. */
export function decryptToken(payload: string): string | null {
  try {
    const [ivHex, tagHex, ctHex] = payload.split(':')
    if (!ivHex || !tagHex || !ctHex) return null
    const decipher = crypto.createDecipheriv('aes-256-gcm', encKey(), Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const pt = Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()])
    return pt.toString('utf8')
  } catch {
    return null
  }
}

export function getOAuthClient(redirectUri?: string): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_OAUTH_REDIRECT_URI,
  )
}

/** Build the Google consent URL (offline access -> refresh token). */
export function getConsentUrl(state: string): string {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  })
}

export interface ExchangeResult {
  refreshToken: string | null
  email: string | null
  calendarId: string
}

/** Exchange the OAuth code for tokens and read the primary calendar email. */
export async function exchangeCodeForTokens(code: string): Promise<ExchangeResult> {
  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)

  let email: string | null = null
  try {
    const cal = google.calendar({ version: 'v3', auth: client })
    const primary = await cal.calendars.get({ calendarId: 'primary' })
    email = primary.data.id ?? null // primary calendar id is the account email
  } catch {
    // non-fatal: connection still succeeds without the email label
  }

  return { refreshToken: tokens.refresh_token ?? null, email, calendarId: 'primary' }
}

function authedClient(doctor: GoogleDoctor): OAuth2Client | null {
  if (!isGoogleConfigured()) return null
  if (!doctor.googleCalendarConnected || !doctor.googleRefreshToken) return null
  const refresh = decryptToken(doctor.googleRefreshToken)
  if (!refresh) return null
  const client = getOAuthClient()
  client.setCredentials({ refresh_token: refresh })
  return client
}

/** Free/busy intervals for a doctor in [timeMin, timeMax]. [] when unavailable. */
export async function getBusyIntervals(
  doctor: GoogleDoctor,
  timeMin: Date,
  timeMax: Date,
): Promise<BusyInterval[]> {
  try {
    const client = authedClient(doctor)
    if (!client) return []
    const cal = google.calendar({ version: 'v3', auth: client })
    const calId = doctor.googleCalendarId || 'primary'
    const resp = await cal.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calId }],
      },
    })
    const busy = resp.data.calendars?.[calId]?.busy ?? []
    return busy
      .filter((b) => b.start && b.end)
      .map((b) => ({ start: new Date(b.start as string), end: new Date(b.end as string) }))
  } catch (err) {
    console.error('[google-calendar] getBusyIntervals failed:', (err as Error).message)
    return []
  }
}

/**
 * Mark every 30-min slot that overlaps a Google busy interval as taken by
 * adding its HH:MM string to an existing booked-times set. Date overlap is
 * timezone-agnostic (absolute instants), matching the existing slot logic.
 */
export function blockBusyIntoBookedTimes(
  date: Date,
  busy: BusyInterval[],
  bookedTimes: Set<string>,
): void {
  if (busy.length === 0) return
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const slotStart = new Date(date)
      slotStart.setHours(h, m, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + 30 * 60000)
      if (busy.some((b) => slotStart < b.end && slotEnd > b.start)) {
        bookedTimes.add(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      }
    }
  }
}

export interface CalendarEventInput {
  start: Date
  end: Date
  summary: string
  description?: string
}

/** Create a calendar event; returns the event id or null on failure. */
export async function createCalendarEvent(
  doctor: GoogleDoctor,
  ev: CalendarEventInput,
): Promise<string | null> {
  try {
    const client = authedClient(doctor)
    if (!client) return null
    const cal = google.calendar({ version: 'v3', auth: client })
    const calId = doctor.googleCalendarId || 'primary'
    const resp = await cal.events.insert({
      calendarId: calId,
      requestBody: {
        summary: ev.summary,
        description: ev.description,
        start: { dateTime: ev.start.toISOString(), timeZone: 'UTC' },
        end: { dateTime: ev.end.toISOString(), timeZone: 'UTC' },
      },
    })
    return resp.data.id ?? null
  } catch (err) {
    console.error('[google-calendar] createCalendarEvent failed:', (err as Error).message)
    return null
  }
}

/** Patch an existing calendar event's time/summary. Best-effort. */
export async function updateCalendarEvent(
  doctor: GoogleDoctor,
  eventId: string,
  ev: Partial<CalendarEventInput>,
): Promise<void> {
  try {
    const client = authedClient(doctor)
    if (!client) return
    const cal = google.calendar({ version: 'v3', auth: client })
    const calId = doctor.googleCalendarId || 'primary'
    await cal.events.patch({
      calendarId: calId,
      eventId,
      requestBody: {
        ...(ev.summary !== undefined && { summary: ev.summary }),
        ...(ev.description !== undefined && { description: ev.description }),
        ...(ev.start && { start: { dateTime: ev.start.toISOString(), timeZone: 'UTC' } }),
        ...(ev.end && { end: { dateTime: ev.end.toISOString(), timeZone: 'UTC' } }),
      },
    })
  } catch (err) {
    console.error('[google-calendar] updateCalendarEvent failed:', (err as Error).message)
  }
}

/** Delete a calendar event. Best-effort. */
export async function deleteCalendarEvent(doctor: GoogleDoctor, eventId: string): Promise<void> {
  try {
    const client = authedClient(doctor)
    if (!client) return
    const cal = google.calendar({ version: 'v3', auth: client })
    const calId = doctor.googleCalendarId || 'primary'
    await cal.events.delete({ calendarId: calId, eventId })
  } catch (err) {
    console.error('[google-calendar] deleteCalendarEvent failed:', (err as Error).message)
  }
}

/** Revoke the doctor's refresh token at Google (on disconnect). Best-effort. */
export async function revokeToken(doctor: GoogleDoctor): Promise<void> {
  try {
    if (!doctor.googleRefreshToken) return
    const refresh = decryptToken(doctor.googleRefreshToken)
    if (!refresh) return
    const client = getOAuthClient()
    client.setCredentials({ refresh_token: refresh })
    await client.revokeCredentials()
  } catch (err) {
    console.error('[google-calendar] revokeToken failed:', (err as Error).message)
  }
}
