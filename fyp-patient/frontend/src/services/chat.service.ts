import api from '@/services/api.service'

export interface ChatResponse {
  success: boolean
  sessionId?: string
  data: {
    message: string
    response?: string
    prediction?: any
    doctors?: any[]
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
