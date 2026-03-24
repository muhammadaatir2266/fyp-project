'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, X, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  source: string;
  reason: string;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctor: {
    firstName: string;
    lastName: string;
    specialty: {
      name: string;
    };
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const data = await api.get(`/admin/appointments${params}`);
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await api.delete(`/admin/appointments/${appointmentId}`);
      fetchAppointments();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSourceBadge = (source: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      PATIENT_APP: { label: 'Patient App', color: 'bg-teal-100 text-teal-800' },
      CALLING_AGENT: { label: 'Calling Agent', color: 'bg-purple-100 text-purple-800' },
      ADMIN_PANEL: { label: 'Admin Panel', color: 'bg-blue-100 text-blue-800' },
      WALK_IN: { label: 'Walk-in', color: 'bg-orange-100 text-orange-800' },
    };
    return badges[source] || { label: source, color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all appointments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? 'bg-gradient-to-r from-teal-600 to-emerald-600' : ''}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          <Badge className={getSourceBadge(appointment.source).color}>
                            {getSourceBadge(appointment.source).label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Patient</div>
                            <div className="font-semibold">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{appointment.patient.phone}</div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-600 mb-1">Doctor</div>
                            <div className="font-semibold">
                              Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{appointment.doctor.specialty.name}</div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-600 mb-1">Date & Time</div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-teal-600" />
                              <span>{format(new Date(appointment.scheduledAt), 'MMM dd, yyyy')}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="h-4 w-4 text-teal-600" />
                              <span>{format(new Date(appointment.scheduledAt), 'hh:mm a')}</span>
                              <span className="text-gray-600">({appointment.duration} min)</span>
                            </div>
                          </div>

                          {appointment.reason && (
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Reason</div>
                              <div className="text-sm">{appointment.reason}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {appointments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No appointments found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
