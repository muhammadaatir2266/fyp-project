'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Copy, 
  CheckCircle, 
  Brain, 
  Zap,
  Shield,
  Terminal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Activity
} from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  auth: 'API Token';
  body?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  example: {
    request: string;
    response: string;
  };
}

  // Generate ML endpoints with dynamic base URL
  const getMLEndpoints = (baseUrl: string): Endpoint[] => [
  {
    method: 'POST',
    path: '/api/v1/ml/predict',
    description: 'Predict disease based on symptoms using CatBoost ML model',
    auth: 'API Token',
    body: [
      { name: 'symptoms', type: 'array', required: true, description: 'Array of symptom names (e.g., ["fever", "cough", "headache"])' }
    ],
    response: 'Disease prediction with confidence scores',
    example: {
      request: `curl -X POST "${baseUrl}/api/v1/ml/predict" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "symptoms": ["fever", "cough", "headache", "fatigue"]
  }'`,
      response: `{
  "success": true,
  "data": {
    "predicted_disease": "Flu",
    "confidence": 0.87,
    "top_3_predictions": [
      {
        "disease": "Flu",
        "confidence": 0.87
      },
      {
        "disease": "Common Cold",
        "confidence": 0.09
      },
      {
        "disease": "COVID-19",
        "confidence": 0.04
      }
    ]
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/v1/ml/symptoms',
    description: 'Get list of all symptoms recognized by the ML model',
    auth: 'API Token',
    response: 'Array of symptom names',
    example: {
      request: `curl -X GET "${baseUrl}/api/v1/ml/symptoms" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      response: `{
  "success": true,
  "data": {
    "symptoms": [
      "fever",
      "cough",
      "headache",
      "fatigue",
      "sore throat",
      "runny nose",
      "body aches",
      "chills"
    ],
    "count": 8
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/v1/ml/diseases',
    description: 'Get list of all diseases that the ML model can predict',
    auth: 'API Token',
    response: 'Array of disease names',
    example: {
      request: `curl -X GET "${baseUrl}/api/v1/ml/diseases" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      response: `{
  "success": true,
  "data": {
    "diseases": [
      "Flu",
      "Common Cold",
      "COVID-19",
      "Pneumonia",
      "Bronchitis",
      "Sinusitis"
    ],
    "count": 6
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/v1/ml/health',
    description: 'Check ML service health status and model availability',
    auth: 'API Token',
    response: 'ML service health status',
    example: {
      request: `curl -X GET "${baseUrl}/api/v1/ml/health" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      response: `{
  "success": true,
  "data": {
    "status": "healthy",
    "model_loaded": true
  }
}`
    }
  }
];

export default function MLApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<number | null>(0);
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_ML_API_BASE_URL || 'http://localhost:4000';
  const mlEndpoints = getMLEndpoints(apiBaseUrl);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700 border-blue-300',
      POST: 'bg-green-100 text-green-700 border-green-300',
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              ML Model API Documentation
            </h1>
            <p className="text-gray-600 mt-1">Disease prediction using CatBoost machine learning model</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Start */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Start</h3>
                <p className="text-gray-700 mb-4">
                  The ML Model API uses the same authentication as the Doctor API. Generate an API token from the{' '}
                  <a href="/api-access" className="text-teal-600 hover:text-teal-700 font-medium underline">
                    API Access
                  </a>{' '}
                  page to get started.
                </p>
                <div className="bg-white rounded-lg p-4 border-2 border-teal-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Base URL</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiBaseUrl, 'base-url')}
                    >
                      {copiedCode === 'base-url' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <code className="text-sm text-teal-600 font-mono">{apiBaseUrl}</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Model Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Brain className="mr-3 h-6 w-6 text-teal-600" />
              About the Model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-200">
                <div className="text-sm text-gray-600 mb-1">Model Type</div>
                <div className="text-lg font-semibold text-gray-900">CatBoost Classifier</div>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-200">
                <div className="text-sm text-gray-600 mb-1">Input</div>
                <div className="text-lg font-semibold text-gray-900">Symptom List</div>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-200">
                <div className="text-sm text-gray-600 mb-1">Output</div>
                <div className="text-lg font-semibold text-gray-900">Disease Prediction</div>
              </div>
            </div>
            <p className="text-gray-700">
              The ML model analyzes patient symptoms and predicts the most likely disease with confidence scores. 
              It returns the top 3 predictions to help healthcare providers make informed decisions.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Shield className="mr-3 h-6 w-6 text-teal-600" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              All ML API requests require authentication using an API token in the Authorization header:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_TOKEN', 'auth-header')}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                {copiedCode === 'auth-header' ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <pre className="text-sm text-gray-100 font-mono overflow-x-auto">
                Authorization: Bearer YOUR_API_TOKEN
              </pre>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Endpoints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Terminal className="mr-3 h-6 w-6 text-teal-600" />
              API Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mlEndpoints.map((endpoint, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="border-2 border-gray-200 hover:border-teal-300 transition-colors">
                  <CardContent className="p-0">
                    {/* Endpoint Header */}
                    <button
                      onClick={() => setExpandedEndpoint(expandedEndpoint === index ? null : index)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <Badge className={`${getMethodColor(endpoint.method)} border font-mono font-bold px-3 py-1`}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono text-gray-900 font-medium">
                          {endpoint.path}
                        </code>
                      </div>
                      {expandedEndpoint === index ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Endpoint Details */}
                    {expandedEndpoint === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-200"
                      >
                        <div className="p-6 space-y-6">
                          {/* Description */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-700">{endpoint.description}</p>
                          </div>

                          {/* Request Body */}
                          {endpoint.body && endpoint.body.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Request Body</h4>
                              <div className="space-y-2">
                                {endpoint.body.map((field, i) => (
                                  <div key={i} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <code className="text-sm font-mono text-teal-600">{field.name}</code>
                                      <Badge variant="secondary" className="text-xs">
                                        {field.type}
                                      </Badge>
                                      {field.required && (
                                        <Badge variant="destructive" className="text-xs">
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">{field.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Example Request */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Example Request</h4>
                            <div className="bg-gray-900 rounded-lg p-4 relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(endpoint.example.request, `request-${index}`)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                              >
                                {copiedCode === `request-${index}` ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <pre className="text-sm text-gray-100 font-mono overflow-x-auto">
                                {endpoint.example.request}
                              </pre>
                            </div>
                          </div>

                          {/* Example Response */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Example Response</h4>
                            <div className="bg-gray-900 rounded-lg p-4 relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(endpoint.example.response, `response-${index}`)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                              >
                                {copiedCode === `response-${index}` ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <pre className="text-sm text-gray-100 font-mono overflow-x-auto">
                                {endpoint.example.response}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Codes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Error Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { code: '200', message: 'OK - Prediction successful' },
                { code: '400', message: 'Bad Request - Invalid symptoms or empty array' },
                { code: '401', message: 'Unauthorized - Invalid or missing API token' },
                { code: '403', message: 'Forbidden - API token expired or revoked' },
                { code: '500', message: 'Internal Server Error - Prediction failed' },
                { code: '503', message: 'Service Unavailable - ML service not running' },
              ].map((error, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Badge className={`font-mono ${error.code.startsWith('2') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {error.code}
                  </Badge>
                  <span className="text-gray-700">{error.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-gray-700">
                  Contact our support team for ML API integration assistance
                </p>
              </div>
              <Button className="bg-gradient-to-r from-teal-600 to-emerald-600">
                <ExternalLink className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
