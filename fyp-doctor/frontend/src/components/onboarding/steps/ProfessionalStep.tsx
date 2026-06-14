'use client'

import { Award, FileText, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import type { WizardData } from '@/lib/onboarding'

interface Specialty {
  id: string
  name: string
}

interface Props {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export function ProfessionalStep({ data, onChange }: Props) {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/auth/specialties`)
      .then((r) => r.json())
      .then((d) => setSpecialties(d.specialties ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Medical Specialty *</label>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm h-10">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading specialties…
          </div>
        ) : (
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            value={data.specialtyId}
            onChange={(e) => onChange({ specialtyId: e.target.value })}
          >
            <option value="">Select specialty</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number *</label>
        <div className="relative">
          <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="e.g. PMC-12345"
            value={data.licenseNumber}
            onChange={(e) => onChange({ licenseNumber: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience</label>
        <Input
          type="number"
          min={0}
          placeholder="0"
          value={data.experience || ''}
          onChange={(e) => onChange({ experience: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Qualifications</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <textarea
            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            rows={3}
            placeholder="MBBS, FCPS, MD…"
            value={data.qualifications}
            onChange={(e) => onChange({ qualifications: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
