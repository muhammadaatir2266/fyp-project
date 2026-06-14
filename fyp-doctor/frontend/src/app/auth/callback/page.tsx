"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3003";

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      window.location.replace(`${WEBSITE_URL}/login`);
      return;
    }

    // Strip the token from the URL immediately (security)
    window.history.replaceState({}, "", "/auth/callback");

    try {
      if (token.split(".").length !== 3) throw new Error("Invalid token");
      setToken(token);
    } catch {
      window.location.replace(`${WEBSITE_URL}/login`);
      return;
    }

    window.location.replace("/dashboard");
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
