"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { AccountStep } from "./steps/AccountStep";
import { ContactStep } from "./steps/ContactStep";
import { ProfileStep } from "./steps/ProfileStep";
import { HealthStep } from "./steps/HealthStep";
import { ReviewStep } from "./steps/ReviewStep";
import {
  INITIAL_WIZARD_DATA,
  STEP_TITLES,
  validateStep,
  type PatientWizardData,
} from "@/lib/patient-onboarding";
import {
  getGuestContext,
  clearGuestContext,
  type GuestContext,
} from "@/lib/guest-session";
import { signupPatient, getRedirectUrl } from "@/lib/auth";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:5000/api";

interface Props {
  /** Query params forwarded from the URL (from, specialty, guestSessionId) */
  urlFrom?: string;
  urlSpecialty?: string;
  urlGuestSessionId?: string;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0 }),
};

export function PatientSignupWizard({ urlFrom, urlSpecialty, urlGuestSessionId }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<PatientWizardData>(INITIAL_WIZARD_DATA);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guestContext, setGuestContext] = useState<GuestContext | null>(null);

  // Resolve guest context once on client
  useEffect(() => {
    const ctx = getGuestContext();
    setGuestContext(ctx);
  }, []);

  const specialty = guestContext?.specialty ?? urlSpecialty;
  const guestSessionId = guestContext?.guestSessionId ?? urlGuestSessionId;
  const fromGuest = urlFrom === "guest" || !!guestContext;

  const patch = (update: Partial<PatientWizardData>) => {
    setData((prev) => ({ ...prev, ...update }));
    setStepError(null);
  };

  const goTo = (next: number) => {
    if (next > step) {
      const err = validateStep(step, data);
      if (err) { setStepError(err); return; }
    }
    setStepError(null);
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleSubmit = async () => {
    const err = validateStep(step, data);
    if (err) { setStepError(err); return; }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const { token, user } = await signupPatient({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender || undefined,
        city: data.city || undefined,
        address: data.address || undefined,
        medicalHistory: data.medicalHistory || undefined,
        allergies: data.allergies || undefined,
      });

      // Claim guest snapshot if we arrived from guest chat
      if (guestSessionId && token) {
        try {
          await fetch(`${AUTH_API_URL}/chat/guest/claim`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ guestSessionId }),
          });
        } catch {
          // Non-fatal — patient account still created
        }
      }

      // Clean up guest state before leaving website
      clearGuestContext();

      const guestOpts =
        fromGuest && (specialty || guestSessionId)
          ? { specialty, guestSessionId, redirect: "doctors" as const }
          : undefined;

      window.location.href = getRedirectUrl(user.role as "PATIENT", token, guestOpts);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = step === STEP_TITLES.length - 1;

  return (
    <div className="w-full">
      {/* Guest specialty banner */}
      {fromGuest && specialty && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3"
        >
          <span className="mt-0.5 text-primary text-lg">🩺</span>
          <p className="text-sm text-primary font-medium">
            Create your account to find a <strong>{specialty}</strong> near you and book an
            appointment based on your symptom results.
          </p>
        </motion.div>
      )}

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEP_TITLES.map((title, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => i < step && goTo(i)}
                  disabled={i >= step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    i < step
                      ? "bg-primary border-primary text-primary-foreground cursor-pointer"
                      : i === step
                      ? "bg-background border-primary text-primary"
                      : "bg-muted/30 border-muted text-muted-foreground cursor-default"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </button>
                <span
                  className={`text-[10px] font-medium hidden sm:block ${
                    i === step
                      ? "text-primary"
                      : i < step
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {title}
                </span>
              </div>
              {i < STEP_TITLES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/20">
          <h2 className="text-base font-semibold text-foreground">
            Step {step + 1}: {STEP_TITLES[step]}
          </h2>
        </div>

        <div className="px-6 py-6 min-h-[320px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {step === 0 && <AccountStep data={data} onChange={patch} />}
              {step === 1 && <ContactStep data={data} onChange={patch} />}
              {step === 2 && <ProfileStep data={data} onChange={patch} />}
              {step === 3 && <HealthStep data={data} onChange={patch} />}
              {step === 4 && <ReviewStep data={data} guestContext={guestContext} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error */}
        {(stepError || submitError) && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {stepError ?? submitError}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="px-6 py-4 border-t bg-muted/10 flex justify-between items-center">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
