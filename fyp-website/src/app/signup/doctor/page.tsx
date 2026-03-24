"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DoctorSignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to doctor app signup
    const doctorAppUrl = process.env.NEXT_PUBLIC_DOCTOR_APP_URL || "http://localhost:3001";
    window.location.href = `${doctorAppUrl}/signup`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50/50 via-emerald-50/30 to-cyan-50/50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecting to doctor signup...</p>
      </div>
    </div>
  );
}
