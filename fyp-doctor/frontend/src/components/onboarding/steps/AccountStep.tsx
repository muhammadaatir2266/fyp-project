'use client'

import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import type { WizardData } from '@/lib/onboarding'

interface Props {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
}

export function AccountStep({ data, onChange }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="John"
              value={data.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Smith"
              value={data.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            type="email"
            placeholder="doctor@example.com"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="+92 300 1234567"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 pr-10"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 6 characters"
            value={data.password}
            onChange={(e) => onChange({ password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 pr-10"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={data.confirmPassword}
            onChange={(e) => onChange({ confirmPassword: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {data.password && data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
        )}
      </div>
    </div>
  )
}
