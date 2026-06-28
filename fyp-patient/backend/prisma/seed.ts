import { PrismaClient, UserRole, DoctorVerificationStatus, Gender } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { join } from 'path'

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Seed script must not run in production. Aborting.')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // ---- Specialties (canonical list from data/specialties.json) ----
  const specialtyData: Array<{ name: string; description: string; iconName: string; aliases: string[] }> =
    JSON.parse(readFileSync(join(__dirname, '../data/specialties.json'), 'utf-8'))

  const specialties: Record<string, { id: string; name: string }> = {}
  for (const s of specialtyData) {
    const sp = await prisma.specialty.upsert({
      where: { name: s.name },
      update: { description: s.description, iconName: s.iconName, aliases: s.aliases },
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
  // City centroids: Karachi(24.8607,67.0011) Lahore(31.5204,74.3587) Islamabad(33.6844,73.0479)
  //                 Peshawar(34.0150,71.5249) Quetta(30.1798,66.9750) Multan(30.1978,71.4711)
  //                 Faisalabad(31.4504,73.1350)
  const demoDocInfo = [
    // ── Cardiology ──────────────────────────────────────────────────────
    {
      email: 'doctor@mediassist.com',
      firstName: 'Sarah', lastName: 'Johnson',
      specialty: 'Cardiology', city: 'Karachi',
      phone: '+92-21-3456789', address: '123 Medical Center Drive, Saddar',
      qualifications: 'MD, FACC — Board Certified Cardiologist',
      experience: 15, consultationFee: 2000,
      latitude: 24.8607 + 0.010, longitude: 67.0011 + 0.005,
      gender: Gender.FEMALE, languages: ['English', 'Urdu'],
    },
    {
      email: 'doctor37@mediassist.com',
      firstName: 'Shahid', lastName: 'Pervaiz',
      specialty: 'Cardiology', city: 'Multan',
      phone: '+92-61-4512367', address: '12 Nishtar Road, Multan',
      qualifications: 'MBBS, FCPS — Cardiologist',
      experience: 11, consultationFee: 1800,
      latitude: 30.1978 + 0.008, longitude: 71.4711 - 0.006,
      gender: Gender.MALE, languages: ['Urdu', 'Punjabi', 'Saraiki'],
    },
    {
      email: 'doctor38b@mediassist.com',
      firstName: 'Aisha', lastName: 'Raza',
      specialty: 'Cardiology', city: 'Lahore',
      phone: '+92-42-3571234', address: '88 Canal Bank Road, Lahore',
      qualifications: 'MBBS, MRCP — Consultant Cardiologist',
      experience: 9, consultationFee: 2200,
      latitude: 31.5204 + 0.014, longitude: 74.3587 + 0.009,
      gender: Gender.FEMALE, languages: ['English', 'Urdu', 'Punjabi'],
    },
    // ── General Medicine ─────────────────────────────────────────────────
    {
      email: 'doctor2@mediassist.com',
      firstName: 'Ali', lastName: 'Hassan',
      specialty: 'General Medicine', city: 'Lahore',
      phone: '+92-42-1234567', address: '45 Gulberg III, Lahore',
      qualifications: 'MBBS, FCPS — General Physician',
      experience: 8, consultationFee: 1500,
      latitude: 31.5204 + 0.020, longitude: 74.3587 - 0.012,
      gender: Gender.MALE, languages: ['English', 'Urdu', 'Punjabi'],
    },
    {
      email: 'doctor35@mediassist.com',
      firstName: 'Arif', lastName: 'Khan',
      specialty: 'General Medicine', city: 'Peshawar',
      phone: '+92-91-5276543', address: '7 University Road, Peshawar',
      qualifications: 'MBBS, FCPS — General Physician',
      experience: 13, consultationFee: 1200,
      latitude: 34.0150 - 0.010, longitude: 71.5249 + 0.008,
      gender: Gender.MALE, languages: ['Urdu', 'Pashto', 'English'],
    },
    {
      email: 'doctor35b@mediassist.com',
      firstName: 'Mariam', lastName: 'Yousuf',
      specialty: 'General Medicine', city: 'Faisalabad',
      phone: '+92-41-8823456', address: '21 Peoples Colony, Faisalabad',
      qualifications: 'MBBS — General Practitioner',
      experience: 6, consultationFee: 1000,
      latitude: 31.4504 + 0.011, longitude: 73.1350 - 0.007,
      gender: Gender.FEMALE, languages: ['Urdu', 'Punjabi'],
    },
    // ── Dermatology ──────────────────────────────────────────────────────
    {
      email: 'doctor3@mediassist.com',
      firstName: 'Fatima', lastName: 'Sheikh',
      specialty: 'Dermatology', city: 'Islamabad',
      phone: '+92-51-9876543', address: '78 F-7 Markaz, Islamabad',
      qualifications: 'MBBS, FCPS — Dermatologist',
      experience: 10, consultationFee: 2500,
      latitude: 33.6844 - 0.008, longitude: 73.0479 + 0.015,
      gender: Gender.FEMALE, languages: ['English', 'Urdu', 'Punjabi'],
    },
    {
      email: 'doctor39@mediassist.com',
      firstName: 'Gulnaz', lastName: 'Akhtar',
      specialty: 'Dermatology', city: 'Quetta',
      phone: '+92-81-2834561', address: '5 Jinnah Road, Quetta',
      qualifications: 'MBBS, MCPS — Skin Specialist',
      experience: 7, consultationFee: 1400,
      latitude: 30.1798 + 0.005, longitude: 66.9750 - 0.009,
      gender: Gender.FEMALE, languages: ['Urdu', 'Balochi', 'Pashto'],
    },
    {
      email: 'doctor39b@mediassist.com',
      firstName: 'Kamil', lastName: 'Sohail',
      specialty: 'Dermatology', city: 'Karachi',
      phone: '+92-21-3562981', address: '19 Tariq Road, PECHS',
      qualifications: 'MBBS, FCPS — Dermatologist',
      experience: 12, consultationFee: 2800,
      latitude: 24.8607 - 0.018, longitude: 67.0011 - 0.012,
      gender: Gender.MALE, languages: ['English', 'Urdu', 'Sindhi'],
    },
    // ── Neurology ────────────────────────────────────────────────────────
    {
      email: 'doctor4@mediassist.com',
      firstName: 'Usman', lastName: 'Malik',
      specialty: 'Neurology', city: 'Karachi',
      phone: '+92-21-8765432', address: '22 Clifton Block 4, Karachi',
      qualifications: 'MD, Neurology — Aga Khan Hospital',
      experience: 12, consultationFee: 3000,
      latitude: 24.8607 - 0.015, longitude: 67.0011 + 0.020,
      gender: Gender.MALE, languages: ['English', 'Urdu', 'Sindhi'],
    },
    {
      email: 'doctor40@mediassist.com',
      firstName: 'Farrukh', lastName: 'Niaz',
      specialty: 'Neurology', city: 'Faisalabad',
      phone: '+92-41-8741235', address: '3 Satiana Road, Faisalabad',
      qualifications: 'MBBS, FCPS — Neurologist',
      experience: 10, consultationFee: 2600,
      latitude: 31.4504 - 0.009, longitude: 73.1350 + 0.013,
      gender: Gender.MALE, languages: ['Urdu', 'Punjabi'],
    },
    {
      email: 'doctor40b@mediassist.com',
      firstName: 'Sana', lastName: 'Chaudhry',
      specialty: 'Neurology', city: 'Lahore',
      phone: '+92-42-3589012', address: '34 Johar Town, Lahore',
      qualifications: 'MBBS, FRCP — Consultant Neurologist',
      experience: 14, consultationFee: 3200,
      latitude: 31.5204 - 0.018, longitude: 74.3587 - 0.020,
      gender: Gender.FEMALE, languages: ['English', 'Urdu', 'Punjabi'],
    },
    // ── Pediatrics ───────────────────────────────────────────────────────
    {
      email: 'doctor5@mediassist.com',
      firstName: 'Ayesha', lastName: 'Qureshi',
      specialty: 'Pediatrics', city: 'Lahore',
      phone: '+92-42-5678901', address: '10 DHA Phase 5, Lahore',
      qualifications: 'MBBS, DCH — Pediatrician',
      experience: 7, consultationFee: 1800,
      latitude: 31.5204 - 0.025, longitude: 74.3587 + 0.018,
      gender: Gender.FEMALE, languages: ['Urdu', 'Punjabi'],
    },
    {
      email: 'doctor36@mediassist.com',
      firstName: 'Madiha', lastName: 'Chaudry',
      specialty: 'Pediatrics', city: 'Faisalabad',
      phone: '+92-41-8654321', address: '66 Kohinoor City, Faisalabad',
      qualifications: 'MBBS, FCPS — Child Specialist',
      experience: 9, consultationFee: 1600,
      latitude: 31.4504 + 0.015, longitude: 73.1350 + 0.006,
      gender: Gender.FEMALE, languages: ['Urdu', 'Punjabi'],
    },
    {
      email: 'doctor36b@mediassist.com',
      firstName: 'Qasim', lastName: 'Baig',
      specialty: 'Pediatrics', city: 'Islamabad',
      phone: '+92-51-2876543', address: '14 G-11 Markaz, Islamabad',
      qualifications: 'MBBS, MCPS — Pediatrician',
      experience: 5, consultationFee: 1500,
      latitude: 33.6844 + 0.017, longitude: 73.0479 + 0.011,
      gender: Gender.MALE, languages: ['English', 'Urdu'],
    },
    // ── Orthopedics ──────────────────────────────────────────────────────
    {
      email: 'doctor6@mediassist.com',
      firstName: 'Imran', lastName: 'Khan',
      specialty: 'Orthopedics', city: 'Islamabad',
      phone: '+92-51-3214567', address: '33 Blue Area, Islamabad',
      qualifications: 'MBBS, FRCS — Orthopedic Surgeon',
      experience: 18, consultationFee: 3500,
      latitude: 33.6844 + 0.012, longitude: 73.0479 - 0.010,
      gender: Gender.MALE, languages: ['English', 'Urdu', 'Pashto'],
    },
    {
      email: 'doctor38@mediassist.com',
      firstName: 'Zia', lastName: 'ur Rehman',
      specialty: 'Orthopedics', city: 'Peshawar',
      phone: '+92-91-5287654', address: '18 Ring Road, Peshawar',
      qualifications: 'MBBS, FCPS — Orthopedic Surgeon',
      experience: 14, consultationFee: 2800,
      latitude: 34.0150 + 0.013, longitude: 71.5249 - 0.011,
      gender: Gender.MALE, languages: ['Pashto', 'Urdu', 'English'],
    },
    {
      email: 'doctor38c@mediassist.com',
      firstName: 'Zainab', lastName: 'Nawaz',
      specialty: 'Orthopedics', city: 'Karachi',
      phone: '+92-21-3459012', address: '5 Shaheed-e-Millat Road, Karachi',
      qualifications: 'MBBS, FCPS — Bone & Joint Specialist',
      experience: 8, consultationFee: 2400,
      latitude: 24.8607 + 0.022, longitude: 67.0011 + 0.016,
      gender: Gender.FEMALE, languages: ['Urdu', 'Sindhi', 'English'],
    },
    // ── Gastroenterology ─────────────────────────────────────────────────
    {
      email: 'doctor7@mediassist.com',
      firstName: 'Nadia', lastName: 'Ahmed',
      specialty: 'Gastroenterology', city: 'Karachi',
      phone: '+92-21-2233445', address: '56 PECHS Block 2, Karachi',
      qualifications: 'MBBS, FCPS — Gastroenterologist',
      experience: 9, consultationFee: 2200,
      latitude: 24.8607 + 0.025, longitude: 67.0011 - 0.018,
      gender: Gender.FEMALE, languages: ['English', 'Urdu', 'Balochi'],
    },
    {
      email: 'doctor7b@mediassist.com',
      firstName: 'Tariq', lastName: 'Mehmood',
      specialty: 'Gastroenterology', city: 'Lahore',
      phone: '+92-42-3572345', address: '9 MM Alam Road, Gulberg, Lahore',
      qualifications: 'MBBS, FCPS — GI Specialist',
      experience: 11, consultationFee: 2400,
      latitude: 31.5204 + 0.009, longitude: 74.3587 - 0.022,
      gender: Gender.MALE, languages: ['Urdu', 'Punjabi', 'English'],
    },
    // ── Psychiatry ───────────────────────────────────────────────────────
    {
      email: 'doctor8@mediassist.com',
      firstName: 'Hassan', lastName: 'Mirza',
      specialty: 'Psychiatry', city: 'Karachi',
      phone: '+92-21-3576890', address: '77 Clifton Block 5, Karachi',
      qualifications: 'MBBS, FCPS — Psychiatrist',
      experience: 13, consultationFee: 3000,
      latitude: 24.8607 - 0.008, longitude: 67.0011 - 0.025,
      gender: Gender.MALE, languages: ['English', 'Urdu'],
    },
    {
      email: 'doctor9@mediassist.com',
      firstName: 'Sana', lastName: 'Rizvi',
      specialty: 'Psychiatry', city: 'Lahore',
      phone: '+92-42-3591234', address: '3 Cavalry Ground, Lahore',
      qualifications: 'MBBS, MRCPsych — Consultant Psychiatrist',
      experience: 10, consultationFee: 2800,
      latitude: 31.5204 + 0.030, longitude: 74.3587 + 0.025,
      gender: Gender.FEMALE, languages: ['English', 'Urdu', 'Punjabi'],
    },
    {
      email: 'doctor9b@mediassist.com',
      firstName: 'Adeel', lastName: 'Jaffri',
      specialty: 'Psychiatry', city: 'Islamabad',
      phone: '+92-51-2891234', address: '22 F-8 Markaz, Islamabad',
      qualifications: 'MBBS, FCPS — Mental Health Specialist',
      experience: 8, consultationFee: 2600,
      latitude: 33.6844 - 0.020, longitude: 73.0479 - 0.018,
      gender: Gender.MALE, languages: ['English', 'Urdu'],
    },
    // ── Pulmonology ──────────────────────────────────────────────────────
    {
      email: 'doctor10@mediassist.com',
      firstName: 'Tariq', lastName: 'Butt',
      specialty: 'Pulmonology', city: 'Karachi',
      phone: '+92-21-3589023', address: '14 North Nazimabad Block H, Karachi',
      qualifications: 'MBBS, FCPS — Pulmonologist',
      experience: 11, consultationFee: 2400,
      latitude: 24.8607 + 0.030, longitude: 67.0011 + 0.028,
      gender: Gender.MALE, languages: ['English', 'Urdu', 'Sindhi'],
    },
    {
      email: 'doctor11@mediassist.com',
      firstName: 'Mehreen', lastName: 'Akhtar',
      specialty: 'Pulmonology', city: 'Islamabad',
      phone: '+92-51-2834567', address: '19 G-8 Markaz, Islamabad',
      qualifications: 'MBBS, FCPS — Chest & Lung Specialist',
      experience: 8, consultationFee: 2200,
      latitude: 33.6844 - 0.025, longitude: 73.0479 + 0.022,
      gender: Gender.FEMALE, languages: ['English', 'Urdu'],
    },
    {
      email: 'doctor11b@mediassist.com',
      firstName: 'Bilal', lastName: 'Shah',
      specialty: 'Pulmonology', city: 'Peshawar',
      phone: '+92-91-5267890', address: '31 Hayatabad Phase 4, Peshawar',
      qualifications: 'MBBS, DTCD — Respiratory Specialist',
      experience: 9, consultationFee: 1800,
      latitude: 34.0150 - 0.018, longitude: 71.5249 + 0.020,
      gender: Gender.MALE, languages: ['Pashto', 'Urdu', 'English'],
    },
    // ── ENT ──────────────────────────────────────────────────────────────
    {
      email: 'doctor12@mediassist.com',
      firstName: 'Kamran', lastName: 'Siddiqui',
      specialty: 'ENT', city: 'Lahore',
      phone: '+92-42-3598765', address: '88 Ferozepur Road, Lahore',
      qualifications: 'MBBS, FCPS — ENT Specialist',
      experience: 12, consultationFee: 2000,
      latitude: 31.5204 - 0.012, longitude: 74.3587 + 0.030,
      gender: Gender.MALE, languages: ['Urdu', 'Punjabi', 'English'],
    },
    {
      email: 'doctor13@mediassist.com',
      firstName: 'Zara', lastName: 'Hussain',
      specialty: 'ENT', city: 'Karachi',
      phone: '+92-21-2245678', address: '5 Bahadurabad, Karachi',
      qualifications: 'MBBS, FCPS — Otolaryngologist',
      experience: 7, consultationFee: 1800,
      latitude: 24.8607 + 0.018, longitude: 67.0011 + 0.030,
      gender: Gender.FEMALE, languages: ['English', 'Urdu', 'Sindhi'],
    },
    {
      email: 'doctor13b@mediassist.com',
      firstName: 'Naveed', lastName: 'Alam',
      specialty: 'ENT', city: 'Multan',
      phone: '+92-61-4591234', address: '8 Bosan Road, Multan',
      qualifications: 'MBBS, MCPS — Ear Nose Throat Specialist',
      experience: 6, consultationFee: 1500,
      latitude: 30.1978 - 0.012, longitude: 71.4711 + 0.015,
      gender: Gender.MALE, languages: ['Urdu', 'Saraiki', 'Punjabi'],
    },
    // ── Urology ──────────────────────────────────────────────────────────
    {
      email: 'doctor14@mediassist.com',
      firstName: 'Fawad', lastName: 'Chaudhry',
      specialty: 'Urology', city: 'Islamabad',
      phone: '+92-51-2867543', address: '11 F-10 Markaz, Islamabad',
      qualifications: 'MBBS, FCPS — Urologist',
      experience: 14, consultationFee: 3000,
      latitude: 33.6844 + 0.022, longitude: 73.0479 + 0.028,
      gender: Gender.MALE, languages: ['English', 'Urdu'],
    },
    {
      email: 'doctor15@mediassist.com',
      firstName: 'Bilal', lastName: 'Ansari',
      specialty: 'Urology', city: 'Karachi',
      phone: '+92-21-3512345', address: '30 Gulshan-e-Iqbal Block 13, Karachi',
      qualifications: 'MBBS, FRCS (Urol) — Consultant Urologist',
      experience: 10, consultationFee: 2800,
      latitude: 24.8607 - 0.022, longitude: 67.0011 - 0.030,
      gender: Gender.MALE, languages: ['English', 'Urdu', 'Sindhi'],
    },
    // ── Ophthalmology ────────────────────────────────────────────────────
    {
      email: 'doctor16@mediassist.com',
      firstName: 'Asma', lastName: 'Waqar',
      specialty: 'Ophthalmology', city: 'Lahore',
      phone: '+92-42-3576543', address: '62 Garden Town, Lahore',
      qualifications: 'MBBS, FCPS — Ophthalmologist',
      experience: 9, consultationFee: 2000,
      latitude: 31.5204 + 0.025, longitude: 74.3587 - 0.028,
      gender: Gender.FEMALE, languages: ['Urdu', 'Punjabi', 'English'],
    },
    {
      email: 'doctor17@mediassist.com',
      firstName: 'Javed', lastName: 'Iqbal',
      specialty: 'Ophthalmology', city: 'Karachi',
      phone: '+92-21-3598765', address: '9 Karsaz Road, Karachi',
      qualifications: 'MBBS, DOMS — Eye Specialist',
      experience: 16, consultationFee: 2200,
      latitude: 24.8607 + 0.005, longitude: 67.0011 - 0.005,
      gender: Gender.MALE, languages: ['English', 'Urdu', 'Sindhi'],
    },
    {
      email: 'doctor17b@mediassist.com',
      firstName: 'Rabia', lastName: 'Zafar',
      specialty: 'Ophthalmology', city: 'Quetta',
      phone: '+92-81-2845678', address: '3 Shara-e-Iqbal, Quetta',
      qualifications: 'MBBS, FCPS — Eye Surgeon',
      experience: 7, consultationFee: 1600,
      latitude: 30.1798 - 0.015, longitude: 66.9750 + 0.012,
      gender: Gender.FEMALE, languages: ['Urdu', 'Balochi', 'Brahui'],
    },
    // ── Obstetrics & Gynecology ──────────────────────────────────────────
    {
      email: 'doctor18@mediassist.com',
      firstName: 'Rabia', lastName: 'Nawaz',
      specialty: 'Obstetrics & Gynecology', city: 'Karachi',
      phone: '+92-21-3578901', address: '44 Nazimabad Block 3, Karachi',
      qualifications: 'MBBS, FCPS — OB-GYN Specialist',
      experience: 12, consultationFee: 2500,
      latitude: 24.8607 - 0.028, longitude: 67.0011 + 0.010,
      gender: Gender.FEMALE, languages: ['Urdu', 'Sindhi', 'English'],
    },
    {
      email: 'doctor19@mediassist.com',
      firstName: 'Hina', lastName: 'Shah',
      specialty: 'Obstetrics & Gynecology', city: 'Lahore',
      phone: '+92-42-3512678', address: '18 Model Town, Lahore',
      qualifications: 'MBBS, FCPS — Gynecologist & Obstetrician',
      experience: 15, consultationFee: 2800,
      latitude: 31.5204 - 0.030, longitude: 74.3587 - 0.016,
      gender: Gender.FEMALE, languages: ['Urdu', 'Punjabi', 'English'],
    },
    {
      email: 'doctor20@mediassist.com',
      firstName: 'Naila', lastName: 'Rashid',
      specialty: 'Obstetrics & Gynecology', city: 'Islamabad',
      phone: '+92-51-2891567', address: '7 E-7 Markaz, Islamabad',
      qualifications: 'MBBS, MRCOG — Women\'s Health Specialist',
      experience: 11, consultationFee: 3000,
      latitude: 33.6844 - 0.014, longitude: 73.0479 - 0.020,
      gender: Gender.FEMALE, languages: ['English', 'Urdu'],
    },
    // ── Endocrinology ────────────────────────────────────────────────────
    {
      email: 'doctor21@mediassist.com',
      firstName: 'Salman', lastName: 'Ghani',
      specialty: 'Endocrinology', city: 'Karachi',
      phone: '+92-21-3521234', address: '11 KDA Scheme 1, Karachi',
      qualifications: 'MBBS, FCPS — Diabetes & Endocrine Specialist',
      experience: 13, consultationFee: 2600,
      latitude: 24.8607 + 0.015, longitude: 67.0011 - 0.022,
      gender: Gender.MALE, languages: ['English', 'Urdu', 'Sindhi'],
    },
    {
      email: 'doctor22@mediassist.com',
      firstName: 'Amna', lastName: 'Farooq',
      specialty: 'Endocrinology', city: 'Lahore',
      phone: '+92-42-3589456', address: '25 Shadman Colony, Lahore',
      qualifications: 'MBBS, FCPS — Endocrinologist',
      experience: 10, consultationFee: 2400,
      latitude: 31.5204 + 0.018, longitude: 74.3587 + 0.020,
      gender: Gender.FEMALE, languages: ['Urdu', 'Punjabi', 'English'],
    },
    // ── Nephrology ───────────────────────────────────────────────────────
    {
      email: 'doctor23@mediassist.com',
      firstName: 'Raza', lastName: 'Ali',
      specialty: 'Nephrology', city: 'Islamabad',
      phone: '+92-51-2867890', address: '5 G-9 Markaz, Islamabad',
      qualifications: 'MBBS, FCPS — Consultant Nephrologist',
      experience: 15, consultationFee: 3200,
      latitude: 33.6844 + 0.028, longitude: 73.0479 - 0.025,
      gender: Gender.MALE, languages: ['English', 'Urdu'],
    },
    {
      email: 'doctor24@mediassist.com',
      firstName: 'Sadia', lastName: 'Mehmood',
      specialty: 'Nephrology', city: 'Karachi',
      phone: '+92-21-3567234', address: '8 Gulshan Block 7, Karachi',
      qualifications: 'MBBS, FCPS — Kidney Specialist',
      experience: 9, consultationFee: 2800,
      latitude: 24.8607 - 0.030, longitude: 67.0011 + 0.025,
      gender: Gender.FEMALE, languages: ['English', 'Urdu', 'Balochi'],
    },
    // ── Oncology ─────────────────────────────────────────────────────────
    {
      email: 'doctor25@mediassist.com',
      firstName: 'Khalid', lastName: 'Rehman',
      specialty: 'Oncology', city: 'Karachi',
      phone: '+92-21-3578234', address: '1 Jinnah Postgraduate Medical Centre, Karachi',
      qualifications: 'MBBS, FCPS — Medical Oncologist',
      experience: 20, consultationFee: 4000,
      latitude: 24.8607 + 0.007, longitude: 67.0011 + 0.035,
      gender: Gender.MALE, languages: ['English', 'Urdu'],
    },
    {
      email: 'doctor26@mediassist.com',
      firstName: 'Fareeha', lastName: 'Zaidi',
      specialty: 'Oncology', city: 'Lahore',
      phone: '+92-42-3565432', address: '22 New Garden Town, Lahore',
      qualifications: 'MBBS, MRCP — Cancer Specialist',
      experience: 16, consultationFee: 3800,
      latitude: 31.5204 - 0.020, longitude: 74.3587 + 0.035,
      gender: Gender.FEMALE, languages: ['English', 'Urdu', 'Punjabi'],
    },
    // ── Rheumatology ─────────────────────────────────────────────────────
    {
      email: 'doctor27@mediassist.com',
      firstName: 'Adnan', lastName: 'Bashir',
      specialty: 'Rheumatology', city: 'Islamabad',
      phone: '+92-51-2879012', address: '14 F-6 Markaz, Islamabad',
      qualifications: 'MBBS, FCPS — Rheumatologist',
      experience: 12, consultationFee: 3000,
      latitude: 33.6844 + 0.005, longitude: 73.0479 + 0.005,
      gender: Gender.MALE, languages: ['English', 'Urdu'],
    },
    {
      email: 'doctor28@mediassist.com',
      firstName: 'Tahira', lastName: 'Malik',
      specialty: 'Rheumatology', city: 'Karachi',
      phone: '+92-21-3545678', address: '67 Bahadurabad Block 3, Karachi',
      qualifications: 'MBBS, FCPS — Arthritis & Autoimmune Specialist',
      experience: 8, consultationFee: 2600,
      latitude: 24.8607 - 0.005, longitude: 67.0011 - 0.040,
      gender: Gender.FEMALE, languages: ['Urdu', 'Sindhi', 'English'],
    },
    // ── Hematology ───────────────────────────────────────────────────────
    {
      email: 'doctor29@mediassist.com',
      firstName: 'Waseem', lastName: 'Ahmad',
      specialty: 'Hematology', city: 'Lahore',
      phone: '+92-42-3512890', address: '9 Davis Road, Lahore',
      qualifications: 'MBBS, FCPS — Hematologist',
      experience: 14, consultationFee: 3200,
      latitude: 31.5204 + 0.035, longitude: 74.3587 - 0.030,
      gender: Gender.MALE, languages: ['Urdu', 'Punjabi', 'English'],
    },
    {
      email: 'doctor30@mediassist.com',
      firstName: 'Noor', lastName: 'Fatima',
      specialty: 'Hematology', city: 'Karachi',
      phone: '+92-21-3512367', address: '3 Liaquat National Hospital Road, Karachi',
      qualifications: 'MBBS, FCPS — Blood Specialist',
      experience: 10, consultationFee: 2800,
      latitude: 24.8607 + 0.035, longitude: 67.0011 - 0.008,
      gender: Gender.FEMALE, languages: ['English', 'Urdu'],
    },
    // ── Infectious Disease ───────────────────────────────────────────────
    {
      email: 'doctor31@mediassist.com',
      firstName: 'Zulfiqar', lastName: 'Shah',
      specialty: 'Infectious Disease', city: 'Karachi',
      phone: '+92-21-3591234', address: '44 Soldier Bazar, Karachi',
      qualifications: 'MBBS, FCPS — Infectious Disease Specialist',
      experience: 11, consultationFee: 2400,
      latitude: 24.8607 - 0.035, longitude: 67.0011 + 0.040,
      gender: Gender.MALE, languages: ['Urdu', 'Sindhi', 'English'],
    },
    {
      email: 'doctor32@mediassist.com',
      firstName: 'Beenish', lastName: 'Omer',
      specialty: 'Infectious Disease', city: 'Islamabad',
      phone: '+92-51-2812345', address: '7 H-8 Markaz, Islamabad',
      qualifications: 'MBBS, FCPS — Infection Control Specialist',
      experience: 8, consultationFee: 2200,
      latitude: 33.6844 - 0.030, longitude: 73.0479 + 0.035,
      gender: Gender.FEMALE, languages: ['English', 'Urdu'],
    },
    // ── General Surgery ──────────────────────────────────────────────────
    {
      email: 'doctor33@mediassist.com',
      firstName: 'Mohsin', lastName: 'Baig',
      specialty: 'General Surgery', city: 'Lahore',
      phone: '+92-42-3578234', address: '76 Jail Road, Lahore',
      qualifications: 'MBBS, FRCS — General Surgeon',
      experience: 17, consultationFee: 3500,
      latitude: 31.5204 - 0.035, longitude: 74.3587 - 0.035,
      gender: Gender.MALE, languages: ['Urdu', 'Punjabi', 'English'],
    },
    {
      email: 'doctor34@mediassist.com',
      firstName: 'Shazia', lastName: 'Rauf',
      specialty: 'General Surgery', city: 'Karachi',
      phone: '+92-21-3534567', address: '22 Korangi Road, Karachi',
      qualifications: 'MBBS, FCPS — Consultant Surgeon',
      experience: 13, consultationFee: 3200,
      latitude: 24.8607 + 0.040, longitude: 67.0011 + 0.040,
      gender: Gender.FEMALE, languages: ['Urdu', 'Sindhi', 'English'],
    },
    {
      email: 'doctor34b@mediassist.com',
      firstName: 'Imtiaz', lastName: 'Gul',
      specialty: 'General Surgery', city: 'Peshawar',
      phone: '+92-91-5298765', address: '4 Warsak Road, Peshawar',
      qualifications: 'MBBS, FRCS — Surgical Specialist',
      experience: 16, consultationFee: 3000,
      latitude: 34.0150 + 0.020, longitude: 71.5249 - 0.018,
      gender: Gender.MALE, languages: ['Pashto', 'Urdu', 'English'],
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
  console.log(`✅ Seeded ${demoDocInfo.length} demo doctors across all specialties (all APPROVED & active)`)

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
