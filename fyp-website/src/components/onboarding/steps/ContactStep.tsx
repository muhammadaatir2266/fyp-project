"use client";

import type { PatientWizardData } from "@/lib/patient-onboarding";

const inputCls =
  "w-full h-11 rounded-xl border border-input bg-background/50 px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition";

interface Props {
  data: PatientWizardData;
  onChange: (patch: Partial<PatientWizardData>) => void;
}

export function ContactStep({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Phone Number" required>
        <input
          className={inputCls}
          type="tel"
          placeholder="+92 300 1234567"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
      </Field>

      <Field label="City" required hint="Used to find doctors near you">
        <input
          className={inputCls}
          placeholder="Karachi, Lahore, Islamabad…"
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          We use your city to show nearby doctors even before location access is granted.
        </p>
      </Field>

      <Field label="Home Address">
        <textarea
          rows={2}
          className="w-full rounded-xl border border-input bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
          placeholder="Street address (optional)"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
