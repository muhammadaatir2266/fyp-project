'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ToggleLeft, 
  ToggleRight,
  Mail,
  Phone,
  MapPin,
  Star,
  Briefcase,
  DollarSign,
  Filter,
  X,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  clinicLocation?: string;
  licenseNumber?: string;
  verificationDocument?: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationNotes?: string;
  experience: number;
  consultationFee: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
  specialty: {
    name: string;
  };
  user: {
    email: string;
  };
  _count: {
    appointments: number;
  };
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [verificationFilter]);

  const fetchDoctors = async () => {
    try {
      const params = verificationFilter !== 'all' ? `?verificationStatus=${verificationFilter}` : '';
      const data = await api.get(`/admin/doctors${params}`);
      setDoctors(data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDoctorStatus = async (doctorId: string) => {
    try {
      await api.patch(`/admin/doctors/${doctorId}/toggle-status`);
      fetchDoctors();
    } catch (error) {
      console.error('Failed to toggle doctor status:', error);
    }
  };

  const approveDoctor = async () => {
    if (!selectedDoctor) return;
    
    setActionLoading(true);
    try {
      await api.post(`/admin/doctors/${selectedDoctor.id}/approve`, {});
      setShowApproveDialog(false);
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (error: any) {
      console.error('Failed to approve doctor:', error);
      alert(error.response?.data?.message || 'Failed to approve doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectDoctor = async () => {
    if (!selectedDoctor || !rejectionNotes.trim()) {
      alert('Please provide rejection notes');
      return;
    }
    
    setActionLoading(true);
    try {
      await api.post(`/admin/doctors/${selectedDoctor.id}/reject`, {
        notes: rejectionNotes
      });
      setShowRejectDialog(false);
      setSelectedDoctor(null);
      setRejectionNotes('');
      fetchDoctors();
    } catch (error: any) {
      console.error('Failed to reject doctor:', error);
      alert(error.response?.data?.message || 'Failed to reject doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const viewDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailsModal(true);
  };

  const viewDocument = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDocumentModal(true);
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 px-3 py-1.5 font-semibold shadow-md">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1.5 font-semibold shadow-md">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 px-3 py-1.5 font-semibold shadow-md">
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-600 border-t-transparent absolute top-0"></div>
        </div>
        <p className="mt-4 text-gray-600 animate-pulse">Loading doctors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Doctors Management
          </h1>
          <p className="text-gray-600 mt-2">Manage doctor profiles and verification</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-2 focus:border-teal-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <div className="flex space-x-2">
                  {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={verificationFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVerificationFilter(status)}
                      className={verificationFilter === status ? 'bg-gradient-to-r from-teal-600 to-emerald-600' : ''}
                    >
                      {status === 'all' ? 'All' : status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Showing <span className="font-semibold text-teal-600">{filteredDoctors.length}</span> of {doctors.length} doctors
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Doctors List */}
      <AnimatePresence mode="wait">
        {filteredDoctors.length > 0 ? (
          <motion.div
            key="doctors-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
                      {/* Status Indicator */}
                      <div className={`w-full lg:w-2 h-2 lg:h-24 flex-shrink-0 ${
                        doctor.verificationStatus === 'PENDING' ? 'bg-gradient-to-r lg:bg-gradient-to-b from-yellow-400 to-amber-500' :
                        doctor.verificationStatus === 'APPROVED' ? 'bg-gradient-to-r lg:bg-gradient-to-b from-green-400 to-emerald-500' :
                        'bg-gradient-to-r lg:bg-gradient-to-b from-red-400 to-rose-500'
                      }`}></div>

                      {/* Doctor Info */}
                      <div className="flex-1 p-5">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                          {/* Name & Specialty */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                              <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                                {doctor.specialty.name}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {doctor.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" />
                                {doctor.experience}y exp
                              </span>
                            </div>
                          </div>

                          {/* Contact - Hidden on mobile */}
                          <div className="hidden xl:flex flex-col gap-1 text-sm text-gray-600 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{doctor.user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{doctor.phone}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex-shrink-0">
                            {getVerificationBadge(doctor.verificationStatus)}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 flex-1 lg:flex-initial"
                              onClick={() => viewDetails(doctor)}
                            >
                              <FileText className="h-4 w-4 lg:mr-1.5" />
                              <span className="hidden lg:inline">View Details</span>
                            </Button>

                            {doctor.verificationStatus === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex-1 lg:flex-initial"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 lg:mr-1.5" />
                                  <span className="hidden lg:inline">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1 lg:flex-initial"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 lg:mr-1.5" />
                                  <span className="hidden lg:inline">Reject</span>
                                </Button>
                              </>
                            )}

                            {doctor.verificationStatus === 'APPROVED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={`flex-1 lg:flex-initial ${doctor.isActive ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'}`}
                                onClick={() => toggleDoctorStatus(doctor.id)}
                              >
                                {doctor.isActive ? (
                                  <><ToggleRight className="h-4 w-4 lg:mr-1.5" /> <span className="hidden lg:inline">Deactivate</span></>
                                ) : (
                                  <><ToggleLeft className="h-4 w-4 lg:mr-1.5" /> <span className="hidden lg:inline">Activate</span></>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? `No results for "${searchTerm}". Try a different search term.`
                    : 'No doctors match the selected filters.'}
                </p>
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="hover:bg-teal-50 hover:text-teal-600"
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approve Dialog */}
      {showApproveDialog && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Approve Doctor Application</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}? 
              This will activate their account and allow them to access the platform.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowApproveDialog(false);
                  setSelectedDoctor(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={approveDoctor}
                disabled={actionLoading}
              >
                {actionLoading ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Reject Doctor Application</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}'s application:
            </p>
            <textarea
              className="w-full border-2 border-gray-300 rounded-lg p-3 mb-4 focus:border-teal-500 focus:outline-none"
              rows={4}
              placeholder="Enter rejection reason..."
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
            />
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedDoctor(null);
                  setRejectionNotes('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={rejectDoctor}
                disabled={actionLoading || !rejectionNotes.trim()}
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && selectedDoctor && selectedDoctor.verificationDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Verification Document</h3>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDoctor(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
              <iframe
                src={`${process.env.NEXT_PUBLIC_API_URL}/admin/doctors/${selectedDoctor.id}/verification-document`}
                className="w-full h-[600px] border-0"
                title="Verification Document"
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Doctor Details Modal */}
      {showDetailsModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div className="text-white">
                  <h2 className="text-2xl font-bold mb-2">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</h2>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-white/20 text-white border-white/30">
                      {selectedDoctor.specialty.name}
                    </Badge>
                    {getVerificationBadge(selectedDoctor.verificationStatus)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDoctor(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b-2 border-teal-500 pb-2">Personal Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Email</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedDoctor.user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Phone</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedDoctor.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">City</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedDoctor.city}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b-2 border-teal-500 pb-2">Professional Information</h3>
                  
                  <div className="space-y-3">
                    {selectedDoctor.licenseNumber && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-blue-700 mb-1">License Number</div>
                          <div className="text-sm font-semibold text-blue-900">{selectedDoctor.licenseNumber}</div>
                        </div>
                      </div>
                    )}

                    {selectedDoctor.clinicLocation && (
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-purple-700 mb-1">Clinic Location</div>
                          <div className="text-sm font-semibold text-purple-900">{selectedDoctor.clinicLocation}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Briefcase className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Experience</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedDoctor.experience} years</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Consultation Fee</div>
                        <div className="text-sm font-semibold text-gray-900">${selectedDoctor.consultationFee}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Star className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0 fill-amber-500" />
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Rating</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedDoctor.rating.toFixed(1)} / 5.0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Document */}
              {selectedDoctor.verificationDocument && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-900 border-b-2 border-teal-500 pb-2 mb-4">Verification Document</h3>
                  <Button
                    variant="outline"
                    className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                    onClick={() => viewDocument(selectedDoctor)}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    View Verification Document
                  </Button>
                </div>
              )}

              {/* Rejection Notes */}
              {selectedDoctor.verificationStatus === 'REJECTED' && selectedDoctor.verificationNotes && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-red-900 border-b-2 border-red-500 pb-2 mb-4">Rejection Reason</h3>
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 leading-relaxed">{selectedDoctor.verificationNotes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-gray-50 rounded-b-xl border-t flex gap-3">
              {selectedDoctor.verificationStatus === 'PENDING' && (
                <>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowApproveDialog(true);
                    }}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject Application
                  </Button>
                </>
              )}
              {selectedDoctor.verificationStatus === 'APPROVED' && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    toggleDoctorStatus(selectedDoctor.id);
                    setShowDetailsModal(false);
                  }}
                >
                  {selectedDoctor.isActive ? (
                    <><ToggleRight className="h-5 w-5 mr-2" /> Deactivate Account</>
                  ) : (
                    <><ToggleLeft className="h-5 w-5 mr-2" /> Activate Account</>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDoctor(null);
                }}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
