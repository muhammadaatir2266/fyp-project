"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api.service";
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
  Search,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Calendar,
  Loader2,
} from "lucide-react";
import Link from "next/link";

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
}

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [total, setTotal] = useState(0);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.name = search;
      if (specialtyFilter) params.specialty = specialtyFilter;
      if (cityFilter) params.city = cityFilter;
      const res = await api.get("/doctors", { params });
      setDoctors(res.data.doctors);
      setTotal(res.data.total);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [search, specialtyFilter, cityFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchDoctors, 400);
    return () => clearTimeout(timer);
  }, [fetchDoctors]);

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find a Specialist</h1>
        <p className="text-muted-foreground mt-1">
          {total > 0 ? `${total} verified doctors available` : "Search for doctors by name, specialty, or city"}
        </p>
      </div>

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
          <p className="text-sm">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Dr. {doctor.fullName}</CardTitle>
                    <CardDescription className="mt-0.5">
                      <Badge variant="secondary" className="text-xs">
                        {doctor.specialty?.name}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-semibold text-foreground">{doctor.rating?.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({doctor.reviewCount})</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{doctor.qualifications}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {doctor.city}
                  </span>
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
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/patient/appointments?doctorId=${doctor.id}&doctorName=${encodeURIComponent('Dr. ' + doctor.fullName)}`}>
                      <Calendar className="mr-1.5 h-3.5 w-3.5" />
                      Book Appointment
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
