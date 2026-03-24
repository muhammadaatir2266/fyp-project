const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting centralized database seed...\n');

  // ==================== SPECIALTIES ====================
  console.log('📋 Creating specialties...');
  
  const specialties = [
    { name: 'Cardiology', description: 'Heart and cardiovascular system', iconName: 'heart' },
    { name: 'Dermatology', description: 'Skin, hair, and nails', iconName: 'skin' },
    { name: 'Neurology', description: 'Brain and nervous system', iconName: 'brain' },
    { name: 'Orthopedics', description: 'Bones, joints, and muscles', iconName: 'bone' },
    { name: 'Pediatrics', description: 'Children\'s health', iconName: 'baby' },
    { name: 'Psychiatry', description: 'Mental health', iconName: 'mind' },
    { name: 'General Medicine', description: 'General health and wellness', iconName: 'stethoscope' },
  ];

  const createdSpecialties = {};
  for (const spec of specialties) {
    const specialty = await prisma.specialty.upsert({
      where: { name: spec.name },
      update: {},
      create: spec
    });
    createdSpecialties[spec.name] = specialty;
    console.log(`  ✓ ${spec.name}`);
  }

  // ==================== ADMIN USER ====================
  console.log('\n👤 Creating admin user...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  const admin = await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      isSuperAdmin: true,
      isActive: true
    }
  });
  console.log('  ✓ Admin: admin@example.com / admin123');

  // ==================== DOCTOR USERS ====================
  console.log('\n👨‍⚕️ Creating doctor users...');
  
  const doctors = [
    {
      email: 'doctor@example.com',
      password: 'doctor123',
      firstName: 'John',
      lastName: 'Smith',
      specialty: 'Cardiology',
      phone: '+1234567891',
      address: '123 Medical Center',
      city: 'New York',
      qualifications: 'MD, FACC',
      experience: 15,
      rating: 4.8,
      consultationFee: 150,
      availableFrom: '09:00',
      availableTo: '17:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    {
      email: 'sarah.johnson@example.com',
      password: 'doctor123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      specialty: 'Dermatology',
      phone: '+1234567892',
      address: '456 Skin Clinic',
      city: 'Los Angeles',
      qualifications: 'MD, Board Certified',
      experience: 10,
      rating: 4.9,
      consultationFee: 120,
      availableFrom: '10:00',
      availableTo: '18:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    {
      email: 'michael.chen@example.com',
      password: 'doctor123',
      firstName: 'Michael',
      lastName: 'Chen',
      specialty: 'Neurology',
      phone: '+1234567893',
      address: '789 Brain Institute',
      city: 'Chicago',
      qualifications: 'MD, PhD',
      experience: 20,
      rating: 4.7,
      consultationFee: 200,
      availableFrom: '08:00',
      availableTo: '16:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday']
    }
  ];

  for (const doc of doctors) {
    const hashedPassword = await bcrypt.hash(doc.password, 10);
    const doctorUser = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        password: hashedPassword,
        role: 'DOCTOR'
      }
    });

    await prisma.doctor.upsert({
      where: { userId: doctorUser.id },
      update: {},
      create: {
        userId: doctorUser.id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        specialtyId: createdSpecialties[doc.specialty].id,
        phone: doc.phone,
        address: doc.address,
        city: doc.city,
        qualifications: doc.qualifications,
        experience: doc.experience,
        rating: doc.rating,
        consultationFee: doc.consultationFee,
        availableFrom: doc.availableFrom,
        availableTo: doc.availableTo,
        workingDays: doc.workingDays,
        isActive: true,
        isVerified: true
      }
    });
    console.log(`  ✓ Dr. ${doc.firstName} ${doc.lastName} (${doc.specialty})`);
  }

  // ==================== PATIENT USERS ====================
  console.log('\n🧑 Creating patient users...');
  
  const patients = [
    {
      email: 'patient@example.com',
      password: 'patient123',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+1234567894',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'FEMALE',
      city: 'New York'
    },
    {
      email: 'robert.williams@example.com',
      password: 'patient123',
      firstName: 'Robert',
      lastName: 'Williams',
      phone: '+1234567895',
      dateOfBirth: new Date('1985-08-22'),
      gender: 'MALE',
      city: 'Los Angeles'
    }
  ];

  for (const pat of patients) {
    const hashedPassword = await bcrypt.hash(pat.password, 10);
    const patientUser = await prisma.user.upsert({
      where: { email: pat.email },
      update: {},
      create: {
        email: pat.email,
        password: hashedPassword,
        role: 'PATIENT'
      }
    });

    await prisma.patient.upsert({
      where: { userId: patientUser.id },
      update: {},
      create: {
        userId: patientUser.id,
        firstName: pat.firstName,
        lastName: pat.lastName,
        phone: pat.phone,
        dateOfBirth: pat.dateOfBirth,
        gender: pat.gender,
        city: pat.city
      }
    });
    console.log(`  ✓ ${pat.firstName} ${pat.lastName}`);
  }

  console.log('\n✅ Centralized database seed completed successfully!\n');
  console.log('📝 Login Credentials:');
  console.log('   Admin:   admin@example.com / admin123');
  console.log('   Doctor:  doctor@example.com / doctor123');
  console.log('   Patient: patient@example.com / patient123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
