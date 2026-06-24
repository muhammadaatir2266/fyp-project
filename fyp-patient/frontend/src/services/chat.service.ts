import api from '@/services/api.service'

export interface PredictionItem {
  disease: string
  confidence: number
  specialty?: string
}

export interface InternalDoctorItem {
  source: 'internal_db'
  id: string
  name: string
  specialty: string
  city: string
  rating: number
  experience: number
  consultationFee: number
  workingHours?: { from: string; to: string }
  workingDays?: string[]
}

export interface GoogleDoctorItem {
  source: 'google_maps'
  name: string
  rating: number
  totalReviews?: number
  address?: string
  location?: { lat: number; lng: number }
  googleMapsUrl?: string
}

export type RecommendedDoctorItem = InternalDoctorItem | GoogleDoctorItem

export interface DoctorRecommendations {
  source: 'internal_db' | 'google_maps'
  doctors: RecommendedDoctorItem[]
}

export interface ChatResponse {
  success: boolean
  sessionId?: string
  data: {
    message: string
    response?: string
    prediction?: PredictionItem[]
    symptoms?: string[]
    doctorRecommendations?: DoctorRecommendations
  }
}

export const sendMessage = async (
  message: string,
  location?: string,
  sessionId?: string
): Promise<ChatResponse> => {
  const response = await api.post('/chat/message', {
    message,
    ...(location && { location }),
    ...(sessionId && { sessionId }),
  })
  return response.data
}
