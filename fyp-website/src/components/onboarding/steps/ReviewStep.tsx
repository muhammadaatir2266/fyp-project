"use client";

import { Stethoscope } from "lucide-react";
import type { PatientWizardData } from "@/lib/patient-onboarding";
import type { GuestContext } from "@/lib/guest-session";

interface Props {
  data: PatientWizardData;
  guestContext: GuestContext | null;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-sm">
      <span className="text-muted-foreground sm:w-32 shrink-0">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-foreground mb-3 pb-2 border-b text-sm">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

const GENDER_LABELS: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

export function ReviewStep({ data, guestContext }: Props) {
  return (
    <div className="space-y-6 text-sm">
      {/* Guest predictions banner */}
      {guestContext && guestContext.predictions.length > 0 && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" />
            Your Symptom Analysis Results
          </p>
          <div className="space-y-2">
            {guestContext.predictions.map((pred, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{pred.disease}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-amber-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.round(pred.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-right">
                    {Math.round(pred.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          {guestContext.specialty && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Recommended specialist: <strong>{guestContext.specialty}</strong>
            </p>
          )}
        </div>
      )}

      <Section title="Account">
        <Row label="Name" value={`${data.firstName} ${data.lastName}`} />
        <Row label="Email" value={data.email} />
      </Section>

      <Section title="Contact">
        <Row label="Phone" value={data.phone} />
        <Row label="City" value={data.city} />
        {data.address && <Row label="Address" value={data.address} />}
      </Section>

      {(data.dateOfBirth || data.gender) && (
        <Section title="About You">
          {data.dateOfBirth && <Row label="Date of Birth" value={data.dateOfBirth} />}
          {data.gender && <Row label="Gender" value={GENDER_LABELS[data.gender] ?? data.gender} />}
        </Section>
      )}

      {(data.medicalHistory || data.allergies) && (
        <Section title="Health">
          {data.medicalHistory && <Row label="Medical History" value={data.medicalHistory} />}
          {data.allergies && <Row label="Allergies" value={data.allergies} />}
        </Section>
      )}

      <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 text-xs text-muted-foreground">
        By creating your account you agree to DocLink&apos;s Terms of Service and Privacy Policy. Your
        health information is encrypted and never shared without your consent.
      </div>
    </div>
  );
}
