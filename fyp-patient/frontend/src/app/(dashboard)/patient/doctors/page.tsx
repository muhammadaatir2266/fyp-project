"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/services/api.service";
import { getDoctorReviews, type DoctorReview } from "@/services/reviews.service";
import { getPatientLocation, clearPatientLocation, type PatientLocation } from "@/lib/location";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Calendar,
  Loader2,
  X,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  LocateFixed,
  Navigation,
} from "lucide-react";
import Link from "next/link";

const RADIUS_OPTIONS = [5, 10, 25, 50];

interface Doctor {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  specialty: { id: string; name: string };
  city: string;
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
  distanceKm?: number;
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      <Star className="h-4 w-4 fill-current" />
      <span className="text-sm font-semibold text-foreground">{rating > 0 ? rating.toFixed(1) : "New"}</span>
      {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}

function ReviewsSheet({
  doctor,
  open,
  onClose,
}: {
  doctor: Doctor | null;
  open: boolean;
  onClose: () => void;
}) {
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!open || !doctor) return;
    setReviews([]);
    setPage(1);
    loadReviews(doctor.id, 1);
  }, [open, doctor]);

  async function loadReviews(id: string, p: number) {
    setLoading(true);
    try {
      const data = await getDoctorReviews(id, p);
      setReviews((prev) => (p === 1 ? data.reviews : [...prev, ...data.reviews]));
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {}
    finally { setLoading(false); }
  }

  function loadMore() {
    if (!doctor || page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    loadReviews(doctor.id, next);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>
            {doctor ? `Reviews — Dr. ${doctor.fullName}` : "Reviews"}
          </SheetTitle>
          {doctor && (
            <p className="text-sm text-muted-foreground">
              {doctor.rating > 0
                ? `${doctor.rating.toFixed(1)} avg from ${total} review${total !== 1 ? "s" : ""}`
                : "No reviews yet"}
            </p>
          )}
        </SheetHeader>

        {loading && reviews.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {r.patientInitial} · {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-foreground">{r.comment}</p>}
              </div>
            ))}
            {page < totalPages && (
              <Button variant="outline" className="w-full" onClick={loadMore} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DoctorsContent() {
  const searchParams = useSearchParams();
  const specialtyFromUrl = searchParams.get("specialty") ?? "";
  const nearbyFromUrl = searchParams.get("nearby") === "1";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState(specialtyFromUrl);
  const [cityFilter, setCityFilter] = useState("");
  const [total, setTotal] = useState(0);

  // Location state
  const [locationMode, setLocationMode] = useState<"idle" | "loading" | "gps" | "city" | "denied">("idle");
  const [patientLoc, setPatientLoc] = useState<PatientLocation>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [nearbyEnabled, setNearbyEnabled] = useState(nearbyFromUrl);

  const [reviewsDoctor, setReviewsDoctor] = useState<Doctor | null>(null);
  const locationInitialized = useRef(false);

  useEffect(() => {
    setSpecialtyFilter(specialtyFromUrl);
  }, [specialtyFromUrl]);

  // Auto-request location on mount (or when nearby mode is triggered from URL)
  useEffect(() => {
    if (locationInitialized.current) return;
    locationInitialized.current = true;
    requestLocation();
  }, []);

  async function requestLocation() {
    setLocationMode("loading");
    const loc = await getPatientLocation();
    setPatientLoc(loc);
    if (!loc) {
      setLocationMode("denied");
    } else if (loc.mode === "gps") {
      setLocationMode("gps");
      setNearbyEnabled(true);
    } else {
      setLocationMode("city");
      // city fallback: pre-fill city filter and keep nearby off
      setCityFilter(loc.city);
    }
  }

  function disableNearby() {
    setNearbyEnabled(false);
    clearPatientLocation();
    setPatientLoc(null);
    setLocationMode("idle");
  }

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.name = search;
      if (specialtyFilter) params.specialty = specialtyFilter;

      if (nearbyEnabled && patientLoc?.mode === "gps") {
        params.lat = String(patientLoc.lat);
        params.lng = String(patientLoc.lng);
        params.radiusKm = String(radiusKm);
      } else if (cityFilter) {
        params.city = cityFilter;
      }

      const res = await api.get("/doctors", { params });
      setDoctors(res.data.doctors);
      setTotal(res.data.total);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [search, specialtyFilter, cityFilter, nearbyEnabled, patientLoc, radiusKm]);

  useEffect(() => {
    const timer = setTimeout(fetchDoctors, 400);
    return () => clearTimeout(timer);
  }, [fetchDoctors]);

  const gpsActive = nearbyEnabled && patientLoc?.mode === "gps";

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find a Specialist</h1>
        <p className="text-muted-foreground mt-1">
          {total > 0 ? `${total} verified doctors available` : "Search for doctors by name, specialty, or location"}
        </p>
      </div>

      {/* Location controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={gpsActive ? "default" : "outline"}
          size="sm"
          className="gap-2 h-9"
          onClick={requestLocation}
          disabled={locationMode === "loading"}
        >
          {locationMode === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4" />
          )}
          {gpsActive ? "Using my location" : "Use my location"}
        </Button>

        {/* Radius selector — only visible when GPS is active */}
        {gpsActive && (
          <div className="flex items-center gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={radiusKm === r ? "secondary" : "ghost"}
                className="h-8 px-2.5 text-xs"
                onClick={() => setRadiusKm(r)}
              >
                {r} km
              </Button>
            ))}
          </div>
        )}

        {gpsActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground gap-1"
            onClick={disableNearby}
          >
            <X className="h-3.5 w-3.5" />
            Disable nearby
          </Button>
        )}
      </div>

      {/* Active nearby banner */}
      {gpsActive && (
        <div className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
          <Navigation className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            Showing doctors within <span className="font-semibold text-foreground">{radiusKm} km</span> of your location
          </span>
        </div>
      )}

      {/* GPS denied / city fallback banner */}
      {locationMode === "city" && patientLoc?.mode === "city" && (
        <div className="flex items-center gap-2 text-sm bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-2.5">
          <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-muted-foreground">
            Location unavailable — showing doctors in{" "}
            <span className="font-semibold text-foreground">{patientLoc.city}</span>
          </span>
        </div>
      )}

      {/* Active specialty filter banner */}
      {specialtyFromUrl && (
        <div className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
          <span className="text-muted-foreground">Filtering by specialty:</span>
          <Badge variant="secondary" className="font-medium">{specialtyFromUrl}</Badge>
          <Link
            href="/patient/doctors"
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear filter
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input
          placeholder="Specialty (e.g. Cardiology)"
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
        />
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="City"
            className="pl-9"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            disabled={gpsActive}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No doctors found</p>
          {gpsActive ? (
            <p className="text-sm">
              No doctors with coordinates within {radiusKm} km. Try widening the radius or{" "}
              <button className="underline" onClick={disableNearby}>disable nearby mode</button>.
            </p>
          ) : (
            <p className="text-sm">Try adjusting your search filters</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">Dr. {doctor.fullName}</CardTitle>
                      {doctor.isPlatformVerified && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="h-3 w-3" />
                          Platform Verified
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-0.5">
                      <Badge variant="secondary" className="text-xs">
                        {doctor.specialty?.name}
                      </Badge>
                    </CardDescription>
                  </div>
                  <StarRow rating={doctor.rating} count={doctor.reviewCount} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{doctor.qualifications}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {doctor.city}
                  </span>
                  {doctor.distanceKm !== undefined && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Navigation className="h-3.5 w-3.5" />
                      {doctor.distanceKm} km away
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {doctor.experience} yrs exp
                  </span>
                  {doctor.consultationFee && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      Rs. {doctor.consultationFee}
                    </span>
                  )}
                  {doctor.completedAppointmentsCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {doctor.completedAppointmentsCount} consultations
                    </span>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/patient/appointments?doctorId=${doctor.id}&doctorName=${encodeURIComponent('Dr. ' + doctor.fullName)}`}>
                      <Calendar className="mr-1.5 h-3.5 w-3.5" />
                      Book Appointment
                    </Link>
                  </Button>
                  {doctor.reviewCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs"
                      onClick={() => setReviewsDoctor(doctor)}
                    >
                      <Star className="h-3.5 w-3.5" />
                      Reviews
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReviewsSheet
        doctor={reviewsDoctor}
        open={!!reviewsDoctor}
        onClose={() => setReviewsDoctor(null)}
      />
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DoctorsContent />
    </Suspense>
  );
}
