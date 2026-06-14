import api from '@/services/api.service'

export interface PredictionItem {
  disease: string
  confidence: number
  specialty?: string
}

export interface ChatResponse {
  success: boolean
  sessionId?: string
  data: {
    message: string
    response?: string
    prediction?: PredictionItem[]
    symptoms?: string[]
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
