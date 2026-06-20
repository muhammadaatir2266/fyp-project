import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

/** Load .env before any other module reads process.env (import this file first in index.ts). */
function loadEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ]

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath })
      return
    }
  }

  // Railway / Docker inject vars directly; no .env file needed
  dotenv.config()
}

loadEnv()
