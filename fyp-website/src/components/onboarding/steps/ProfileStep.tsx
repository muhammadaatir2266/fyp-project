"use client";

import { GENDER_OPTIONS, type PatientWizardData } from "@/lib/patient-onboarding";

const inputCls =
  "w-full h-11 rounded-xl border border-input bg-background/50 px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition";

interface Props {
  data: PatientWizardData;
  onChange: (patch: Partial<PatientWizardData>) => void;
}

export function ProfileStep({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These details help doctors provide more relevant care. Both fields are optional.
      </p>

      <Field label="Date of Birth">
        <input
          className={inputCls}
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
        />
      </Field>

      <Field label="Gender">
        <select
          className="w-full h-11 rounded-xl border border-input bg-background/50 px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          value={data.gender}
          onChange={(e) => onChange({ gender: e.target.value })}
        >
          <option value="">Prefer not to say</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
