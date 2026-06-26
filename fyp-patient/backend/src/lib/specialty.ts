import { prisma } from './prisma'

/**
 * Map an AI/n8n free-text specialty string to a canonical Specialty row.
 *
 * Resolution order:
 *   1. Case-insensitive exact match on `name`
 *   2. Case-insensitive match on any element of `aliases`
 *
 * Returns null when no match is found — callers must NOT auto-create rows.
 */
export async function resolveSpecialty(input: string): Promise<{ id: string; name: string } | null> {
  if (!input?.trim()) return null

  const normalized = input.trim()

  const byName = await prisma.specialty.findFirst({
    where: { name: { equals: normalized, mode: 'insensitive' } },
    select: { id: true, name: true },
  })
  if (byName) return byName

  // Postgres array containment with case-insensitive match via raw query
  const byAlias = await prisma.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, name
    FROM "Specialty"
    WHERE EXISTS (
      SELECT 1 FROM unnest(aliases) AS alias
      WHERE lower(alias) = lower(${normalized})
    )
    LIMIT 1
  `

  return byAlias[0] ?? null
}
