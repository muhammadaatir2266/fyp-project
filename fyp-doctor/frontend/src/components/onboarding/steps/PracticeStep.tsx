'use client'

import { Building2, DollarSign, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { WizardData } from '@/lib/onboarding'
import { GENDER_OPTIONS, LANGUAGE_OPTIONS } from '@/lib/onboarding'

interface Props {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
}

export function PracticeStep({ data, onChange }: Props) {
  const toggleLanguage = (lang: string) => {
    const next = data.languages.includes(lang)
      ? data.languages.filter((l) => l !== lang)
      : [...data.languages, lang]
    onChange({ languages: next })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Clinic / Hospital Name</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Aga Khan Hospital"
            value={data.clinicLocation}
            onChange={(e) => onChange({ clinicLocation: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address *</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="123 Main Street"
            value={data.address}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
        <Input
          placeholder="Karachi"
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Consultation Fee (PKR)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            type="number"
            min={0}
            placeholder="1500"
            value={data.consultationFee}
            onChange={(e) => onChange({ consultationFee: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                data.languages.includes(lang)
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
