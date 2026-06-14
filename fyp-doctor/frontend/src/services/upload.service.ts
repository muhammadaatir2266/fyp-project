import type { DocumentType, UploadedDocument } from '@/lib/onboarding'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export async function presignAndUpload(
  file: File,
  documentType: DocumentType,
  uploadSessionId: string
): Promise<UploadedDocument> {
  // 1. Get presigned PUT URL from backend
  const presignRes = await fetch(`${API_URL}/auth/documents/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadSessionId,
      documentType,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || 'Failed to get upload URL')
  }

  const { uploadUrl, s3Key } = (await presignRes.json()) as { uploadUrl: string; s3Key: string }

  // 2. PUT file directly to R2
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

  if (!putRes.ok) {
    throw new Error('Failed to upload file to storage')
  }

  return {
    type: documentType,
    s3Key,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  }
}
