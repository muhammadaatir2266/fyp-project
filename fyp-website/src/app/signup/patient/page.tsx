"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getGuestContext } from "@/lib/guest-session";

function PatientSignupRedirectInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const patientAppUrl = process.env.NEXT_PUBLIC_PATIENT_APP_URL || "http://localhost:3000";

    // Carry guest params across origin
    const ctx = getGuestContext();
    const specialty = ctx?.specialty ?? searchParams.get("specialty") ?? null;
    const guestSessionId = ctx?.guestSessionId ?? searchParams.get("guestSessionId") ?? null;
    const fromGuest = searchParams.get("from") === "guest" || !!ctx;

    const params = new URLSearchParams();
    if (fromGuest) params.set("from", "guest");
    if (specialty) params.set("specialty", specialty);
    if (guestSessionId) params.set("guestSessionId", guestSessionId);

    const qs = params.toString();
    window.location.href = `${patientAppUrl}/signup${qs ? `?${qs}` : ""}`;
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-teal mx-auto mb-4" />
        <p className="text-medical-teal/70">Redirecting to patient signup…</p>
      </div>
    </div>
  );
}

export default function PatientSignupRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-teal mx-auto" />
      </div>
    }>
      <PatientSignupRedirectInner />
    </Suspense>
  );
}
