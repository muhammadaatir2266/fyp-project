import axios from 'axios'
import { getAuthToken } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export interface ChatResponse {
  success: boolean
  data: {
    message: string
    response?: string
    prediction?: any
    doctors?: any[]
  }
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
})

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const sendMessage = async (message: string, location?: string): Promise<ChatResponse> => {
  const response = await api.post('/chat/message', { message, location })
  return response.data
}
