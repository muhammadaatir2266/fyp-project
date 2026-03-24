"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar, MessageSquare, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import type { Patient, PatientSymptom, Prediction, ChatMessage, Appointment } from "@/types";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [symptoms, setSymptoms] = useState<PatientSymptom[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const [patientRes, symptomsRes, predictionsRes, chatRes, appointmentsRes] =
        await Promise.all([
          api.get(`/doctor/patients/${patientId}`),
          api.get(`/doctor/patients/${patientId}/symptoms`),
          api.get(`/doctor/patients/${patientId}/predictions`),
          api.get(`/doctor/patients/${patientId}/chat-history`),
          api.get(`/doctor/patients/${patientId}/appointments`),
        ]);

      setPatient(patientRes.data);
      setSymptoms(symptomsRes.data);
      setPredictions(predictionsRes.data);
      setChatHistory(chatRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error("Failed to fetch patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground mb-4">Patient not found</p>
        <Button onClick={() => router.push("/patients")}>Back to Patients</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted-foreground">Patient Details</p>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-medium">{patient.gender || "N/A"}</span>

              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="font-medium">
                {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "N/A"}
              </span>

              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{patient.phone || "N/A"}</span>

              <span className="text-muted-foreground">City:</span>
              <span className="font-medium">{patient.city || "N/A"}</span>

              <span className="text-muted-foreground">Emergency Contact:</span>
              <span className="font-medium">{patient.emergencyContact || "N/A"}</span>
            </div>

            {patient.allergies && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-1">Allergies:</p>
                <p className="text-sm text-muted-foreground">{patient.allergies}</p>
              </div>
            )}

            {patient.medicalHistory && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-1">Medical History:</p>
                <p className="text-sm text-muted-foreground">
                  {patient.medicalHistory}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent>
            {symptoms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No symptoms reported</p>
            ) : (
              <div className="space-y-3">
                {symptoms.slice(0, 5).map((symptom, index) => (
                  <motion.div
                    key={symptom.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-3 rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">
                        {symptom.symptom?.name || "Unknown"}
                      </p>
                      <Badge variant="outline">Severity: {symptom.severity}/5</Badge>
                    </div>
                    {symptom.duration && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {symptom.duration}
                      </p>
                    )}
                    {symptom.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {symptom.notes}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
        <CardHeader>
          <CardTitle>AI Predictions</CardTitle>
          <CardDescription>Disease predictions based on symptoms</CardDescription>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No predictions available</p>
          ) : (
            <div className="space-y-3">
              {predictions.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{prediction.disease?.name}</h4>
                    <Badge variant="default">
                      {prediction.confidence.toFixed(1)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {prediction.disease?.description}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Based on: {prediction.inputSymptoms.join(", ")}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat History with AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chatHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chat history</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {chatHistory.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.role === "user" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary/10 ml-8"
                      : "bg-muted mr-8"
                  }`}
                >
                  <p className="text-xs font-medium mb-1">
                    {message.role === "user" ? "Patient" : "AI Assistant"}
                  </p>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(message.createdAt)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(appointment.scheduledAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(appointment.scheduledAt)} - {appointment.duration}{" "}
                      min
                    </p>
                  </div>
                  <Badge>{appointment.status}</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
