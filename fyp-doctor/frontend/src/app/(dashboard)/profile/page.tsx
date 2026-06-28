"use client";

import { useEffect, useState } from "react";
import { User, Save, Star, MessageSquare, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import api from "@/lib/api";
import type { Doctor } from "@/types";

interface DoctorReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  patientInitial: string;
}

interface ReviewSummary {
  avgRating: number | null;
  total: number;
  page: number;
  totalPages: number;
  reviews: DoctorReview[];
}

const LANGUAGE_OPTIONS = ["English", "Urdu", "Punjabi", "Sindhi", "Pashto", "Balochi"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<Doctor>>({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    qualifications: "",
    experience: 0,
    consultationFee: 0,
    gender: undefined,
    languages: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchReviews(1);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/doctor/profile");
      setProfile(response.data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      await api.put("/doctor/profile", profile);
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const fetchReviews = async (page: number) => {
    setLoadingReviews(true);
    try {
      const res = await api.get(`/doctor/reviews?page=${page}&limit=5`);
      setReviewSummary((prev) => ({
        ...res.data,
        reviews: page === 1 ? res.data.reviews : [...(prev?.reviews ?? []), ...res.data.reviews],
      }));
      setReviewPage(page);
    } catch {}
    finally { setLoadingReviews(false); }
  };

  const handleChange = (field: string, value: string | number | string[]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-40 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your professional information
        </p>
      </motion.div>

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
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <div
              className={`p-3 rounded-lg ${
                message.includes("success")
                  ? "bg-green-500/10 text-green-600"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {message}
            </div>
          )}

          {profile.specialty && (
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border/60">
              <span className="text-sm font-medium text-muted-foreground">Specialty</span>
              <Badge variant="secondary" className="text-sm font-semibold">{profile.specialty.name}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">Contact admin to change</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone
              </label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="qualifications" className="text-sm font-medium">
                Qualifications
              </label>
              <Input
                id="qualifications"
                value={profile.qualifications}
                onChange={(e) => handleChange("qualifications", e.target.value)}
                placeholder="e.g., MBBS, MD"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="experience" className="text-sm font-medium">
                Years of Experience
              </label>
              <Input
                id="experience"
                type="number"
                value={profile.experience}
                onChange={(e) =>
                  handleChange("experience", parseInt(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="consultationFee" className="text-sm font-medium">
                Consultation Fee (Rs.)
              </label>
              <Input
                id="consultationFee"
                type="number"
                value={profile.consultationFee}
                onChange={(e) =>
                  handleChange("consultationFee", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium">Gender</label>
              <select
                id="gender"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={profile.gender ?? ""}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Languages Spoken</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const selected = (profile.languages ?? []).includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      const current = profile.languages ?? [];
                      handleChange(
                        "languages",
                        selected ? current.filter((l) => l !== lang) : [...current, lang]
                      );
                    }}
                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>
      </motion.div>

      {/* Patient Reviews */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              Patient Reviews
            </CardTitle>
            {reviewSummary && reviewSummary.total > 0 && (
              <CardDescription>
                {reviewSummary.avgRating?.toFixed(1)} average · {reviewSummary.total} review{reviewSummary.total !== 1 ? "s" : ""}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {reviewSummary === null && loadingReviews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : !reviewSummary || reviewSummary.total === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquare className="mx-auto h-10 w-10 mb-3 opacity-25" />
                <p className="font-medium">No patient reviews yet</p>
                <p className="text-sm mt-1">Reviews will appear here once patients complete appointments with you.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewSummary.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {r.patientInitial}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-foreground">{r.comment}</p>}
                  </div>
                ))}
                {reviewPage < reviewSummary.totalPages && (
                  <Button variant="outline" className="w-full" disabled={loadingReviews} onClick={() => fetchReviews(reviewPage + 1)}>
                    {loadingReviews ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
