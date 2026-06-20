"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { setAuthToken, setCurrentUser, parseJwtPayload } from "@/lib/auth";
import { resolvePostAuthPath } from "@/lib/guest-handoff";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3003";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    // Guard against the double-run that happens when replaceState strips the query string,
    // which causes Next.js to re-render with empty searchParams and redirect to /login.
    if (processed.current) return;
    processed.current = true;

    // Read all params before touching the URL
    const token = searchParams.get("token");
    const guestSessionId = searchParams.get("guestSessionId");
    const destination = resolvePostAuthPath(searchParams);

    if (!token || token.split(".").length !== 3) {
      window.location.replace(`${WEBSITE_URL}/login`);
      return;
    }

    try {
      const payload = parseJwtPayload(token);
      // Persist session before stripping the URL
      setAuthToken(token);
      setCurrentUser({ id: payload.userId as string, email: payload.email as string, role: payload.role as "PATIENT" });
    } catch {
      window.location.replace(`${WEBSITE_URL}/login`);
      return;
    }

    // Strip token from URL after saving session (security)
    window.history.replaceState({}, "", "/auth/callback");

    if (guestSessionId) {
      fetch(`${API_URL}/chat/guest/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ guestSessionId }),
      })
        .catch(() => {})
        .finally(() => window.location.replace(destination));
    } else {
      window.location.replace(destination);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-muted-foreground text-sm font-medium">Setting up your session…</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <svg className="animate-spin w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
