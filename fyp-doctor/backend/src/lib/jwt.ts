import jwt from 'jsonwebtoken'

const DEFAULT_SECRET = 'your-secret-key-change-in-production'

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_SECRET) {
    console.error('FATAL: JWT_SECRET must be set to a strong secret in production.')
    process.exit(1)
  }
}

const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JwtPayload {
  userId: string
  role: string
}

export const generateToken = (payload: JwtPayload): string => {
  // @ts-ignore - TypeScript has issues with jwt.sign overload resolution for string expiresIn
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    throw new Error('Invalid or expired token')
  }
}
