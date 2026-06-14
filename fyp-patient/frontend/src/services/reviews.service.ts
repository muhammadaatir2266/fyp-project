import api from '@/services/api.service'

export interface DoctorReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  patientInitial: string
}

export interface ReviewsResponse {
  reviews: DoctorReview[]
  total: number
  page: number
  totalPages: number
}

export const submitReview = async (payload: {
  appointmentId: string
  rating: number
  comment?: string
}): Promise<void> => {
  await api.post('/reviews', payload)
}

export const getDoctorReviews = async (
  doctorId: string,
  page = 1
): Promise<ReviewsResponse> => {
  const res = await api.get(`/doctors/${doctorId}/reviews`, { params: { page } })
  return res.data
}
