"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PatientSignupWizard } from "@/components/onboarding/PatientSignupWizard";

function PatientSignupInner() {
  const searchParams = useSearchParams();
  const websiteUrl = process.env.NEXT_PUBLIC_ROOT_URL || "/";

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50/50 via-background to-emerald-50/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
        <Link href={websiteUrl} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm">
            <img src="/logo.png" alt="DocLink" className="h-full w-full object-cover" />
          </div>
          <span className="font-bold text-foreground text-base hidden sm:block">DocLink</span>
        </Link>
        <span className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </span>
      </header>

      <main className="py-10 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Create Your Patient Account</h1>
            <p className="text-muted-foreground text-sm">
              Complete your profile in a few quick steps and get matched with the right doctor.
            </p>
          </div>

          <PatientSignupWizard
            urlFrom={searchParams.get("from") ?? undefined}
            urlSpecialty={searchParams.get("specialty") ?? undefined}
            urlGuestSessionId={searchParams.get("guestSessionId") ?? undefined}
          />

          <p className="text-center text-xs text-muted-foreground mt-6">
            Are you a doctor?{" "}
            <Link href="/signup/doctor" className="text-primary hover:underline">
              Apply here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PatientSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      }
    >
      <PatientSignupInner />
    </Suspense>
  );
}
