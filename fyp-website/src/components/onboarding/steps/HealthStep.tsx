"use client";

import type { PatientWizardData } from "@/lib/patient-onboarding";

const textareaCls =
  "w-full rounded-xl border border-input bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none";

interface Props {
  data: PatientWizardData;
  onChange: (patch: Partial<PatientWizardData>) => void;
}

export function HealthStep({ data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-sm text-muted-foreground">
        Both fields are completely optional. Providing them lets doctors understand your background
        before your first appointment.
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Medical History</label>
        <textarea
          rows={4}
          className={textareaCls}
          placeholder="Any chronic conditions, past surgeries, or ongoing treatments…"
          value={data.medicalHistory}
          onChange={(e) => onChange({ medicalHistory: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Known Allergies</label>
        <textarea
          rows={3}
          className={textareaCls}
          placeholder="Medication, food, or environmental allergies…"
          value={data.allergies}
          onChange={(e) => onChange({ allergies: e.target.value })}
        />
      </div>
    </div>
  );
}
