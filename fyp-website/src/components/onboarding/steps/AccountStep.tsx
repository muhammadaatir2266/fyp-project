"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { PatientWizardData } from "@/lib/patient-onboarding";

const inputCls =
  "w-full h-11 rounded-xl border border-input bg-background/50 px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition";

interface Props {
  data: PatientWizardData;
  onChange: (patch: Partial<PatientWizardData>) => void;
}

export function AccountStep({ data, onChange }: Props) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" required>
          <input
            className={inputCls}
            placeholder="Jane"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
          />
        </Field>
        <Field label="Last Name" required>
          <input
            className={inputCls}
            placeholder="Doe"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Email Address" required>
        <input
          className={inputCls}
          type="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </Field>

      <Field label="Password" required hint="Minimum 6 characters">
        <div className="relative">
          <input
            className={inputCls + " pr-10"}
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={data.password}
            onChange={(e) => onChange({ password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      <Field label="Confirm Password" required>
        <div className="relative">
          <input
            className={inputCls + " pr-10"}
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            value={data.confirmPassword}
            onChange={(e) => onChange({ confirmPassword: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {data.password && data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
        )}
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
