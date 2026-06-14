'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountStep } from './steps/AccountStep'
import { ProfessionalStep } from './steps/ProfessionalStep'
import { PracticeStep } from './steps/PracticeStep'
import { DocumentsStep } from './steps/DocumentsStep'
import { AvailabilityStep } from './steps/AvailabilityStep'
import { ReviewStep } from './steps/ReviewStep'
import {
  INITIAL_WIZARD_DATA,
  STEP_TITLES,
  validateStep,
  type WizardData,
} from '@/lib/onboarding'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

interface Specialty { id: string; name: string }

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export function DoctorSignupWizard() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA)
  const [stepError, setStepError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [specialties, setSpecialties] = useState<Specialty[]>([])

  // Stable session ID for this wizard instance
  const uploadSessionId = useRef(crypto.randomUUID())

  useEffect(() => {
    fetch(`${API_URL}/auth/specialties`)
      .then((r) => r.json())
      .then((d) => setSpecialties(d.specialties ?? []))
      .catch(() => {})
  }, [])

  const patch = (update: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...update }))
    setStepError(null)
  }

  const goTo = (next: number) => {
    const err = validateStep(step, data)
    if (next > step && err) {
      setStepError(err)
      return
    }
    setStepError(null)
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const handleSubmit = async () => {
    const err = validateStep(step, data)
    if (err) { setStepError(err); return }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          specialtyId: data.specialtyId,
          licenseNumber: data.licenseNumber,
          experience: data.experience,
          qualifications: data.qualifications || undefined,
          clinicLocation: data.clinicLocation || undefined,
          address: data.address,
          city: data.city,
          consultationFee: data.consultationFee ? parseFloat(data.consultationFee) : undefined,
          gender: data.gender || undefined,
          languages: data.languages,
          workingDays: data.workingDays,
          availableFrom: data.availableFrom || undefined,
          availableTo: data.availableTo || undefined,
          uploadSessionId: uploadSessionId.current,
          documents: data.documents,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(body.message || 'Signup failed')
      }

      setSubmitted(true)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-teal-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Application Submitted!</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Thank you for registering. Our team will review your documents and activate your account
          within 1–2 business days. You&apos;ll receive an email once approved.
        </p>
      </div>
    )
  }

  const isLastStep = step === STEP_TITLES.length - 1

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEP_TITLES.map((title, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              {/* Circle */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => i < step && goTo(i)}
                  disabled={i >= step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    i < step
                      ? 'bg-teal-600 border-teal-600 text-white cursor-pointer'
                      : i === step
                      ? 'bg-white border-teal-600 text-teal-600'
                      : 'bg-gray-50 border-gray-200 text-gray-400 cursor-default'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </button>
                <span
                  className={`text-[10px] font-medium hidden sm:block ${
                    i === step ? 'text-teal-600' : i < step ? 'text-gray-500' : 'text-gray-300'
                  }`}
                >
                  {title}
                </span>
              </div>
              {/* Connector */}
              {i < STEP_TITLES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors ${
                    i < step ? 'bg-teal-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Step {step + 1}: {STEP_TITLES[step]}
          </h2>
        </div>

        <div className="px-6 py-6 min-h-[380px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {step === 0 && <AccountStep data={data} onChange={patch} />}
              {step === 1 && <ProfessionalStep data={data} onChange={patch} />}
              {step === 2 && <PracticeStep data={data} onChange={patch} />}
              {step === 3 && (
                <DocumentsStep
                  data={data}
                  uploadSessionId={uploadSessionId.current}
                  onChange={patch}
                />
              )}
              {step === 4 && <AvailabilityStep data={data} onChange={patch} />}
              {step === 5 && <ReviewStep data={data} specialties={specialties} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error */}
        {(stepError || submitError) && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {stepError ?? submitError}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => goTo(step + 1)}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
