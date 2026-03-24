export interface Admin {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: Specialty;
  city: string;
  clinicLocation?: string;
  licenseNumber?: string;
  verificationDocument?: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  experience: number;
  rating: number;
  consultationFee?: number;
  availableFrom?: string;
  availableTo?: string;
  workingDays: string[];
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface Appointment {
  id: string;
  patient: Patient;
  doctor: Doctor;
  scheduledAt: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  source: 'PATIENT_APP' | 'CALLING_AGENT' | 'ADMIN_PANEL' | 'WALK_IN';
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  adminId: string;
  admin?: {
    firstName: string;
    lastName: string;
  };
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
  _count?: {
    apiLogs: number;
  };
}

export interface ApiLog {
  id: string;
  tokenId: string;
  token?: ApiToken;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: string;
  responseBody?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalDoctors: number;
  activeDoctors: number;
  pendingDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  pendingAppointments: number;
  todayAppointments: number;
  activeApiTokens: number;
  totalApiCalls: number;
  todayApiCalls: number;
  apiCallsToday: number;
}
