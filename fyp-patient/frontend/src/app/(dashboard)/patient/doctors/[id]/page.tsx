"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api.service";
import { getDoctorReviews, type DoctorReview } from "@/services/reviews.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  Stethoscope,
  ShieldCheck,
  Calendar,
  ArrowLeft,
  Languages,
  Loader2,
  PhoneCall,
  MessageSquare,
} from "lucide-react";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  specialty: { name: string };
  gender?: string;
  languages?: string[];
  city: string;
  address?: string;
  clinicLocation?: string | null;
  qualifications: string;
  experience: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  availableFrom: string;
  availableTo: string;
  workingDays: string[];
  isPlatformVerified: boolean;
  completedAppointmentsCount: number;
  nextAvailableAt?: string | null;
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: DoctorReview }) {
  return (
    <div className="rounded-xl border border-border/60 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {review.patientInitial}
          </div>
          <StarDisplay rating={review.rating} size="sm" />
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
      {review.comment && <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>}
    </div>
  );
}

function RatingSummary({ avgRating, total }: { avgRating: number | null; total: number }) {
  if (total === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <MessageSquare className="mx-auto h-10 w-10 mb-3 opacity-25" />
        <p className="font-medium">No reviews yet</p>
        <p className="text-sm mt-1">Be the first — book an appointment and share your experience.</p>
      </div>
    );
  }

  const avg = avgRating ?? 0;
  const distribution = [5, 4, 3, 2, 1];

  return (
    <div className="flex items-center gap-6">
      <div className="text-center shrink-0">
        <div className="text-5xl font-bold text-foreground">{avg.toFixed(1)}</div>
        <StarDisplay rating={avg} />
        <p className="text-xs text-muted-foreground mt-1">{total} review{total !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 space-y-1">
        {distribution.map((star) => (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-right text-muted-foreground">{star}</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{
                  width: total > 0 ? `${Math.round(((avg >= star - 0.5 && avg < star + 0.5 ? total * 0.4 : star === Math.round(avg) ? total * 0.5 : total * 0.1) / total) * 100)}%` : "0%",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [bookingConfig, setBookingConfig] = useState({ callBookingEnabled: false });

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then((res) => setDoctor(res.data))
      .catch(() => router.replace("/patient/doctors"))
      .finally(() => setLoadingDoctor(false));

    api.get("/config/booking")
      .then((r) => setBookingConfig(r.data))
      .catch(() => {});

    fetchReviews(1);
  }, [id]);

  async function fetchReviews(page: number) {
    setLoadingReviews(true);
    try {
      const data = await getDoctorReviews(id, page);
      setReviews((prev) => (page === 1 ? data.reviews : [...prev, ...data.reviews]));
      setReviewsTotal(data.total);
      setAvgRating(data.avgRating);
      setReviewTotalPages(data.totalPages);
      setReviewPage(page);
    } catch {}
    finally { setLoadingReviews(false); }
  }

  function buildBookingUrl() {
    const params = new URLSearchParams({ doctorId: id, doctorName: `Dr. ${doctor?.fullName ?? ""}` });
    if (doctor?.nextAvailableAt) {
      const d = new Date(doctor.nextAvailableAt);
      params.set("date", d.toISOString().split("T")[0]);
      params.set("slot", `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    }
    return `/patient/appointments?${params.toString()}`;
  }

  if (loadingDoctor) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctor) return null;

  const displayRating = doctor.rating;

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back to doctors
      </Button>

      {/* Header card */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">Dr. {doctor.fullName}</h1>
                {doctor.isPlatformVerified && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <Badge variant="secondary" className="text-sm">{doctor.specialty?.name}</Badge>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold">{displayRating > 0 ? displayRating.toFixed(1) : "New"}</span>
                {doctor.reviewCount > 0 && (
                  <span className="text-sm text-muted-foreground">({doctor.reviewCount} reviews)</span>
                )}
              </div>
              {doctor.completedAppointmentsCount > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" />
                  {doctor.completedAppointmentsCount} consultations
                </span>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{doctor.city}{doctor.clinicLocation ? ` · ${doctor.clinicLocation}` : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{doctor.experience} years experience</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>Rs. {doctor.consultationFee} consultation fee</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{doctor.availableFrom}–{doctor.availableTo} · {doctor.workingDays.join(", ")}</span>
            </div>
          </div>

          {doctor.qualifications && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{doctor.qualifications}</p>
          )}

          {doctor.languages && doctor.languages.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
              {doctor.languages.map((l) => (
                <span key={l} className="text-xs bg-muted rounded px-2 py-0.5 text-muted-foreground">{l}</span>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="flex-1 min-w-[140px]">
              <Link href={buildBookingUrl()}>
                <Calendar className="mr-2 h-4 w-4" />
                Book Appointment
              </Link>
            </Button>
            {bookingConfig.callBookingEnabled && (
              <Button variant="secondary" asChild className="gap-2">
                <Link href={`/patient/doctors?ai=${id}`}>
                  <PhoneCall className="h-4 w-4" />
                  AI Assistant
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews section */}
      <Card className="border-border/50 shadow-sm" id="reviews">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            Patient Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RatingSummary avgRating={avgRating} total={reviewsTotal} />

          {reviews.length > 0 && (
            <div className="space-y-3 border-t border-border/50 pt-5">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
              {reviewPage < reviewTotalPages && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={loadingReviews}
                  onClick={() => fetchReviews(reviewPage + 1)}
                >
                  {loadingReviews ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more reviews"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
