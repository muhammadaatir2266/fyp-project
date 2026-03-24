const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

/**
 * Predict disease from symptoms
 * Requires API token authentication
 */
const predictDisease = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms array is required and cannot be empty',
        example: { symptoms: ['fever', 'cough', 'headache'] }
      });
    }

    // Forward request to ML service
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      symptoms
    }, {
      timeout: 30000 // 30 second timeout
    });

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('ML prediction error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'ML service is not available. Please ensure the Python service is running.',
        error: 'Service unavailable'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.detail || 'Prediction failed',
        error: error.response.data
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while processing prediction',
      error: error.message
    });
  }
};

/**
 * Get all available symptoms
 */
const getSymptoms = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/symptoms`, {
      timeout: 10000
    });

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Get symptoms error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'ML service is not available',
        error: 'Service unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve symptoms',
      error: error.message
    });
  }
};

/**
 * Get all possible diseases
 */
const getDiseases = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/diseases`, {
      timeout: 10000
    });

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Get diseases error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'ML service is not available',
        error: 'Service unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve diseases',
      error: error.message
    });
  }
};

/**
 * Check ML service health
 */
const checkHealth = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000
    });

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('ML health check error:', error.message);
    
    return res.status(503).json({
      success: false,
      message: 'ML service is not available',
      status: 'unhealthy',
      model_loaded: false
    });
  }
};

module.exports = {
  predictDisease,
  getSymptoms,
  getDiseases,
  checkHealth
};
