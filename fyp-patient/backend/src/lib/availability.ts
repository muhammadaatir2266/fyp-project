/**
 * Shared availability helpers used both by the single-doctor slot endpoint
 * (getDoctorSlots) and by the doctors listing (getDoctors) for batch
 * soonest-slot computation.
 *
 * All civil date/time labels ("2026-06-28", "10:00") are computed in
 * APPOINTMENT_TZ so that booked-time sets and slot lists use the same
 * timezone regardless of the server's system clock/zone (typically UTC on
 * cloud hosts like Railway).
 */

const SLOT_MINUTES = 30

/** The civil timezone used for all appointment date/slot labels. */
export const APPOINTMENT_TZ = process.env.APPOINTMENT_TIMEZONE || 'Asia/Karachi'

interface DoctorSchedule {
  availableFrom: string | null
  availableTo: string | null
  workingDays: string[]
  unavailableDates: string[]
  // Per-date Calendly-style overrides: { "YYYY-MM-DD": ["HH:MM", ...] }
  slotOverrides?: unknown
  // Minimum 30-min slots after "now" before same-day booking is allowed.
  minAdvanceSlots?: number | null
}

const pad = (n: number) => String(n).padStart(2, '0')

// ---------------------------------------------------------------------------
// Civil timezone helpers
// ---------------------------------------------------------------------------

/**
 * UTC offset in ms for APPOINTMENT_TZ at a given instant.
 * Uses Intl.DateTimeFormat.formatToParts to handle DST-safe conversion.
 */
function tzOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APPOINTMENT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0')
  const civilMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return civilMs - at.getTime()
}

/** YYYY-MM-DD in APPOINTMENT_TZ. */
export function civilDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APPOINTMENT_TZ }).format(date)
}

/** HH:MM in APPOINTMENT_TZ. */
export function civilSlotLabel(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APPOINTMENT_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00'
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00'
  return `${h}:${m}`
}

/** UTC Date instant for a civil "YYYY-MM-DD" date + "HH:MM" slot in APPOINTMENT_TZ. */
export function civilSlotToDate(dateStr: string, slot: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [h, min] = slot.split(':').map(Number)
  // Probe at noon UTC to stay clear of any DST transition boundary within the day.
  const probe = new Date(Date.UTC(y, mo - 1, d, 12))
  const offset = tzOffsetMs(probe)
  const civilMidnightUtc = Date.UTC(y, mo - 1, d) - offset
  return new Date(civilMidnightUtc + (h * 60 + min) * 60_000)
}

/** UTC {start, end} instants that bound a full civil day in APPOINTMENT_TZ. */
export function civilDayBounds(dateStr: string): { start: Date; end: Date } {
  const start = civilSlotToDate(dateStr, '00:00')
  const [y, mo, d] = dateStr.split('-').map(Number)
  const probe = new Date(Date.UTC(y, mo - 1, d, 12))
  const offset = tzOffsetMs(probe)
  const nextDayUtc = Date.UTC(y, mo - 1, d + 1) - offset
  return { start, end: new Date(nextDayUtc - 1) }
}

/** Full weekday name in APPOINTMENT_TZ (e.g. "Monday"). */
export function civilWeekday(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APPOINTMENT_TZ,
    weekday: 'long',
  }).format(date)
}

// ---------------------------------------------------------------------------
// Back-compat aliases (kept so existing callers that import these still work)
// ---------------------------------------------------------------------------

/** @deprecated Use civilDateKey. */
export function localDateKey(d: Date): string {
  return civilDateKey(d)
}

/** @deprecated Use civilSlotToDate. */
export function parseLocalDate(dateStr: string): Date {
  return civilSlotToDate(dateStr, '00:00')
}

// ---------------------------------------------------------------------------
// Same-day advance-buffer helpers
// ---------------------------------------------------------------------------

/**
 * Earliest bookable slot start for same-day booking.
 * Adds minAdvanceSlots × 30 minutes to now, then rounds up to the next slot boundary.
 */
