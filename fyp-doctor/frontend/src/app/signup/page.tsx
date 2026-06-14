"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  Upload,
  FileText,
  X,
  User,
  Mail,
  Phone,
  Award,
  MapPin,
  Building2,
  Lock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
    clinicLocation: "",
    address: "",
    city: "",
  });
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a PDF, JPG, or PNG file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setVerificationDocument(file);
      setError("");
    }
  };

  const removeFile = () => setVerificationDocument(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!verificationDocument) {
      setError("Please upload a verification document (license, certificate, etc.)");
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (key !== "confirmPassword") formDataToSend.append(key, val);
      });
      formDataToSend.append("verificationDocument", verificationDocument);

      await api.post("/auth/signup", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ─────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-border/50 shadow-2xl">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/30"
              >
                <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Application Submitted!</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Your doctor registration has been submitted for review.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
                <ul className="space-y-3 text-muted-foreground">
                  {[
                    "Our admin team will review your credentials and documents",
                    "Verification typically takes 1–2 business days",
                    "You'll receive an email notification with the decision",
                    "Once approved, you can log in and start managing appointments",
                  ].map((step) => (
                    <li key={step} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ── Form ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <Link
        href={websiteUrl}
        className="absolute top-6 left-6 flex items-center gap-3 z-50 group"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
          <img src="/logo.png" alt="Trimed Al" className="h-full w-full object-cover" />
        </div>
        <div className="hidden sm:block">
          <div className="text-lg font-bold text-foreground">Trimed Al</div>
          <div className="text-xs text-muted-foreground">Doctor Portal</div>
        </div>
      </Link>

      <div className="max-w-4xl mx-auto pt-20 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Award className="w-4 h-4" />
            Professional Registration
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Join Trimed Al</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete your application to become a verified healthcare provider on our platform
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-2xl">
            <CardHeader className="border-b border-border/50 bg-primary/5 p-8">
              <CardTitle className="text-2xl text-foreground">Application Form</CardTitle>
              <CardDescription className="text-base">
                Please provide accurate information. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                  >
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </motion.div>
                )}

                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
                        First Name *
                      </label>
                      <Input id="firstName" name="firstName" type="text" placeholder="John"
                        value={formData.firstName} onChange={handleChange} required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
                        Last Name *
                      </label>
                      <Input id="lastName" name="lastName" type="text" placeholder="Smith"
                        value={formData.lastName} onChange={handleChange} required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="email" name="email" type="email" placeholder="doctor@example.com"
                          value={formData.email} onChange={handleChange} required className="h-12 pl-11" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000"
                          value={formData.phone} onChange={handleChange} required className="h-12 pl-11" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-6 pt-6 border-t border-border/50">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Professional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="specialization" className="block text-sm font-medium text-foreground">
                        Specialization *
                      </label>
                      <Input id="specialization" name="specialization" type="text"
                        placeholder="e.g., Cardiology, Dermatology"
                        value={formData.specialization} onChange={handleChange} required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="licenseNumber" className="block text-sm font-medium text-foreground">
                        Medical License Number *
                      </label>
                      <Input id="licenseNumber" name="licenseNumber" type="text" placeholder="MD123456"
                        value={formData.licenseNumber} onChange={handleChange} required className="h-12" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="clinicLocation" className="block text-sm font-medium text-foreground">
                        Clinic / Hospital Name *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="clinicLocation" name="clinicLocation" type="text"
                          placeholder="e.g., Downtown Medical Center"
                          value={formData.clinicLocation} onChange={handleChange} required className="h-12 pl-11" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-6 pt-6 border-t border-border/50">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Location Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="address" className="block text-sm font-medium text-foreground">
                        Street Address *
                      </label>
                      <Input id="address" name="address" type="text" placeholder="123 Medical Center Dr"
                        value={formData.address} onChange={handleChange} required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="city" className="block text-sm font-medium text-foreground">
                        City *
                      </label>
                      <Input id="city" name="city" type="text" placeholder="New York"
                        value={formData.city} onChange={handleChange} required className="h-12" />
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="space-y-6 pt-6 border-t border-border/50">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Account Security
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-foreground">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="password" name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 characters"
                          value={formData.password} onChange={handleChange} required className="h-12 pl-11 pr-12" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="confirmPassword" name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword} onChange={handleChange} required className="h-12 pl-11 pr-12" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="space-y-4 pt-6 border-t border-border/50">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Verification Document *
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your medical license, degree certificate, or any official document for verification
                  </p>
                  <div className="border-2 border-dashed border-border/60 rounded-xl p-8 hover:border-primary/50 transition-colors bg-muted/30">
                    {!verificationDocument ? (
                      <label htmlFor="document" className="cursor-pointer flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center">
                          <span className="text-base font-medium text-foreground">
                            Click to upload or drag and drop
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">PDF, JPG, or PNG (max 5MB)</p>
                        </div>
                        <input id="document" type="file" accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange} className="hidden" />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{verificationDocument.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(verificationDocument.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={removeFile}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                          <X className="w-5 h-5 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-6">
                  <Button type="submit" disabled={loading}
                    className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                    {loading ? (
                      <><Loader2 className="h-5 w-5 animate-spin mr-2" />Submitting Application...</>
                    ) : (
                      <><CheckCircle2 className="mr-2 w-5 h-5" />Submit Application</>
                    )}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    By submitting, you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:text-accent font-medium transition-colors">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:text-accent font-medium transition-colors">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link
              href={`${process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3003"}/login`}
              className="text-primary hover:text-accent font-semibold transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
