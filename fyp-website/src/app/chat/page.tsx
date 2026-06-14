"use client";

import { useEffect, useState } from "react";
import GuestChatInterface from "@/components/chat/GuestChatInterface";
import { isGuestChatCompleted } from "@/lib/guest-session";

const PATIENT_APP_URL =
  process.env.NEXT_PUBLIC_PATIENT_APP_URL || "http://localhost:3000";

type AccessState = "loading" | "allowed" | "redirect_patient" | "redirect_login";

export default function ChatPage() {
  const [access, setAccess] = useState<AccessState>("loading");

  useEffect(() => {
    // If the user has a patient auth token they're a logged-in patient
    const token = localStorage.getItem("authToken");
    if (token) {
      setAccess("redirect_patient");
      window.location.replace(`${PATIENT_APP_URL}/patient/chat`);
      return;
    }

    // If guest session was already used (disease detected), send to login
    if (isGuestChatCompleted()) {
      setAccess("redirect_login");
      window.location.replace("/login?reason=guest_expired");
      return;
    }

    setAccess("allowed");
  }, []);

  if (access === "loading" || access === "redirect_patient" || access === "redirect_login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Subtle background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-screen max-w-4xl mx-auto w-full">
        <GuestChatInterface />
      </div>
    </div>
  );
}