export function earliestBookableAt(minAdvanceSlots: number, now: Date = new Date()): Date {
  const count = Math.max(0, minAdvanceSlots ?? 0)
  const earliest = new Date(now.getTime() + count * SLOT_MINUTES * 60_000)
  const minutes = earliest.getMinutes()
  const remainder = minutes % SLOT_MINUTES
  if (remainder !== 0 || earliest.getSeconds() > 0 || earliest.getMilliseconds() > 0) {
    earliest.setMinutes(minutes + (SLOT_MINUTES - remainder), 0, 0)
  } else {
    earliest.setSeconds(0, 0)
  }
  return earliest
}

/** True when a slot on dateStr is in the past or inside the same-day advance buffer. */
export function isSlotTooSoon(
  dateStr: string,
  slot: string,
  minAdvanceSlots: number,
  now: Date = new Date(),
): boolean {
  const today = civilDateKey(now)
  if (dateStr < today) return true
  if (dateStr > today) return false
  return civilSlotToDate(dateStr, slot) < earliestBookableAt(minAdvanceSlots, now)
}

/** Remove past slots and same-day slots inside the advance buffer. */
export function filterBookableSlots(
  dateStr: string,
  slots: string[],
  minAdvanceSlots: number,
  now: Date = new Date(),
): string[] {
  const today = civilDateKey(now)
  if (dateStr < today) return []
  if (dateStr > today) return slots
  return slots.filter((slot) => !isSlotTooSoon(dateStr, slot, minAdvanceSlots, now))
}

// ---------------------------------------------------------------------------
// Per-date slot override helpers
// ---------------------------------------------------------------------------

export function getDateOverride(slotOverrides: unknown, dateStr: string): string[] | null {
  if (!slotOverrides || typeof slotOverrides !== 'object') return null
  const map = slotOverrides as Record<string, unknown>
  if (!Object.prototype.hasOwnProperty.call(map, dateStr)) return null
  const v = map[dateStr]
  if (!Array.isArray(v)) return null
  return v.filter((x): x is string => typeof x === 'string')
}

// ---------------------------------------------------------------------------
// Core slot generation
// ---------------------------------------------------------------------------

/** Returns bookable 30-min slot strings for a given date, excluding booked ones. */
export function generateDaySlots(
  doctor: DoctorSchedule,
  date: Date,
  bookedTimes: Set<string>,
  now: Date = new Date(),
): string[] {
  const dateStr = civilDateKey(date)
  const minAdvance = doctor.minAdvanceSlots ?? 2

  let slots: string[]

  // A per-date override fully replaces the weekly default for that date.
  const override = getDateOverride(doctor.slotOverrides, dateStr)
  if (override) {
    slots = [...override].sort().filter((s) => !bookedTimes.has(s))
  } else {
    const dayName = civilWeekday(date)
    if (!doctor.workingDays.includes(dayName)) return []
    if (doctor.unavailableDates?.includes(dateStr)) return []

    const fromHour = parseInt((doctor.availableFrom ?? '09:00').split(':')[0])
    const toHour = parseInt((doctor.availableTo ?? '17:00').split(':')[0])

    slots = []
    for (let h = fromHour; h < toHour; h++) {
      const s1 = `${pad(h)}:00`
      const s2 = `${pad(h)}:30`
      if (!bookedTimes.has(s1)) slots.push(s1)
      if (!bookedTimes.has(s2)) slots.push(s2)
    }
  }

  return filterBookableSlots(dateStr, slots, minAdvance, now)
}

export interface AvailabilityResult {
  nextAvailableAt: Date | null
  hasSlotWithin48h: boolean
}

/**
 * Find the soonest open slot for a single doctor given their pre-fetched
 * booked appointments.
 */
