import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export type UserRole = 'PATIENT'

export interface User {
  id: string
  email: string
  role: UserRole
  patient?: {
    id: string
    firstName: string
    lastName: string
    phone?: string
    dateOfBirth?: Date
    gender?: string
  }
}

export interface Specialty {
  id: string
  name: string
  description?: string
  iconName?: string
}

export interface AuthResponse {
  token: string
  user: User
  message?: string
}

// Create axios instance with interceptor
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

// Login
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password })
  const { token, user } = response.data
  
  // Store token and user
  setAuthToken(token)
  setCurrentUser(user)
  
  return response.data
}

// Signup
export const signup = async (data: {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'PATIENT'
  phone?: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/signup', data)
  const { token, user } = response.data
  
  // Store token and user
  setAuthToken(token)
  setCurrentUser(user)
  
  return response.data
}

// Get specialties
export const getSpecialties = async (): Promise<Specialty[]> => {
  const response = await api.get('/auth/specialties')
  return response.data.specialties
}

// Get current user from backend
export const fetchCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me')
  const user = response.data.user
  setCurrentUser(user)
  return user
}

// Store auth token in localStorage and cookies
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token)
    // Set cookie for middleware
    document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Lax`
  }
}

// Get auth token from localStorage or cookies
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken')
  }
  return null
}

// Store user in localStorage and cookies
export const setCurrentUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user))
    // Set role cookie for middleware
    document.cookie = `userRole=${user.role}; path=/; max-age=86400; SameSite=Lax`
  }
}

// Get current user from localStorage
export const getCurrentUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('currentUser')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

// Logout user
export const logoutUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
    // Clear cookies
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}

// Check if user has specific role
export const hasRole = (user: User | null, role: UserRole): boolean => {
  return user?.role === role
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}
