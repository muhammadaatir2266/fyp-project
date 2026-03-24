import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create a specialty first (required for doctor)
  const cardiology = await prisma.specialty.upsert({
    where: { name: 'Cardiology' },
    update: {},
    create: {
      name: 'Cardiology',
      description: 'Heart and cardiovascular system specialist',
      iconName: 'heart',
    },
  })

  console.log('✅ Created specialty: Cardiology')

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const doctorPassword = await bcrypt.hash('doctor123', 10)
  const patientPassword = await bcrypt.hash('patient123', 10)

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mediassist.com' },
    update: {},
    create: {
      email: 'admin@mediassist.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  console.log('✅ Created admin user: admin@mediassist.com')

  // Create Doctor User with Profile
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@mediassist.com' },
    update: {},
    create: {
      email: 'doctor@mediassist.com',
      password: doctorPassword,
      role: UserRole.DOCTOR,
      doctor: {
        create: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          specialtyId: cardiology.id,
          phone: '+1234567890',
          address: '123 Medical Center Drive',
          city: 'New York',
          qualifications: 'MD, FACC - Board Certified Cardiologist',
          experience: 15,
          consultationFee: 150.0,
          availableFrom: '09:00',
          availableTo: '17:00',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          isActive: true,
          isVerified: true,
          rating: 4.8,
          reviewCount: 127,
        },
      },
    },
  })

  console.log('✅ Created doctor user: doctor@mediassist.com')

  // Create Patient User with Profile
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@mediassist.com' },
    update: {},
    create: {
      email: 'patient@mediassist.com',
      password: patientPassword,
      role: UserRole.PATIENT,
      patient: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1987654321',
          dateOfBirth: new Date('1990-01-15'),
          gender: 'MALE',
          address: '456 Patient Street',
          city: 'New York',
          emergencyContact: '+1555123456',
          medicalHistory: 'No significant medical history',
          allergies: 'None',
        },
      },
    },
  })

  console.log('✅ Created patient user: patient@mediassist.com')

  // Create additional specialties for better testing
  const specialties = [
    {
      name: 'General Medicine',
      description: 'Primary care and general health issues',
      iconName: 'stethoscope',
    },
    {
      name: 'Pediatrics',
      description: 'Medical care for infants, children, and adolescents',
      iconName: 'baby',
    },
    {
      name: 'Dermatology',
      description: 'Skin, hair, and nail conditions',
      iconName: 'droplet',
    },
    {
      name: 'Orthopedics',
      description: 'Bones, joints, ligaments, and muscles',
      iconName: 'bone',
    },
    {
      name: 'Neurology',
      description: 'Brain and nervous system disorders',
      iconName: 'brain',
    },
    {
      name: 'Psychiatry',
      description: 'Mental health and behavioral disorders',
      iconName: 'brain',
    },
  ]

  for (const specialty of specialties) {
    await prisma.specialty.upsert({
      where: { name: specialty.name },
      update: {},
      create: specialty,
    })
  }

  console.log('✅ Created additional specialties')

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📋 Sample Login Credentials:')
  console.log('   Admin:   admin@mediassist.com / admin123')
  console.log('   Doctor:  doctor@mediassist.com / doctor123')
  console.log('   Patient: patient@mediassist.com / patient123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
