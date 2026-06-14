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
  await prisma.user.upsert({
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

  // ---- Demo doctors — start with rating 0; reviews will recalculate ----
  // lat/lng: city centroid + small unique offset so distances differ realistically
  const demoDocInfo = [
    {
      email: 'doctor@mediassist.com',
      firstName: 'Sarah',  lastName: 'Johnson',
      specialty: 'Cardiology',   city: 'Karachi',
      phone: '+92-21-3456789',   address: '123 Medical Center Drive',
      qualifications: 'MD, FACC - Board Certified Cardiologist',
      experience: 15, consultationFee: 2000,
      latitude: 24.8607 + 0.010, longitude: 67.0011 + 0.005,
      gender: Gender.FEMALE,
      languages: ['English', 'Urdu'],
    },
    {
      email: 'doctor2@mediassist.com',
      firstName: 'Ali',    lastName: 'Hassan',
      specialty: 'General Medicine', city: 'Lahore',
      phone: '+92-42-1234567',   address: '45 Gulberg III',
      qualifications: 'MBBS, FCPS - General Physician',
      experience: 8,  consultationFee: 1500,
      latitude: 31.5204 + 0.020, longitude: 74.3587 - 0.012,
      gender: Gender.MALE,
      languages: ['English', 'Urdu', 'Punjabi'],
    },
    {
      email: 'doctor3@mediassist.com',
      firstName: 'Fatima', lastName: 'Sheikh',
      specialty: 'Dermatology', city: 'Islamabad',
      phone: '+92-51-9876543',   address: '78 F-7 Markaz',
      qualifications: 'MBBS, FCPS - Dermatologist',
      experience: 10, consultationFee: 2500,
      latitude: 33.6844 - 0.008, longitude: 73.0479 + 0.015,
      gender: Gender.FEMALE,
      languages: ['English', 'Urdu', 'Punjabi'],
    },
    {
      email: 'doctor4@mediassist.com',
      firstName: 'Usman',  lastName: 'Malik',
      specialty: 'Neurology', city: 'Karachi',
      phone: '+92-21-8765432',   address: '22 Clifton Block 4',
      qualifications: 'MD, Neurology - Aga Khan Hospital',
      experience: 12, consultationFee: 3000,
      latitude: 24.8607 - 0.015, longitude: 67.0011 + 0.020,
      gender: Gender.MALE,
      languages: ['English', 'Urdu', 'Sindhi'],
    },
    {
      email: 'doctor5@mediassist.com',
      firstName: 'Ayesha', lastName: 'Qureshi',
      specialty: 'Pediatrics', city: 'Lahore',
      phone: '+92-42-5678901',   address: '10 DHA Phase 5',
      qualifications: 'MBBS, DCH - Pediatrician',
      experience: 7,  consultationFee: 1800,
      latitude: 31.5204 - 0.025, longitude: 74.3587 + 0.018,
      gender: Gender.FEMALE,
      languages: ['Urdu', 'Punjabi'],
    },
    {
      email: 'doctor6@mediassist.com',
      firstName: 'Imran',  lastName: 'Khan',
      specialty: 'Orthopedics', city: 'Islamabad',
      phone: '+92-51-3214567',   address: '33 Blue Area',
      qualifications: 'MBBS, FRCS - Orthopedic Surgeon',
      experience: 18, consultationFee: 3500,
      latitude: 33.6844 + 0.012, longitude: 73.0479 - 0.010,
      gender: Gender.MALE,
      languages: ['English', 'Urdu', 'Pashto'],
    },
    {
      email: 'doctor7@mediassist.com',
      firstName: 'Nadia',  lastName: 'Ahmed',
      specialty: 'Gastroenterology', city: 'Karachi',
      phone: '+92-21-2233445',   address: '56 PECHS Block 2',
      qualifications: 'MBBS, FCPS - Gastroenterologist',
      experience: 9,  consultationFee: 2200,
      latitude: 24.8607 + 0.025, longitude: 67.0011 - 0.018,
      gender: Gender.FEMALE,
      languages: ['English', 'Urdu', 'Balochi'],
    },
  ]

  const doctorRecords: Array<{ id: string; email: string }> = []
  for (const d of demoDocInfo) {
    const pw = await bcrypt.hash('doctor123', 10)
    const user = await prisma.user.upsert({
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
            latitude: d.latitude,
            longitude: d.longitude,
            gender: d.gender,
            languages: d.languages,
            qualifications: d.qualifications,
            experience: d.experience,
            consultationFee: d.consultationFee,
            availableFrom: '09:00',
            availableTo: '17:00',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            isActive: true,
            isVerified: true,
            verificationStatus: DoctorVerificationStatus.APPROVED,
            // rating and reviewCount start at 0 — recalculated from real reviews below
            rating: 0,
            reviewCount: 0,
          },
        },
      },
      include: { doctor: { select: { id: true } } },
    })
    if (user.doctor) {
      doctorRecords.push({ id: user.doctor.id, email: d.email })
    }
  }
  console.log('✅ Seeded 7 demo doctors (all APPROVED & active)')

  // ---- Demo patient ----
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
    include: { patient: { select: { id: true } } },
  })
  console.log('✅ Seeded patient: patient@mediassist.com / patient123')

  const patientId = patientUser.patient?.id
  if (!patientId) {
    console.log('⚠️  Could not resolve patientId — skipping sample reviews')
  } else {
    // ---- Sample completed appointments + reviews for the first 4 demo doctors ----
    const sampleReviews: Array<{ doctorEmail: string; ratings: number[]; comments: Array<string | null> }> = [
      {
        doctorEmail: 'doctor@mediassist.com',
        ratings: [5, 5, 4, 5, 4],
        comments: [
          'Excellent cardiologist, very thorough.',
          'Explained everything clearly. Highly recommend.',
          'Great doctor, though waiting time was long.',
          'Very professional and knowledgeable.',
          null,
        ],
      },
      {
        doctorEmail: 'doctor2@mediassist.com',
        ratings: [4, 4, 5, 3, 4],
        comments: [
          'Good general physician. Listens patiently.',
          'Helpful and prompt.',
          'Best GP I have visited. Very thorough examination.',
          'Decent doctor but clinic needs improvement.',
          'Would visit again.',
        ],
      },
      {
        doctorEmail: 'doctor3@mediassist.com',
        ratings: [5, 5, 5, 4, 5],
        comments: [
          'Amazing dermatologist. Resolved my issue in 2 visits.',
          'Very knowledgeable and friendly.',
          'Highly skilled. Results were great.',
          'Excellent treatment, minor wait time.',
          'Best dermatologist in Islamabad.',
        ],
      },
      {
        doctorEmail: 'doctor6@mediassist.com',
        ratings: [5, 4, 5, 5, 4, 5],
        comments: [
          'Outstanding surgeon. My knee recovery was smooth.',
          'Very experienced orthopedic specialist.',
          'Explained all options before surgery. Excellent.',
          'Highly recommend for any joint issues.',
          'Good but fees are high.',
          'World-class orthopedic care.',
        ],
      },
    ]

    let reviewsCreated = 0

    for (const sample of sampleReviews) {
      const doctorRecord = doctorRecords.find((d) => d.email === sample.doctorEmail)
      if (!doctorRecord) continue

      for (let i = 0; i < sample.ratings.length; i++) {
        // Create a COMPLETED appointment with confirmedAt (simulates fast confirmation)
        const scheduledAt = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000) // weeks ago
        const createdAt = new Date(scheduledAt.getTime() - 3 * 24 * 60 * 60 * 1000)   // 3 days before scheduled
        const confirmedAt = new Date(createdAt.getTime() + (1 + i) * 60 * 60 * 1000)  // confirmed 1-N hours after booking
        const appointment = await prisma.appointment.create({
          data: {
            patientId,
            doctorId: doctorRecord.id,
            scheduledAt,
            duration: 30,
            status: 'COMPLETED',
            source: 'PATIENT_APP',
            confirmedAt,
          },
        })

        // Check if review already exists (idempotency on re-seed)
        const existingReview = await prisma.doctorReview.findUnique({
          where: { appointmentId: appointment.id },
        })
        if (!existingReview) {
          await prisma.doctorReview.create({
            data: {
              appointmentId: appointment.id,
              patientId,
              doctorId: doctorRecord.id,
              rating: sample.ratings[i],
              comment: sample.comments[i] ?? null,
            },
          })
          reviewsCreated++
        }
      }

      // Recalculate rating from reviews
      const agg = await prisma.doctorReview.aggregate({
        where: { doctorId: doctorRecord.id },
        _avg: { rating: true },
        _count: { rating: true },
      })
      await prisma.doctor.update({
        where: { id: doctorRecord.id },
        data: {
          rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
          reviewCount: agg._count.rating,
        },
      })
    }

    console.log(`✅ Created ${reviewsCreated} sample reviews with real rating recalculation`)

    // ---- Reliability demo: doctor4 (Usman Malik / Neurology) has 2 doctor-cancelled past appointments ----
    const doctor4Record = doctorRecords.find((d) => d.email === 'doctor4@mediassist.com')
    if (doctor4Record) {
      for (let i = 0; i < 2; i++) {
        await prisma.appointment.create({
          data: {
            patientId,
            doctorId: doctor4Record.id,
            scheduledAt: new Date(Date.now() - (i + 10) * 7 * 24 * 60 * 60 * 1000),
            duration: 30,
            status: 'CANCELLED',
            cancelledBy: 'DOCTOR',
            source: 'PATIENT_APP',
          },
        })
      }
      console.log('✅ Added 2 doctor-cancelled appointments for reliability demo (doctor4)')
    }
  }

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
