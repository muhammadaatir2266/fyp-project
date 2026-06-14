// Types and validation for the doctor onboarding wizard

export type DocumentType = 'MEDICAL_LICENSE' | 'DEGREE_CERTIFICATE' | 'GOVERNMENT_ID' | 'OTHER'

export interface UploadedDocument {
  type: DocumentType
  s3Key: string
  fileName: string
  mimeType: string
  fileSize: number
}

export interface WizardData {
  // Step 1 – Account
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string

  // Step 2 – Professional
  specialtyId: string
  licenseNumber: string
  experience: number
  qualifications: string

  // Step 3 – Practice
  clinicLocation: string
  address: string
  city: string
  consultationFee: string
  gender: string
  languages: string[]

  // Step 4 – Documents
  documents: UploadedDocument[]

  // Step 5 – Availability
  workingDays: string[]
  availableFrom: string
  availableTo: string
}

export const INITIAL_WIZARD_DATA: WizardData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  specialtyId: '',
  licenseNumber: '',
  experience: 0,
  qualifications: '',
  clinicLocation: '',
  address: '',
  city: '',
  consultationFee: '',
  gender: '',
  languages: [],
  documents: [],
  workingDays: [],
  availableFrom: '09:00',
  availableTo: '17:00',
}

export const LANGUAGE_OPTIONS = ['English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi']
export const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  MEDICAL_LICENSE: 'Medical License',
  DEGREE_CERTIFICATE: 'Degree Certificate',
  GOVERNMENT_ID: 'Government ID',
  OTHER: 'Other Document',
}

export const STEP_TITLES = [
  'Account',
  'Professional',
  'Practice',
  'Documents',
  'Availability',
  'Review',
]

// Per-step validation — returns an error message or null
export function validateStep(step: number, data: WizardData): string | null {
  switch (step) {
    case 0:
      if (!data.firstName.trim()) return 'First name is required'
      if (!data.lastName.trim()) return 'Last name is required'
      if (!data.email.includes('@')) return 'Valid email is required'
      if (!data.phone.trim()) return 'Phone number is required'
      if (data.password.length < 6) return 'Password must be at least 6 characters'
      if (data.password !== data.confirmPassword) return 'Passwords do not match'
      return null

    case 1:
      if (!data.specialtyId) return 'Specialty is required'
      if (!data.licenseNumber.trim()) return 'License number is required'
      return null

    case 2:
      if (!data.address.trim()) return 'Address is required'
      if (!data.city.trim()) return 'City is required'
      return null

    case 3:
      if (!data.documents.some((d) => d.type === 'MEDICAL_LICENSE')) {
        return 'Medical license document is required'
      }
      return null

    case 4:
      if (data.workingDays.length === 0) return 'Select at least one working day'
      return null

    case 5:
      return null // review step

    default:
      return null
  }
}
