import { prisma } from './prisma'

// Purge records whose TTL has passed. Runs once at startup then every hour.
async function runRetentionCleanup() {
  const now = new Date()
  try {
    const [snapshots, intents, logs] = await Promise.all([
      // Guest chat snapshots expire after 24 h
      prisma.guestChatSnapshot.deleteMany({ where: { expiresAt: { lt: now } } }),
      // Call booking intents expire after 30 min
      prisma.callBookingIntent.deleteMany({ where: { expiresAt: { lt: now } } }),
      // API logs older than 90 days
      prisma.apiLog.deleteMany({
        where: { createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } },
      }),
    ])

    if (snapshots.count + intents.count + logs.count > 0) {
      console.log(
        `[retention] Cleaned up: ${snapshots.count} snapshots, ${intents.count} intents, ${logs.count} logs`
      )
    }
  } catch (err) {
    console.error('[retention] Cleanup error:', err)
  }
}

export function startRetentionCron() {
  runRetentionCleanup()
  // Run every hour
  setInterval(runRetentionCleanup, 60 * 60 * 1000)
}
