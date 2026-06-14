'use client'

import { Input } from '@/components/ui/input'
import type { WizardData } from '@/lib/onboarding'
import { DAY_OPTIONS } from '@/lib/onboarding'

interface Props {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
}

export function AvailabilityStep({ data, onChange }: Props) {
  const toggleDay = (day: string) => {
    const next = data.workingDays.includes(day)
      ? data.workingDays.filter((d) => d !== day)
      : [...data.workingDays, day]
    onChange({ workingDays: next })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Working Days *</label>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                data.workingDays.includes(day)
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        {data.workingDays.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">Select at least one working day</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Available From</label>
          <Input
            type="time"
            value={data.availableFrom}
            onChange={(e) => onChange({ availableFrom: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Available To</label>
          <Input
            type="time"
            value={data.availableTo}
            onChange={(e) => onChange({ availableTo: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-sm text-teal-700">
        You can update your availability any time from your dashboard after your account is approved.
      </div>
    </div>
  )
}
