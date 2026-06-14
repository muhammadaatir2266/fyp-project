"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/services/api.service";
import { submitReview } from "@/services/reviews.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  X,
  Loader2,
  Star,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  reason: string | null;
  source: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    city: string;
    clinicLocation: string | null;
    specialty: { name: string };
  };
  review: ReviewData | null;
}

interface Doctor {
  id: string;
  fullName: string;
  specialty: { name: string };
  city: string;
  availableFrom: string;
  availableTo: string;
  workingDays: string[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  NO_SHOW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const prefillDoctorId = searchParams.get("doctorId");
  const prefillDoctorName = searchParams.get("doctorName");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(!!prefillDoctorId);

  // Booking form state
  const [doctorId, setDoctorId] = useState(prefillDoctorId || "");
  const [doctorSearch, setDoctorSearch] = useState(prefillDoctorName || "");
  const [doctorResults, setDoctorResults] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);

  // Review state
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (prefillDoctorId) {
      api.get(`/doctors/${prefillDoctorId}`).then((res) => {
        setSelectedDoctor(res.data);
        setDoctorId(prefillDoctorId);
      }).catch(() => {});
    }
  }, [prefillDoctorId]);

  useEffect(() => {
    if (!doctorSearch || prefillDoctorId) return;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/doctors", { params: { name: doctorSearch } });
        setDoctorResults(res.data.doctors.slice(0, 6));
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [doctorSearch, prefillDoctorId]);

  useEffect(() => {
    if (!doctorId || !selectedDate) { setSlots([]); return; }
    api.get(`/doctors/${doctorId}/slots`, { params: { date: selectedDate } })
      .then(res => setSlots(res.data.slots))
      .catch(() => setSlots([]));
  }, [doctorId, selectedDate]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBook() {
    if (!doctorId || !selectedDate || !selectedSlot) {
      toast.error("Please select a doctor, date and time slot");
      return;
    }
    setBooking(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
      await api.post("/appointments", { doctorId, scheduledAt, reason: reason || undefined });
      toast.success("Appointment booked successfully!");
      setShowBooking(false);
      setDoctorId(""); setSelectedDate(""); setSelectedSlot(""); setReason(""); setSelectedDoctor(null);
      fetchAppointments();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  }

  async function handleCancel(id: string) {
    try {
      await api.patch(`/appointments/${id}`, { status: "CANCELLED" });
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch {
      toast.error("Failed to cancel appointment");
    }
  }

  function openReview(apt: Appointment) {
    setReviewTarget(apt);
    setReviewRating(0);
    setReviewComment("");
  }

  async function handleSubmitReview() {
    if (!reviewTarget || reviewRating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview({
        appointmentId: reviewTarget.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      toast.success("Review submitted — thank you!");
      setReviewTarget(null);
      fetchAppointments();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage your upcoming and past appointments</p>
        </div>
        <Button onClick={() => setShowBooking(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Book New
        </Button>
      </div>

      {/* Booking Panel */}
      {showBooking && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Book an Appointment</CardTitle>
            <Button size="icon" variant="ghost" onClick={() => setShowBooking(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Doctor</label>
              {selectedDoctor ? (
                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
                  <span className="font-medium">Dr. {selectedDoctor.fullName} — {selectedDoctor.specialty?.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedDoctor(null); setDoctorId(""); setDoctorSearch(""); }}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search doctor by name..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                  {doctorResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-lg">
                      {doctorResults.map(d => (
                        <button
                          key={d.id}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm"
                          onClick={() => { setSelectedDoctor(d); setDoctorId(d.id); setDoctorResults([]); }}
                        >
                          Dr. {d.fullName} — {d.specialty?.name} ({d.city})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(""); }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Time Slot</label>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground pt-2">{selectedDate ? "No slots available" : "Select a date first"}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSlot(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedSlot === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input placeholder="e.g. Follow-up, consultation..." value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <Button onClick={handleBook} disabled={booking || !doctorId || !selectedDate || !selectedSlot} className="w-full">
              {booking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Appointment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No appointments yet</p>
          <p className="text-sm">Book your first appointment above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((apt) => {
            const dt = new Date(apt.scheduledAt);
            const isPast = dt < new Date() || apt.status === "COMPLETED" || apt.status === "CANCELLED";
            const canReview = apt.status === "COMPLETED" && !apt.review;
            return (
              <Card key={apt.id} className={`border-border/50 ${isPast ? "opacity-80" : ""}`}>
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary font-bold text-center">
                      <span className="text-xs uppercase">{dt.toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="text-xl leading-tight">{dt.getDate()}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">Dr. {apt.doctor.firstName} {apt.doctor.lastName}</p>
                      <p className="text-sm text-muted-foreground">{apt.doctor.specialty?.name}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {apt.doctor.city}
                        </span>
                        {apt.source === "CALLING_AGENT" && (
                          <span className="text-xs text-primary font-medium">Via Call Agent</span>
                        )}
                      </div>
                      {apt.reason && <p className="text-xs text-muted-foreground italic">"{apt.reason}"</p>}
                      {/* Existing review summary */}
                      {apt.review && (
                        <div className="flex items-center gap-1 pt-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-3 w-3 ${s <= apt.review!.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">Your review</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[apt.status]}`}>
                      {apt.status}
                    </span>
                    {apt.status === "PENDING" && !isPast && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 h-7 text-xs"
                        onClick={() => handleCancel(apt.id)}
                      >
                        Cancel
                      </Button>
                    )}
                    {canReview && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => openReview(apt)}
                      >
                        <Star className="h-3 w-3" />
                        Leave Review
                      </Button>
                    )}
                    {apt.review && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reviewed
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Sheet */}
      <Sheet open={!!reviewTarget} onOpenChange={(o) => { if (!o) setReviewTarget(null); }}>
        <SheetContent side="bottom" className="max-h-[80vh] rounded-t-2xl pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle>Rate your visit</SheetTitle>
            {reviewTarget && (
              <p className="text-sm text-muted-foreground">
                Dr. {reviewTarget.doctor.firstName} {reviewTarget.doctor.lastName} — {reviewTarget.doctor.specialty?.name}
              </p>
            )}
          </SheetHeader>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium mb-2">Your rating</p>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>
            <div>
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                className="mt-1.5 resize-none"
                rows={3}
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{reviewComment.length}/500</p>
            </div>
            <Button
              className="w-full"
              disabled={submittingReview || reviewRating === 0}
              onClick={handleSubmitReview}
            >
              {submittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <AppointmentsContent />
    </Suspense>
  );
}
