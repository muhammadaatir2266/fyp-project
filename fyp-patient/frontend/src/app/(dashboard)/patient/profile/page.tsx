"use client";

import { useState, useEffect } from "react";
import api from "@/services/api.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  emergencyContact: string;
  medicalHistory: string;
  allergies: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    api.get("/profile")
      .then((res) => {
        setProfile(res.data);
        setForm(res.data);
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof Profile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/profile", {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        address: form.address,
        city: form.city,
        emergencyContact: form.emergencyContact,
        medicalHistory: form.medicalHistory,
        allergies: form.allergies,
      });
      setProfile(res.data);
      toast.success("Profile updated successfully");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal and medical information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{profile?.firstName} {profile?.lastName}</CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">First Name</label>
              <Input value={form.firstName || ""} onChange={(e) => handleChange("firstName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Last Name</label>
              <Input value={form.lastName || ""} onChange={(e) => handleChange("lastName", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phone</label>
              <Input value={form.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date of Birth</label>
              <Input
                type="date"
                value={form.dateOfBirth ? new Date(form.dateOfBirth).toISOString().split("T")[0] : ""}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Gender</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.gender || ""}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">City</label>
              <Input value={form.city || ""} onChange={(e) => handleChange("city", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Address</label>
            <Input value={form.address || ""} onChange={(e) => handleChange("address", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Emergency Contact</label>
            <Input value={form.emergencyContact || ""} onChange={(e) => handleChange("emergencyContact", e.target.value)} placeholder="Name / Phone" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Medical History</label>
            <Textarea
              rows={3}
              value={form.medicalHistory || ""}
              onChange={(e) => handleChange("medicalHistory", e.target.value)}
              placeholder="Any past diagnoses, surgeries, or chronic conditions..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Allergies</label>
            <Input value={form.allergies || ""} onChange={(e) => handleChange("allergies", e.target.value)} placeholder="e.g. Penicillin, Peanuts, None" />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
