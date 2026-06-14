"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function SignupRedirectInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const websiteUrl =
      process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3003";

    // Forward any guest params that may have been passed directly to this URL
    const params = new URLSearchParams();
    const from = searchParams.get("from");
    const specialty = searchParams.get("specialty");
    const guestSessionId = searchParams.get("guestSessionId");
    if (from) params.set("from", from);
    if (specialty) params.set("specialty", specialty);
    if (guestSessionId) params.set("guestSessionId", guestSessionId);

    const qs = params.toString();
    window.location.replace(`${websiteUrl}/signup/patient${qs ? `?${qs}` : ""}`);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-muted-foreground text-sm">Redirecting to signup…</p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      }
    >
      <SignupRedirectInner />
    </Suspense>
  );
}
