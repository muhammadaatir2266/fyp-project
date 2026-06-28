import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Seed script must not run in production. Aborting.')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('Seeding admin user...')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      isSuperAdmin: true,
      isActive: true,
    },
  })

  console.log('Done. Login: admin@example.com / admin123')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
