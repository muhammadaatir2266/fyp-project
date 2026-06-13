import { Request, Response } from 'express'
import axios, { AxiosError } from 'axios'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001'

export const predictDisease = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symptoms } = req.body as { symptoms?: unknown }

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Symptoms array is required and cannot be empty',
        example: { symptoms: ['fever', 'cough', 'headache'] },
      })
      return
    }

    const response = await axios.post(`${ML_SERVICE_URL}/predict`, { symptoms }, { timeout: 30000 })

    res.json({ success: true, data: response.data })
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('ML prediction error:', axiosError.response?.data ?? axiosError.message)

    if (axiosError.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'ML service is not available. Please ensure the Python service is running.',
        error: 'Service unavailable',
      })
      return
    }

    if (axiosError.response) {
      const data = axiosError.response.data as Record<string, unknown>
      res.status(axiosError.response.status).json({
        success: false,
        message: (data.detail as string) || 'Prediction failed',
        error: data,
      })
      return
    }

    res.status(500).json({ success: false, message: 'Server error while processing prediction', error: axiosError.message })
  }
}

export const getSymptoms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/symptoms`, { timeout: 10000 })
    res.json({ success: true, data: response.data })
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('Get symptoms error:', axiosError.message)

    if (axiosError.code === 'ECONNREFUSED') {
      res.status(503).json({ success: false, message: 'ML service is not available', error: 'Service unavailable' })
      return
    }

    res.status(500).json({ success: false, message: 'Failed to retrieve symptoms', error: axiosError.message })
  }
}

export const getDiseases = async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/diseases`, { timeout: 10000 })
    res.json({ success: true, data: response.data })
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('Get diseases error:', axiosError.message)

    if (axiosError.code === 'ECONNREFUSED') {
      res.status(503).json({ success: false, message: 'ML service is not available', error: 'Service unavailable' })
      return
    }

    res.status(500).json({ success: false, message: 'Failed to retrieve diseases', error: axiosError.message })
  }
}

export const checkHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 })
    res.json({ success: true, data: response.data })
  } catch {
    res.status(503).json({ success: false, message: 'ML service is not available', status: 'unhealthy', model_loaded: false })
  }
}
