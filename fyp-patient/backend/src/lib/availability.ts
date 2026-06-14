/**
 * Shared availability helpers used both by the single-doctor slot endpoint
 * (getDoctorSlots) and by the doctors listing (getDoctors) for batch
 * soonest-slot computation.
 */

interface DoctorSchedule {
  availableFrom: string | null
  availableTo: string | null
  workingDays: string[]
  unavailableDates: string[]
}

/** Returns all 30-min slot strings for a given date, excluding booked ones. */
export function generateDaySlots(
  doctor: DoctorSchedule,
  date: Date,
  bookedTimes: Set<string>,
): string[] {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = date.toISOString().split('T')[0]

  if (!doctor.workingDays.includes(dayName)) return []
  if (doctor.unavailableDates?.includes(dateStr)) return []

  const fromHour = parseInt((doctor.availableFrom ?? '09:00').split(':')[0])
  const toHour = parseInt((doctor.availableTo ?? '17:00').split(':')[0])

  const slots: string[] = []
  for (let h = fromHour; h < toHour; h++) {
    const s1 = `${String(h).padStart(2, '0')}:00`
    const s2 = `${String(h).padStart(2, '0')}:30`
    if (!bookedTimes.has(s1)) slots.push(s1)
    if (!bookedTimes.has(s2)) slots.push(s2)
  }
  return slots
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

    const dateStr = day.toISOString().split('T')[0]
    const booked = bookedMap.get(dateStr) ?? new Set<string>()
    const slots = generateDaySlots(doctor, day, booked)

    for (const slot of slots) {
      const [h, m] = slot.split(':').map(Number)
      const slotDate = new Date(day)
      slotDate.setHours(h, m, 0, 0)

      if (slotDate <= fromDate) continue // slot already passed today

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
    const dateStr = dt.toISOString().split('T')[0]
    const timeStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
    if (!map.has(dateStr)) map.set(dateStr, new Set())
    map.get(dateStr)!.add(timeStr)
  }
  return map
}
