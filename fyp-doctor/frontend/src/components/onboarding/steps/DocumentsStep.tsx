'use client'

import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import type { DocumentType, UploadedDocument, WizardData } from '@/lib/onboarding'
import { DOC_TYPE_LABELS } from '@/lib/onboarding'
import { presignAndUpload } from '@/services/upload.service'

interface Props {
  data: WizardData
  uploadSessionId: string
  onChange: (patch: Partial<WizardData>) => void
}

const DOCUMENT_SLOTS: { type: DocumentType; required: boolean }[] = [
  { type: 'MEDICAL_LICENSE', required: true },
  { type: 'DEGREE_CERTIFICATE', required: false },
  { type: 'GOVERNMENT_ID', required: false },
]

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SIZE = 5 * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsStep({ data, uploadSessionId, onChange }: Props) {
  const [uploadingTypes, setUploadingTypes] = useState<Set<DocumentType>>(new Set())
  const [errors, setErrors] = useState<Partial<Record<DocumentType, string>>>({})
  const inputRefs = useRef<Partial<Record<DocumentType, HTMLInputElement | null>>>({})

  const getDoc = (type: DocumentType) => data.documents.find((d) => d.type === type)

  const handleFile = async (type: DocumentType, file: File) => {
    setErrors((e) => ({ ...e, [type]: undefined }))

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, [type]: 'Only PDF, JPG, and PNG files are allowed' }))
      return
    }
    if (file.size > MAX_SIZE) {
      setErrors((e) => ({ ...e, [type]: 'File must be less than 5 MB' }))
      return
    }

    setUploadingTypes((prev) => new Set([...prev, type]))
    try {
      const uploaded = await presignAndUpload(file, type, uploadSessionId)
      const nextDocs = [
        ...data.documents.filter((d) => d.type !== type),
        uploaded,
      ]
      onChange({ documents: nextDocs })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setErrors((e) => ({ ...e, [type]: msg }))
    } finally {
      setUploadingTypes((prev) => {
        const next = new Set(prev)
        next.delete(type)
        return next
      })
    }
  }

  const removeDoc = (type: DocumentType) => {
    onChange({ documents: data.documents.filter((d) => d.type !== type) })
    if (inputRefs.current[type]) {
      inputRefs.current[type]!.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Upload your verification documents. Only the medical license is required; others are optional
        but help speed up approval.
      </p>

      {DOCUMENT_SLOTS.map(({ type, required }) => {
        const doc = getDoc(type)
        const uploading = uploadingTypes.has(type)
        const error = errors[type]

        return (
          <div
            key={type}
            className={`border-2 border-dashed rounded-xl p-5 transition-colors ${
              doc ? 'border-teal-300 bg-teal-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {DOC_TYPE_LABELS[type]}
                {required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {!required && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              )}
            </div>

            {doc ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-teal-700">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[220px]">{doc.fileName}</span>
                  <span className="text-teal-500 shrink-0">({formatBytes(doc.fileSize)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeDoc(type)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  ref={(el) => { inputRefs.current[type] = el }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(type, file)
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => inputRefs.current[type]?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? 'Uploading…' : 'Choose file'}
                </button>
                <span className="text-xs text-gray-400">PDF, JPG, PNG · max 5 MB</span>
              </div>
            )}

            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
        )
      })}
    </div>
  )
}
