'use client'

import Link from 'next/link'
import Image from 'next/image'
import { DoctorSignupWizard } from '@/components/onboarding/DoctorSignupWizard'

export default function SignupPage() {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
        <Link href={websiteUrl} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">DocLink</span>
        </Link>
        <span className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-600 font-medium hover:underline">
            Sign in
          </Link>
        </span>
      </header>

      <main className="py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join DocLink as a Doctor</h1>
            <p className="text-gray-500">
              Complete the steps below to apply for your practitioner account. Once your documents
              are verified, you&apos;ll be able to accept appointments.
            </p>
          </div>

          <DoctorSignupWizard />

          <p className="text-center text-xs text-gray-400 mt-6">
            By submitting this form you agree to DocLink&apos;s{' '}
            <Link href={`${websiteUrl}/terms`} className="underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href={`${websiteUrl}/privacy`} className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
