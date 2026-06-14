'use client'

import { FileText } from 'lucide-react'
import type { WizardData } from '@/lib/onboarding'
import { DOC_TYPE_LABELS } from '@/lib/onboarding'

interface Specialty {
  id: string
  name: string
}

interface Props {
  data: WizardData
  specialties: Specialty[]
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-sm">
      <span className="text-gray-500 sm:w-36 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}

export function ReviewStep({ data, specialties }: Props) {
  const specialtyName = specialties.find((s) => s.id === data.specialtyId)?.name ?? '—'

  return (
    <div className="space-y-6 text-sm">
      {/* Personal */}
      <Section title="Personal Information">
        <Row label="Name" value={`${data.firstName} ${data.lastName}`} />
        <Row label="Email" value={data.email} />
        <Row label="Phone" value={data.phone} />
      </Section>

      {/* Professional */}
      <Section title="Professional Details">
        <Row label="Specialty" value={specialtyName} />
        <Row label="License No." value={data.licenseNumber} />
        <Row label="Experience" value={data.experience ? `${data.experience} years` : '0 years'} />
        {data.qualifications && <Row label="Qualifications" value={data.qualifications} />}
      </Section>

      {/* Practice */}
      <Section title="Practice">
        {data.clinicLocation && <Row label="Clinic / Hospital" value={data.clinicLocation} />}
        <Row label="Address" value={data.address} />
        <Row label="City" value={data.city} />
        {data.consultationFee && <Row label="Fee (PKR)" value={data.consultationFee} />}
        {data.gender && <Row label="Gender" value={data.gender} />}
        {data.languages.length > 0 && <Row label="Languages" value={data.languages.join(', ')} />}
      </Section>

      {/* Documents */}
      <Section title="Uploaded Documents">
        {data.documents.length === 0 ? (
          <p className="text-gray-400 italic">No documents uploaded</p>
        ) : (
          <ul className="space-y-1.5">
            {data.documents.map((doc) => (
              <li key={doc.s3Key} className="flex items-center gap-2 text-teal-700">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="font-medium">{DOC_TYPE_LABELS[doc.type]}</span>
                <span className="text-gray-400 truncate">— {doc.fileName}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Availability */}
      <Section title="Availability">
        {data.workingDays.length > 0 ? (
          <Row label="Working Days" value={data.workingDays.map((d) => d.slice(0, 3)).join(', ')} />
        ) : (
          <p className="text-gray-400 italic">No working days selected</p>
        )}
        {data.availableFrom && <Row label="Hours" value={`${data.availableFrom} – ${data.availableTo}`} />}
      </Section>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-700 text-sm">
        By submitting, you confirm all information is accurate. Your account will be reviewed by an
        admin before activation.
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-3 pb-2 border-b">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
