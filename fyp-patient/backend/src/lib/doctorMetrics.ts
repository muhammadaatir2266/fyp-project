import { prisma } from './prisma'

export interface DoctorMetrics {
  recencyRating: number | null  // time-decayed weighted average rating
  lastReviewAt: Date | null
  reliabilityScore: number | null  // 0–100 composite
  doctorCancellationRate: number | null
  avgConfirmHours: number | null
}

const HALF_LIFE_DAYS = 180  // reviews older than this decay by 50%

/**
 * Compute metrics for an array of doctor IDs in bulk (single set of queries).
 * Returns a Map<doctorId, DoctorMetrics>.
 */
export async function batchDoctorMetrics(
  doctorIds: string[],
  globalAvg: number,
): Promise<Map<string, DoctorMetrics>> {
  if (doctorIds.length === 0) return new Map()

  const now = new Date()

  // --- Review recency ---
  const reviews = await prisma.doctorReview.findMany({
    where: { doctorId: { in: doctorIds } },
    select: { doctorId: true, rating: true, createdAt: true },
  })

  const reviewsByDoctor = new Map<string, typeof reviews>()
  for (const r of reviews) {
    if (!reviewsByDoctor.has(r.doctorId)) reviewsByDoctor.set(r.doctorId, [])
    reviewsByDoctor.get(r.doctorId)!.push(r)
  }

  // --- Reliability: past appointments ---
  const pastAppts = await prisma.appointment.findMany({
    where: {
      doctorId: { in: doctorIds },
      scheduledAt: { lt: now },
    },
    select: {
      doctorId: true,
      status: true,
      cancelledBy: true,
      confirmedAt: true,
      createdAt: true,
    },
  })

  const apptsByDoctor = new Map<string, typeof pastAppts>()
  for (const a of pastAppts) {
    if (!apptsByDoctor.has(a.doctorId)) apptsByDoctor.set(a.doctorId, [])
    apptsByDoctor.get(a.doctorId)!.push(a)
  }

  const result = new Map<string, DoctorMetrics>()

  for (const doctorId of doctorIds) {
    const docReviews = reviewsByDoctor.get(doctorId) ?? []
    const docAppts = apptsByDoctor.get(doctorId) ?? []

    // Recency-weighted rating
    let recencyRating: number | null = null
    let lastReviewAt: Date | null = null

    if (docReviews.length > 0) {
      let weightedSum = 0
      let weightTotal = 0
      for (const r of docReviews) {
        const daysSince = (now.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        const w = Math.exp((-daysSince * Math.LN2) / HALF_LIFE_DAYS)
        weightedSum += r.rating * w
        weightTotal += w
        if (!lastReviewAt || r.createdAt > lastReviewAt) lastReviewAt = r.createdAt
      }
      recencyRating = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 10) / 10 : null
    }

    // Reliability score (min 3 past appointments)
    let reliabilityScore: number | null = null
    let doctorCancellationRate: number | null = null
    let avgConfirmHours: number | null = null

    const MIN_APPTS = 3
    if (docAppts.length >= MIN_APPTS) {
      const total = docAppts.length
      const completed = docAppts.filter((a) => a.status === 'COMPLETED').length
      const doctorCancelled = docAppts.filter((a) => a.cancelledBy === 'DOCTOR').length
      const noShow = docAppts.filter((a) => a.status === 'NO_SHOW').length

      // Completion rate: doctor-caused failures only in denominator
      const denominator = completed + doctorCancelled + noShow
      const completionRate = denominator > 0 ? completed / denominator : 1

      doctorCancellationRate = Math.round((doctorCancelled / total) * 100) / 100

      // Confirm speed
      const confirmedAppts = docAppts.filter((a) => a.confirmedAt)
      if (confirmedAppts.length > 0) {
        const totalHours = confirmedAppts.reduce((sum, a) => {
          const hours = (a.confirmedAt!.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60)
          return sum + Math.min(hours, 48) // cap at 48h
        }, 0)
        const avgHours = totalHours / confirmedAppts.length
        avgConfirmHours = Math.round(avgHours * 10) / 10
        const confirmSpeedScore = 1 - avgHours / 48  // 0 h → 1.0, 48 h → 0.0
        reliabilityScore = Math.round(
          (0.5 * completionRate + 0.3 * (1 - doctorCancellationRate) + 0.2 * confirmSpeedScore) * 100
        )
      } else {
        reliabilityScore = Math.round(
          (0.5 * completionRate + 0.3 * (1 - doctorCancellationRate)) * 100
        )
      }
    }

    result.set(doctorId, { recencyRating, lastReviewAt, reliabilityScore, doctorCancellationRate, avgConfirmHours })
  }

  return result
}
