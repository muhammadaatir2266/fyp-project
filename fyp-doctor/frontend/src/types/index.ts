export interface Doctor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialtyId: string;
  specialty?: Specialty;
  phone: string;
  address: string;
  city: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  languages?: string[];
  qualifications?: string;
  experience: number;
  rating: number;
  reviewCount: number;
  consultationFee?: number;
  availableFrom?: string;
  availableTo?: string;
  workingDays: string[];
  isActive: boolean;
  isVerified: boolean;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  iconName?: string;
}

export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  phone?: string;
  address?: string;
  city?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  scheduledAt: string;
  duration: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallLog {
  id: string;
  doctorId: string;
  doctor?: Doctor;
  callerName?: string;
  callerPhone: string;
  callType: "INCOMING" | "OUTGOING" | "MISSED" | "VOICEMAIL";
  status: "ACTIVE" | "COMPLETED" | "FAILED";
  startedAt: string;
  endedAt?: string;
  duration?: number;
  summary?: string;
  transcript?: string;
  vapiCallId?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  patientId: string;
  patient?: Patient;
  startedAt: string;
  endedAt?: string;
  messages?: ChatMessage[];
  predictions?: Prediction[];
}

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Prediction {
  id: string;
  chatSessionId: string;
  diseaseId: string;
  disease?: Disease;
  confidence: number;
  inputSymptoms: string[];
  createdAt: string;
}

export interface Disease {
  id: string;
  name: string;
  description?: string;
  precautions: string[];
  recommendedSpecialtyId?: string;
  recommendedSpecialty?: Specialty;
}

export interface PatientSymptom {
  id: string;
  patientId: string;
  symptomId: string;
  symptom?: Symptom;
  severity: number;
  duration?: string;
  notes?: string;
  reportedAt: string;
}

export interface Symptom {
  id: string;
  name: string;
  description?: string;
  severity: number;
}

export interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  totalPatients: number;
  recentCalls: number;
  aiActivity: number;
}
