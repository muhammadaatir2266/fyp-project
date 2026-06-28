-- Add tokenHash column for secure API token lookup (SHA-256 hash of raw token)
-- Existing tokens retain their plaintext token field; only new tokens created after this
-- migration will have tokenHash set and will be looked up securely.
ALTER TABLE "ApiToken" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT UNIQUE;
