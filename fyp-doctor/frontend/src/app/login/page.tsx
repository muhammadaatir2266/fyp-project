"use client";

import { useEffect } from "react";

export default function LoginRedirect() {
  useEffect(() => {
    const websiteUrl =
      process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3003";
    window.location.replace(`${websiteUrl}/login`);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-muted-foreground text-sm">Redirecting to login…</p>
      </div>
    </div>
  );
}
