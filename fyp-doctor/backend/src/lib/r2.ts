import { S3Client, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  const region = process.env.S3_REGION || 'auto'

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('S3 credentials not configured (S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY required)')
  }

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET_NAME
  if (!bucket) throw new Error('S3_BUCKET_NAME is not set')
  return bucket
}

export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, command, { expiresIn })
}

export async function getPresignedGetUrl(key: string, expiresIn = 900): Promise<string> {
  const client = getS3Client()
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key })
  return getSignedUrl(client, command, { expiresIn })
}

export async function headObject(key: string): Promise<boolean> {
  try {
    const client = getS3Client()
    await client.send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }))
    return true
  } catch {
    return false
  }
}

export async function deleteObject(key: string): Promise<void> {
  try {
    const client = getS3Client()
    await client.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }))
  } catch {
    // Best-effort cleanup — don't throw
  }
}

export function isR2Key(path: string): boolean {
  // Legacy local paths start with /uploads/; S3 keys do not
  return !path.startsWith('/uploads/')
}
