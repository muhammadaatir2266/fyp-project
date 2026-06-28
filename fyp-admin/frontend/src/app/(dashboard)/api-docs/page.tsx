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
  Book, 
  Zap,
  Shield,
  Terminal,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  auth: 'API Token' | 'JWT';
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  example: {
    request: string;
    response: string;
  };
}

  // Generate endpoints with dynamic base URL
  const getEndpoints = (baseUrl: string): Endpoint[] => [
  {
    method: 'GET',
    path: '/api/v1/doctors',
    description: 'Get list of all active doctors',
    auth: 'API Token',
    params: [
      { name: 'specialty', type: 'string', required: false, description: 'Filter by specialty name' }
    ],
    response: 'Array of doctor objects',
    example: {
      request: `curl -X GET "${baseUrl}/api/v1/doctors" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      response: `{
  "success": true,
  "count": 3,
  "doctors": [
    {
      "id": "uuid",
      "name": "Dr. John Smith",
      "specialty": "Cardiology",
      "city": "New York",
      "experience": 15,
      "rating": 4.8,
      "consultationFee": 150,
      "workingHours": {
        "from": "09:00",
        "to": "17:00"
      },
      "workingDays": ["Monday", "Tuesday", "Wednesday"]
    }
  ]
}`
    }
  },
  {
    method: 'GET',
    path: '/api/v1/doctors/:id/availability',
    description: 'Check if doctor is available at specific date and time',
    auth: 'API Token',
    params: [
      { name: 'date', type: 'string', required: true, description: 'Date in YYYY-MM-DD format' },
      { name: 'time', type: 'string', required: true, description: 'Time in HH:MM format (24-hour)' }
    ],
    response: 'Availability status object',
    example: {
      request: `curl -X GET "${baseUrl}/api/v1/doctors/uuid/availability?date=2024-03-15&time=14:30" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      response: `{
  "success": true,
  "available": true,
  "message": "Time slot is available",
  "doctor": {
    "id": "uuid",
    "name": "Dr. John Smith",
    "specialty": "Cardiology"
  },
  "slot": {
    "date": "2024-03-15",
    "time": "14:30",
    "duration": 30
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/v1/doctors/:id/slots',
    description: 'Get all available time slots for a doctor on a specific date',
    auth: 'API Token',
    params: [
      { name: 'date', type: 'string', required: true, description: 'Date in YYYY-MM-DD format' }
    ],
    response: 'Array of available time slots',
    example: {
      request: `curl -X GET "${baseUrl}/api/v1/doctors/uuid/slots?date=2024-03-15" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      response: `{
  "success": true,
  "doctor": {
    "id": "uuid",
    "name": "Dr. John Smith",
    "specialty": "Cardiology"
  },
  "date": "2024-03-15",
  "slots": [
    "09:00", "09:30", "10:00", "10:30",
    "11:00", "14:00", "14:30", "15:00"
  ]
}`
    }
  },
  {
    method: 'POST',
    path: '/api/v1/doctors/:id/appointments',
    description: 'Book an appointment with a doctor',
    auth: 'API Token',
    body: [
      { name: 'patientName', type: 'string', required: true, description: 'Full name of the patient' },
      { name: 'patientPhone', type: 'string', required: true, description: 'Phone number of the patient' },
      { name: 'patientEmail', type: 'string', required: false, description: 'Email address of the patient' },
      { name: 'date', type: 'string', required: true, description: 'Appointment date (YYYY-MM-DD)' },
      { name: 'time', type: 'string', required: true, description: 'Appointment time (HH:MM)' },
      { name: 'reason', type: 'string', required: false, description: 'Reason for appointment' },
      { name: 'duration', type: 'number', required: false, description: 'Duration in minutes (default: 30)' }
    ],
    response: 'Created appointment object',
    example: {
      request: `curl -X POST "${baseUrl}/api/v1/doctors/uuid/appointments" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "patientName": "Jane Doe",
    "patientPhone": "+1234567890",
    "patientEmail": "jane@example.com",
    "date": "2024-03-15",
    "time": "14:30",
    "reason": "Regular checkup"
  }'`,
      response: `{
  "success": true,
  "message": "Appointment booked successfully",
  "appointment": {
    "id": "uuid",
    "patient": {
      "name": "Jane Doe",
      "phone": "+1234567890"
    },
    "doctor": {
      "name": "Dr. John Smith",
      "specialty": "Cardiology"
    },
    "scheduledAt": "2024-03-15T14:30:00Z",
    "duration": 30,
    "status": "PENDING",
    "reason": "Regular checkup"
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/v1/appointments',
    description: 'List a patient\'s appointments, optionally filtered by status or upcoming-only. Used by voice agents to look up a patient\'s bookings before cancelling.',
    auth: 'API Token',
    params: [
      { name: 'patientId', type: 'string', required: false, description: 'Patient ID (required if patientPhone not provided)' },
      { name: 'patientPhone', type: 'string', required: false, description: 'Patient phone number (required if patientId not provided)' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW' },
      { name: 'upcoming', type: 'boolean', required: false, description: 'Set to true to return only future PENDING/CONFIRMED appointments' }
    ],
    response: 'Array of appointment objects',
    example: {
      request: `curl -X GET "${baseUrl}/api/v1/appointments?patientPhone=%2B923001234567&upcoming=true" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      response: `{
  "success": true,
  "count": 1,
  "appointments": [
    {
      "id": "uuid",
      "doctor": {
        "id": "uuid",
        "name": "Dr. John Smith",
        "specialty": "Cardiology",
        "city": "Karachi"
      },
      "scheduledAt": "2024-03-15T09:00:00Z",
      "duration": 30,
      "status": "PENDING",
      "reason": "Regular checkup",
      "source": "CALLING_AGENT"
    }
  ]
}`
    }
  },
  {
    method: 'PATCH',
    path: '/api/v1/appointments/:id/cancel',
    description: 'Cancel an appointment by ID. Only PENDING or CONFIRMED appointments can be cancelled. Also removes the event from the doctor\'s Google Calendar if connected.',
    auth: 'API Token',
    params: [],
    response: 'Cancellation confirmation object',
    example: {
      request: `curl -X PATCH "${baseUrl}/api/v1/appointments/uuid/cancel" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      response: `{
  "success": true,
  "message": "Appointment cancelled successfully",
  "appointment": {
    "id": "uuid",
    "status": "CANCELLED",
    "doctor": {
      "name": "Dr. John Smith"
    },
    "patient": {
      "name": "Jane Doe"
    },
    "scheduledAt": "2024-03-15T09:00:00Z"
  }
}`
    }
  }
];

export default function ApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<number | null>(0);
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_DOCTOR_API_BASE_URL || 'http://localhost:4000';
  const endpoints = getEndpoints(apiBaseUrl);

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
      PUT: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      DELETE: 'bg-red-100 text-red-700 border-red-300',
      PATCH: 'bg-purple-100 text-purple-700 border-purple-300',
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
            <Book className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Doctor API Documentation
            </h1>
            <p className="text-gray-600 mt-1">Complete guide for the Calling Agent & Doctor Booking API</p>
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
                  To use the Doctor API, you need an API token. Generate one from the{' '}
                  <a href="/api-access" className="text-teal-600 hover:text-teal-700 font-medium underline">
                    API Access
                  </a>{' '}
                  page.
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
              All API requests require authentication using an API token in the Authorization header:
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
            {endpoints.map((endpoint, index) => (
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

                          {/* Parameters */}
                          {endpoint.params && endpoint.params.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Query Parameters</h4>
                              <div className="space-y-2">
                                {endpoint.params.map((param, i) => (
                                  <div key={i} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <code className="text-sm font-mono text-teal-600">{param.name}</code>
                                      <Badge variant="secondary" className="text-xs">
                                        {param.type}
                                      </Badge>
                                      {param.required && (
                                        <Badge variant="destructive" className="text-xs">
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">{param.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

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
                { code: '200', message: 'OK - Request successful' },
                { code: '201', message: 'Created - Resource created successfully' },
                { code: '400', message: 'Bad Request - Invalid parameters' },
                { code: '401', message: 'Unauthorized - Invalid or missing API token' },
                { code: '403', message: 'Forbidden - API token expired or revoked' },
                { code: '404', message: 'Not Found - Resource not found' },
                { code: '409', message: 'Conflict - Slot already booked or duplicate request' },
                { code: '500', message: 'Internal Server Error - Server error' },
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
                  Contact our support team for API integration assistance
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