export function findSoonestSlot(
  doctor: DoctorSchedule,
  bookedMap: Map<string, Set<string>>,
  fromDate: Date = new Date(),
  maxDays = 7,
): AvailabilityResult {
  const cutoff48h = new Date(fromDate.getTime() + 48 * 60 * 60 * 1000)

  for (let d = 0; d < maxDays; d++) {
    // Step forward in civil days by advancing 24 h at a time in UTC.
    const dayUtc = new Date(fromDate.getTime() + d * 24 * 60 * 60 * 1000)
    const dateStr = civilDateKey(dayUtc)
    const booked = bookedMap.get(dateStr) ?? new Set<string>()

    // Use civil noon as the representative Date for weekday/date comparisons.
    const dayRepr = civilSlotToDate(dateStr, '12:00')
    const slots = generateDaySlots(doctor, dayRepr, booked, fromDate)

    for (const slot of slots) {
      const slotDate = civilSlotToDate(dateStr, slot)
      if (slotDate <= fromDate) continue
      return {
        nextAvailableAt: slotDate,
        hasSlotWithin48h: slotDate <= cutoff48h,
      }
    }
  }

  return { nextAvailableAt: null, hasSlotWithin48h: false }
}

/**
 * Build a bookedMap from appointment scheduled times.
 * Keys: civil "YYYY-MM-DD" in APPOINTMENT_TZ.
 * Values: sets of civil "HH:MM" slot labels.
 */
export function buildBookedMap(scheduledAts: Date[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const dt of scheduledAts) {
    const dateStr = civilDateKey(dt)
    const timeStr = civilSlotLabel(dt)
    if (!map.has(dateStr)) map.set(dateStr, new Set())
    map.get(dateStr)!.add(timeStr)
  }
  return map
}

export interface SlotValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate that a requested scheduledAt time is a bookable slot.
 * Checks: not in past, same-day advance buffer, working day, not on
 * unavailableDates, within availableFrom/availableTo, not already booked.
 */
export function validateScheduledSlot(
  doctor: DoctorSchedule,
  scheduledAt: Date,
  bookedTimesForDay: Set<string>,
  excludeApptId?: string,
): SlotValidationResult {
  const now = new Date()
  const minAdvance = doctor.minAdvanceSlots ?? 2
  const dateStr = civilDateKey(scheduledAt)
  const slotStr = civilSlotLabel(scheduledAt)
  const [slotHour, slotMin] = slotStr.split(':').map(Number)

  if (scheduledAt <= now) {
    return { valid: false, error: 'Appointment time must be in the future.' }
  }

  if (isSlotTooSoon(dateStr, slotStr, minAdvance, now)) {
    const hours = (minAdvance * SLOT_MINUTES) / 60
    const label =
      minAdvance === 0
        ? 'This time slot has already passed.'
        : minAdvance === 1
          ? 'Same-day bookings require at least 30 minutes notice.'
          : `Same-day bookings require at least ${hours} hour${hours !== 1 ? 's' : ''} notice (${minAdvance} slots).`
    return { valid: false, error: label }
  }

  // A per-date override fully replaces the weekly default for that date.
  const override = getDateOverride(doctor.slotOverrides, dateStr)
  if (override) {
    if (!override.includes(slotStr)) {
      return { valid: false, error: 'This time is not available on the selected date.' }
    }
    if (bookedTimesForDay.has(slotStr)) {
      return { valid: false, error: 'This slot is already booked.' }
    }
    return { valid: true }
  }

  const dayName = civilWeekday(scheduledAt)
  if (!doctor.workingDays.includes(dayName)) {
    return { valid: false, error: `Doctor is not available on ${dayName}s.` }
  }

  if (doctor.unavailableDates?.includes(dateStr)) {
    return { valid: false, error: 'Doctor is unavailable on this date.' }
  }

  const fromHour = parseInt((doctor.availableFrom ?? '09:00').split(':')[0])
  const toHour = parseInt((doctor.availableTo ?? '17:00').split(':')[0])

  if (slotHour < fromHour || slotHour >= toHour) {
    return {
      valid: false,
      error: `Doctor is only available between ${doctor.availableFrom ?? '09:00'} and ${doctor.availableTo ?? '17:00'}.`,
    }
  }

  if (slotMin !== 0 && slotMin !== 30) {
    return { valid: false, error: 'Slots must be on the hour or half-hour.' }
  }

  if (bookedTimesForDay.has(slotStr)) {
    return { valid: false, error: 'This slot is already booked.' }
  }

  return { valid: true }
}
