const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Specialties
  const cardiology = await prisma.specialty.upsert({
    where: { name: 'Cardiology' },
    update: {},
    create: {
      name: 'Cardiology',
      description: 'Heart and cardiovascular system',
      iconName: 'heart'
    }
  });

  const neurology = await prisma.specialty.upsert({
    where: { name: 'Neurology' },
    update: {},
    create: {
      name: 'Neurology',
      description: 'Brain and nervous system',
      iconName: 'brain'
    }
  });

  const generalMedicine = await prisma.specialty.upsert({
    where: { name: 'General Medicine' },
    update: {},
    create: {
      name: 'General Medicine',
      description: 'General health and wellness',
      iconName: 'stethoscope'
    }
  });

  console.log('✅ Specialties created');

  // Create Doctor User
  const hashedPassword = await bcrypt.hash('doctor123', 10);

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@example.com' },
    update: {},
    create: {
      email: 'doctor@example.com',
      password: hashedPassword,
      role: 'DOCTOR'
    }
  });

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      firstName: 'John',
      lastName: 'Smith',
      specialtyId: cardiology.id,
      phone: '+1234567890',
      address: '123 Medical Center Drive',
      city: 'New York',
      qualifications: 'MBBS, MD (Cardiology)',
      experience: 10,
      rating: 4.8,
      reviewCount: 150,
      consultationFee: 150.00,
      availableFrom: '09:00',
      availableTo: '17:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isActive: true,
      isVerified: true
    }
  });

  console.log('✅ Doctor created');

  // Create Patient Users
  const patientPassword = await bcrypt.hash('patient123', 10);

  const patient1User = await prisma.user.upsert({
    where: { email: 'patient1@example.com' },
    update: {},
    create: {
      email: 'patient1@example.com',
      password: patientPassword,
      role: 'PATIENT'
    }
  });

  const patient1 = await prisma.patient.upsert({
    where: { userId: patient1User.id },
    update: {},
    create: {
      userId: patient1User.id,
      firstName: 'Alice',
      lastName: 'Johnson',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'FEMALE',
      phone: '+1234567891',
      address: '456 Oak Street',
      city: 'New York',
      emergencyContact: '+1234567892',
      medicalHistory: 'No major medical history',
      allergies: 'Penicillin'
    }
  });

  const patient2User = await prisma.user.upsert({
    where: { email: 'patient2@example.com' },
    update: {},
    create: {
      email: 'patient2@example.com',
      password: patientPassword,
      role: 'PATIENT'
    }
  });

  const patient2 = await prisma.patient.upsert({
    where: { userId: patient2User.id },
    update: {},
    create: {
      userId: patient2User.id,
      firstName: 'Bob',
      lastName: 'Williams',
      dateOfBirth: new Date('1985-08-22'),
      gender: 'MALE',
      phone: '+1234567893',
      address: '789 Pine Avenue',
      city: 'New York',
      emergencyContact: '+1234567894',
      medicalHistory: 'Hypertension',
      allergies: 'None'
    }
  });

  console.log('✅ Patients created');

  // Create Symptoms
  const headache = await prisma.symptom.upsert({
    where: { name: 'Headache' },
    update: {},
    create: {
      name: 'Headache',
      description: 'Pain in the head',
      severity: 3
    }
  });

  const fever = await prisma.symptom.upsert({
    where: { name: 'Fever' },
    update: {},
    create: {
      name: 'Fever',
      description: 'Elevated body temperature',
      severity: 4
    }
  });

  const cough = await prisma.symptom.upsert({
    where: { name: 'Cough' },
    update: {},
    create: {
      name: 'Cough',
      description: 'Persistent coughing',
      severity: 2
    }
  });

  console.log('✅ Symptoms created');

  // Create Diseases
  const flu = await prisma.disease.upsert({
    where: { name: 'Influenza' },
    update: {},
    create: {
      name: 'Influenza',
      description: 'Common flu virus',
      precautions: ['Rest', 'Hydration', 'Avoid contact with others'],
      recommendedSpecialtyId: generalMedicine.id
    }
  });

  const migraine = await prisma.disease.upsert({
    where: { name: 'Migraine' },
    update: {},
    create: {
      name: 'Migraine',
      description: 'Severe headache disorder',
      precautions: ['Avoid triggers', 'Rest in dark room', 'Medication'],
      recommendedSpecialtyId: neurology.id
    }
  });

  console.log('✅ Diseases created');

  // Create Appointments
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor.id,
      scheduledAt: new Date(today.setHours(10, 0, 0, 0)),
      duration: 30,
      status: 'CONFIRMED',
      reason: 'Regular checkup'
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor.id,
      scheduledAt: new Date(today.setHours(14, 0, 0, 0)),
      duration: 30,
      status: 'PENDING',
      reason: 'Follow-up consultation'
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor.id,
      scheduledAt: tomorrow,
      duration: 30,
      status: 'CONFIRMED',
      reason: 'Blood pressure check'
    }
  });

  console.log('✅ Appointments created');

  // Create Chat Session and Messages
  const chatSession = await prisma.chatSession.create({
    data: {
      patientId: patient1.id,
      startedAt: new Date()
    }
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        chatSessionId: chatSession.id,
        role: 'user',
        content: 'I have been experiencing severe headaches for the past 3 days.'
      },
      {
        chatSessionId: chatSession.id,
        role: 'assistant',
        content: 'I understand you are experiencing severe headaches. Can you describe the pain? Is it throbbing, sharp, or dull?'
      },
      {
        chatSessionId: chatSession.id,
        role: 'user',
        content: 'It is a throbbing pain on the left side of my head.'
      },
      {
        chatSessionId: chatSession.id,
        role: 'assistant',
        content: 'Based on your symptoms, this could be a migraine. I recommend consulting with a neurologist.'
      }
    ]
  });

  console.log('✅ Chat messages created');

  // Create Patient Symptoms
  await prisma.patientSymptom.create({
    data: {
      patientId: patient1.id,
      symptomId: headache.id,
      severity: 4,
      duration: '3 days',
      notes: 'Throbbing pain on left side',
      chatSessionId: chatSession.id
    }
  });

  await prisma.patientSymptom.create({
    data: {
      patientId: patient2.id,
      symptomId: fever.id,
      severity: 3,
      duration: '2 days',
      notes: 'Temperature around 101°F'
    }
  });

  console.log('✅ Patient symptoms created');

  // Create Predictions
  await prisma.prediction.create({
    data: {
      chatSessionId: chatSession.id,
      diseaseId: migraine.id,
      confidence: 85.5,
      inputSymptoms: ['Headache', 'Throbbing pain', 'Left side']
    }
  });

  console.log('✅ Predictions created');

  // Create Call Logs
  await prisma.callLog.createMany({
    data: [
      {
        doctorId: doctor.id,
        callerName: 'Alice Johnson',
        callerPhone: '+1234567891',
        callType: 'INCOMING',
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
        duration: 300,
        summary: 'Patient called regarding appointment confirmation and medication refill.',
        transcript: 'Doctor: Hello, this is Dr. Smith.\nPatient: Hi Doctor, I wanted to confirm my appointment tomorrow.\nDoctor: Yes, your appointment is confirmed for 10 AM.\nPatient: Thank you!'
      },
      {
        doctorId: doctor.id,
        callerName: 'Bob Williams',
        callerPhone: '+1234567893',
        callType: 'INCOMING',
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 3 * 60 * 1000),
        duration: 180,
        summary: 'Patient inquired about test results and follow-up care.',
        transcript: 'Doctor: Hello, Dr. Smith speaking.\nPatient: Hi, I am calling about my test results.\nDoctor: Your results look good. We will discuss them in detail during your next visit.'
      }
    ]
  });

  console.log('✅ Call logs created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📧 Login credentials:');
  console.log('Email: doctor@example.com');
  console.log('Password: doctor123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
