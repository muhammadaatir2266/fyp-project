/**
 * Shared availability helpers used both by the single-doctor slot endpoint
 * (getDoctorSlots) and by the doctors listing (getDoctors) for batch
 * soonest-slot computation.
 */

const SLOT_MINUTES = 30

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

/** Local civil date key "YYYY-MM-DD". */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parse a local date from "YYYY-MM-DD". */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Combine a date key and "HH:MM" slot into a local Date. */
export function slotStartAt(dateStr: string, slot: string): Date {
  const [h, m] = slot.split(':').map(Number)
  const d = parseLocalDate(dateStr)
  d.setHours(h, m, 0, 0)
  return d
}

/**
 * Earliest bookable slot start for same-day booking.
 * Adds minAdvanceSlots × 30 minutes to now, then rounds up to the next slot boundary.
 */
export function earliestBookableAt(minAdvanceSlots: number, now: Date = new Date()): Date {
  const slots = Math.max(0, minAdvanceSlots ?? 0)
  const earliest = new Date(now.getTime() + slots * SLOT_MINUTES * 60_000)

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
  const todayKey = localDateKey(now)
  if (dateStr < todayKey) return true
  if (dateStr > todayKey) return false
  return slotStartAt(dateStr, slot) < earliestBookableAt(minAdvanceSlots, now)
}

/** Remove past slots and same-day slots inside the advance buffer. */
export function filterBookableSlots(
  dateStr: string,
  slots: string[],
  minAdvanceSlots: number,
  now: Date = new Date(),
): string[] {
  const todayKey = localDateKey(now)
  if (dateStr < todayKey) return []
  if (dateStr > todayKey) return slots
  return slots.filter((slot) => !isSlotTooSoon(dateStr, slot, minAdvanceSlots, now))
}

/**
 * Reads the per-date slot override for a date, if any.
 * Returns the array of "HH:MM" available slots (possibly empty) when the date
 * has an explicit override, or null when no override exists for that date.
 */
export function getDateOverride(slotOverrides: unknown, dateStr: string): string[] | null {
  if (!slotOverrides || typeof slotOverrides !== 'object') return null
  const map = slotOverrides as Record<string, unknown>
  if (!Object.prototype.hasOwnProperty.call(map, dateStr)) return null
  const v = map[dateStr]
  if (!Array.isArray(v)) return null
  return v.filter((x): x is string => typeof x === 'string')
}

/** Returns all 30-min slot strings for a given date, excluding booked ones. */
export function generateDaySlots(
  doctor: DoctorSchedule,
  date: Date,
  bookedTimes: Set<string>,
  now: Date = new Date(),
): string[] {
  const dateStr = localDateKey(date)
  const minAdvance = doctor.minAdvanceSlots ?? 2

  let slots: string[]

  // A per-date override fully replaces the weekly default for that date.
  const override = getDateOverride(doctor.slotOverrides, dateStr)
  if (override) {
    slots = [...override].sort().filter((s) => !bookedTimes.has(s))
  } else {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
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
 *
 * @param doctor        Doctor schedule fields
 * @param bookedMap     Map of date string (YYYY-MM-DD) → Set of booked HH:MM times
 * @param fromDate      Start scanning from this moment (usually now)
 * @param maxDays       How many days forward to scan (default 7)
 */
export function findSoonestSlot(
  doctor: DoctorSchedule,
  bookedMap: Map<string, Set<string>>,
  fromDate: Date = new Date(),
  maxDays = 7,
): AvailabilityResult {
  const cutoff48h = new Date(fromDate.getTime() + 48 * 60 * 60 * 1000)

  for (let d = 0; d < maxDays; d++) {
    const day = new Date(fromDate)
    day.setDate(day.getDate() + d)
    day.setHours(0, 0, 0, 0)

    const dateStr = localDateKey(day)
    const booked = bookedMap.get(dateStr) ?? new Set<string>()
    const slots = generateDaySlots(doctor, day, booked, fromDate)

    for (const slot of slots) {
      const slotDate = slotStartAt(dateStr, slot)
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
 * Build a bookedMap from a flat array of appointment scheduled times
 * (all for the same doctor).
 */
export function buildBookedMap(scheduledAts: Date[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const dt of scheduledAts) {
    const dateStr = localDateKey(dt)
    const timeStr = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`
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
 * unavailableDates, within availableFrom/availableTo, slot not already booked.
 *
 * @param doctor             Doctor schedule fields
 * @param scheduledAt        The requested appointment time
 * @param bookedTimesForDay  Set of already-booked HH:MM strings for that day
 * @param excludeApptId      Optional appointment ID to exclude (for reschedule)
 */
export function validateScheduledSlot(
  doctor: DoctorSchedule,
  scheduledAt: Date,
  bookedTimesForDay: Set<string>,
  excludeApptId?: string,
): SlotValidationResult {
  const now = new Date()
  const minAdvance = doctor.minAdvanceSlots ?? 2
  const dateStr = localDateKey(scheduledAt)
  const slotHour = scheduledAt.getHours()
  const slotMin = scheduledAt.getMinutes()
  const slotStr = `${pad(slotHour)}:${pad(slotMin)}`

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

  const dayName = scheduledAt.toLocaleDateString('en-US', { weekday: 'long' })
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
