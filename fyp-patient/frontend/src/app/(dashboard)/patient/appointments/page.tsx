"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
import { Badge } from "@/components/ui/badge";
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
  RotateCcw,
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
    consultationFee?: number | null;
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

const STATUS_DESC: Record<string, string> = {
  PENDING: "Waiting for doctor confirmation",
  CONFIRMED: "Confirmed — please arrive on time",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "Marked as no-show",
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

/** Inline slot-picker panel used for both booking and rescheduling */
function SlotPicker({
  doctorId,
  initialDate,
  initialSlot,
  onConfirm,
  onCancel,
  loading,
  label,
}: {
  doctorId: string;
  initialDate: string;
  initialSlot: string;
  onConfirm: (date: string, slot: string) => void;
  onCancel: () => void;
  loading: boolean;
  label: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState(initialSlot);
  const [slots, setSlots] = useState<string[]>([]);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!doctorId || !selectedDate) { setSlots([]); return; }
    api.get(`/doctors/${doctorId}/slots`, { params: { date: selectedDate } })
      .then((res) => {
        setSlots(res.data.slots ?? []);
        // auto-select initial slot only when date matches
        if (initialSlot && res.data.slots?.includes(initialSlot)) {
          setSelectedSlot(initialSlot);
        }
      })
      .catch(() => setSlots([]));
  }, [doctorId, selectedDate]);

  return (
    <div className="space-y-3 pt-2">
      <div className="grid gap-3 sm:grid-cols-2">
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
            <p className="text-sm text-muted-foreground pt-2">
              {selectedDate ? "No slots available" : "Select a date first"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSlot(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    selectedSlot === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={loading || !selectedDate || !selectedSlot}
          onClick={() => onConfirm(selectedDate, selectedSlot)}
        >
          {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {label}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const prefillDoctorId = searchParams.get("doctorId") ?? "";
  const prefillDoctorName = searchParams.get("doctorName") ?? "";
  const prefillDate = searchParams.get("date") ?? "";
  const prefillSlot = searchParams.get("slot") ?? "";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(!!prefillDoctorId);

  // Booking form state
  const [doctorId, setDoctorId] = useState(prefillDoctorId);
  const [doctorSearch, setDoctorSearch] = useState(prefillDoctorName);
  const [doctorResults, setDoctorResults] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(prefillDate);
  const [selectedSlot, setSelectedSlot] = useState(prefillSlot);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [lastBooked, setLastBooked] = useState<Appointment | null>(null);

  // Reschedule state
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Review state
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Load pre-filled doctor
  useEffect(() => {
    if (!prefillDoctorId) return;
    api.get(`/doctors/${prefillDoctorId}`)
      .then((res) => { setSelectedDoctor(res.data); setDoctorId(prefillDoctorId); })
      .catch(() => {});
  }, [prefillDoctorId]);

  // Doctor search autocomplete
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

  async function handleBook(date: string, slot: string) {
    if (!doctorId || !date || !slot) {
      toast.error("Please select a doctor, date and time slot");
      return;
    }
    setBooking(true);
    try {
      const scheduledAt = new Date(`${date}T${slot}:00`).toISOString();
      const res = await api.post("/appointments", { doctorId, scheduledAt, reason: reason || undefined });
      setLastBooked(res.data);
      toast.success("Appointment booked!");
      setShowBooking(false);
      setDoctorId(""); setSelectedDate(""); setSelectedSlot(""); setReason(""); setSelectedDoctor(null); setDoctorSearch("");
      fetchAppointments();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.patch(`/appointments/${cancelTarget.id}`, { status: "CANCELLED" });
      toast.success("Appointment cancelled");
      setCancelTarget(null);
      fetchAppointments();
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancelling(false);
    }
  }

  async function handleReschedule(date: string, slot: string) {
    if (!rescheduleTarget) return;
    setRescheduling(true);
    try {
      const scheduledAt = new Date(`${date}T${slot}:00`).toISOString();
      await api.patch(`/appointments/${rescheduleTarget.id}`, { scheduledAt });
      toast.success("Appointment rescheduled — waiting for doctor confirmation");
      setRescheduleTarget(null);
      fetchAppointments();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to reschedule appointment");
    } finally {
      setRescheduling(false);
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

      {/* Booking Confirmation Card */}
      {lastBooked && (
        <Card className="border-green-500/40 bg-green-50/50 dark:bg-green-950/20 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-start justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-base text-green-800 dark:text-green-300">Appointment Booked</CardTitle>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7 -mt-1 -mr-1" onClick={() => setLastBooked(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">
              Dr. {lastBooked.doctor.firstName} {lastBooked.doctor.lastName}
              <span className="text-muted-foreground font-normal"> · {lastBooked.doctor.specialty?.name}</span>
            </p>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(lastBooked.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {" at "}
              {new Date(lastBooked.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {lastBooked.doctor.city}
              {lastBooked.doctor.clinicLocation ? ` · ${lastBooked.doctor.clinicLocation}` : ""}
            </p>
            {lastBooked.doctor.consultationFee && (
              <p className="text-muted-foreground">Fee: Rs. {lastBooked.doctor.consultationFee}</p>
            )}
            <Badge className="mt-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-none text-xs font-medium">
              PENDING — Waiting for doctor confirmation. You'll see CONFIRMED once the doctor accepts.
            </Badge>
          </CardContent>
        </Card>
      )}

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
            {/* Doctor selector */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Doctor</label>
              {selectedDoctor ? (
                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
                  <span className="font-medium">Dr. {selectedDoctor.fullName} — {selectedDoctor.specialty?.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setSelectedDoctor(null); setDoctorId(""); setDoctorSearch(""); }}
                  >
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
                      {doctorResults.map((d) => (
                        <button
                          key={d.id}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm"
                          onClick={() => {
                            setSelectedDoctor(d);
                            setDoctorId(d.id);
                            setDoctorResults([]);
                          }}
                        >
                          Dr. {d.fullName} — {d.specialty?.name} ({d.city})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {doctorId && (
              <SlotPicker
                doctorId={doctorId}
                initialDate={selectedDate}
                initialSlot={selectedSlot}
                loading={booking}
                label="Confirm Appointment"
                onConfirm={(date, slot) => {
                  setSelectedDate(date);
                  setSelectedSlot(slot);
                  handleBook(date, slot);
                }}
                onCancel={() => setShowBooking(false)}
              />
            )}

            {doctorId && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Reason (optional)</label>
                <Input
                  placeholder="e.g. Follow-up, consultation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            )}
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
            const isUpcoming = dt >= new Date() && (apt.status === "PENDING" || apt.status === "CONFIRMED");
            const canReschedule = isUpcoming;
            const canCancel = isUpcoming; // patients can cancel both PENDING and CONFIRMED
            const isCancelling = cancelTarget?.id === apt.id;
            const canReview = apt.status === "COMPLETED" && !apt.review;
            const isRescheduling = rescheduleTarget?.id === apt.id;

            return (
              <Card key={apt.id} className={`border-border/50 ${!isUpcoming ? "opacity-80" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary font-bold text-center">
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
                        {apt.review && (
                          <div className="flex items-center gap-1 pt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${s <= apt.review!.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">Your review</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[apt.status]}`}>
                          {apt.status}
                        </span>
                        {STATUS_DESC[apt.status] && (
                          <span className="text-xs text-muted-foreground text-right max-w-[160px]">
                            {STATUS_DESC[apt.status]}
                          </span>
                        )}
                      </div>

                      {canReschedule && !isRescheduling && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setRescheduleTarget(apt)}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reschedule
                        </Button>
                      )}

                      {canCancel && !isCancelling && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 h-7 text-xs"
                          onClick={() => setCancelTarget(apt)}
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
                  </div>

                  {/* Inline reschedule picker */}
                  {isRescheduling && (
                    <div className="mt-4 border-t border-border/50 pt-4">
                      <p className="text-sm font-medium mb-2">Choose a new date and time</p>
                      <SlotPicker
                        doctorId={apt.doctor.id}
                        initialDate={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(apt.scheduledAt))}
                        initialSlot={new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(apt.scheduledAt)).replace(/^(\d):/, "0$1:")}
                        loading={rescheduling}
                        label="Confirm Reschedule"
                        onConfirm={handleReschedule}
                        onCancel={() => setRescheduleTarget(null)}
                      />
                    </div>
                  )}

                  {/* Inline cancel confirmation */}
                  {isCancelling && (
                    <div className="mt-4 border-t border-destructive/20 pt-4">
                      <p className="text-sm font-medium text-destructive mb-1">Cancel this appointment?</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Dr. {apt.doctor.firstName} {apt.doctor.lastName} on{" "}
                        {dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at{" "}
                        {new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit" }).format(dt)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={cancelling}
                          onClick={handleCancel}
                        >
                          {cancelling && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                          Yes, cancel appointment
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setCancelTarget(null)}>
                          Keep it
                        </Button>
                      </div>
                    </div>
                  )}
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
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
