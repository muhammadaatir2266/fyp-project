"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to patient app login
    const patientAppUrl = process.env.NEXT_PUBLIC_PATIENT_APP_URL || "http://localhost:3000";
    window.location.href = `${patientAppUrl}/login`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-teal mx-auto mb-4"></div>
        <p className="text-medical-teal/70">Redirecting to login...</p>
      </div>
    </div>
  );
}
