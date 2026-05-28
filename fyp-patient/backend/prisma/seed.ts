import { PrismaClient, UserRole, DoctorVerificationStatus, Gender } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // ---- Specialties ----
  const specialtyData = [
    { name: 'Cardiology',       description: 'Heart and cardiovascular system specialist', iconName: 'heart' },
    { name: 'General Medicine', description: 'Primary care and general health issues',      iconName: 'stethoscope' },
    { name: 'Pediatrics',       description: 'Medical care for infants and children',        iconName: 'baby' },
    { name: 'Dermatology',      description: 'Skin, hair, and nail conditions',              iconName: 'droplet' },
    { name: 'Orthopedics',      description: 'Bones, joints, ligaments, and muscles',        iconName: 'bone' },
    { name: 'Neurology',        description: 'Brain and nervous system disorders',           iconName: 'brain' },
    { name: 'Psychiatry',       description: 'Mental health and behavioral disorders',       iconName: 'brain' },
    { name: 'Gastroenterology', description: 'Digestive system disorders',                  iconName: 'activity' },
    { name: 'Pulmonology',      description: 'Lung and respiratory conditions',              iconName: 'wind' },
    { name: 'ENT',              description: 'Ear, nose, and throat specialist',             iconName: 'ear' },
  ]

  const specialties: Record<string, { id: string; name: string }> = {}
  for (const s of specialtyData) {
    const sp = await prisma.specialty.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    })
    specialties[s.name] = sp
  }
  console.log('✅ Seeded specialties')

  // ---- Passwords ----
  const adminPw   = await bcrypt.hash('admin123', 10)
  const doctorPw  = await bcrypt.hash('doctor123', 10)
  const patientPw = await bcrypt.hash('patient123', 10)

  // ---- Admin ----
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mediassist.com' },
    update: {},
    create: {
      email: 'admin@mediassist.com',
      password: adminPw,
      role: UserRole.ADMIN,
      admin: {
        create: {
          firstName: 'System',
          lastName: 'Admin',
          isSuperAdmin: true,
          isActive: true,
        },
      },
    },
    include: { admin: true },
  })
  console.log('✅ Seeded admin: admin@mediassist.com / admin123')

  // ---- Demo doctors ----
  const demoDocInfo = [
    {
      email: 'doctor@mediassist.com',
      firstName: 'Sarah',  lastName: 'Johnson',
      specialty: 'Cardiology',   city: 'Karachi',
      phone: '+92-21-3456789',   address: '123 Medical Center Drive',
      qualifications: 'MD, FACC - Board Certified Cardiologist',
      experience: 15, consultationFee: 2000,
      rating: 4.8, reviewCount: 127,
    },
    {
      email: 'doctor2@mediassist.com',
      firstName: 'Ali',    lastName: 'Hassan',
      specialty: 'General Medicine', city: 'Lahore',
      phone: '+92-42-1234567',   address: '45 Gulberg III',
      qualifications: 'MBBS, FCPS - General Physician',
      experience: 8,  consultationFee: 1500,
      rating: 4.6, reviewCount: 89,
    },
    {
      email: 'doctor3@mediassist.com',
      firstName: 'Fatima', lastName: 'Sheikh',
      specialty: 'Dermatology', city: 'Islamabad',
      phone: '+92-51-9876543',   address: '78 F-7 Markaz',
      qualifications: 'MBBS, FCPS - Dermatologist',
      experience: 10, consultationFee: 2500,
      rating: 4.9, reviewCount: 203,
    },
    {
      email: 'doctor4@mediassist.com',
      firstName: 'Usman',  lastName: 'Malik',
      specialty: 'Neurology', city: 'Karachi',
      phone: '+92-21-8765432',   address: '22 Clifton Block 4',
      qualifications: 'MD, Neurology - Aga Khan Hospital',
      experience: 12, consultationFee: 3000,
      rating: 4.7, reviewCount: 156,
    },
    {
      email: 'doctor5@mediassist.com',
      firstName: 'Ayesha', lastName: 'Qureshi',
      specialty: 'Pediatrics', city: 'Lahore',
      phone: '+92-42-5678901',   address: '10 DHA Phase 5',
      qualifications: 'MBBS, DCH - Pediatrician',
      experience: 7,  consultationFee: 1800,
      rating: 4.5, reviewCount: 74,
    },
    {
      email: 'doctor6@mediassist.com',
      firstName: 'Imran',  lastName: 'Khan',
      specialty: 'Orthopedics', city: 'Islamabad',
      phone: '+92-51-3214567',   address: '33 Blue Area',
      qualifications: 'MBBS, FRCS - Orthopedic Surgeon',
      experience: 18, consultationFee: 3500,
      rating: 4.8, reviewCount: 312,
    },
    {
      email: 'doctor7@mediassist.com',
      firstName: 'Nadia',  lastName: 'Ahmed',
      specialty: 'Gastroenterology', city: 'Karachi',
      phone: '+92-21-2233445',   address: '56 PECHS Block 2',
      qualifications: 'MBBS, FCPS - Gastroenterologist',
      experience: 9,  consultationFee: 2200,
      rating: 4.6, reviewCount: 98,
    },
  ]

  for (const d of demoDocInfo) {
    const pw = await bcrypt.hash('doctor123', 10)
    await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        password: pw,
        role: UserRole.DOCTOR,
        doctor: {
          create: {
            firstName: d.firstName,
            lastName: d.lastName,
            specialtyId: specialties[d.specialty].id,
            phone: d.phone,
            address: d.address,
            city: d.city,
            qualifications: d.qualifications,
            experience: d.experience,
            consultationFee: d.consultationFee,
            availableFrom: '09:00',
            availableTo: '17:00',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            isActive: true,
            isVerified: true,
            verificationStatus: DoctorVerificationStatus.APPROVED,
            rating: d.rating,
            reviewCount: d.reviewCount,
          },
        },
      },
    })
  }
  console.log('✅ Seeded 7 demo doctors (all APPROVED & active)')

  // ---- Demo patients ----
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@mediassist.com' },
    update: {},
    create: {
      email: 'patient@mediassist.com',
      password: patientPw,
      role: UserRole.PATIENT,
      patient: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+923001234567',
          dateOfBirth: new Date('1990-01-15'),
          gender: Gender.MALE,
          address: '456 Patient Street',
          city: 'Karachi',
          emergencyContact: '+923011234567',
          medicalHistory: 'No significant medical history',
          allergies: 'None',
        },
      },
    },
  })
  console.log('✅ Seeded patient: patient@mediassist.com / patient123')

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📋 Sample Login Credentials:')
  console.log('   Admin:   admin@mediassist.com  / admin123')
  console.log('   Doctor:  doctor@mediassist.com  / doctor123')
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
