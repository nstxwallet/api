-- Run once to add Telegram verification support.
-- Safe to re-run: uses IF NOT EXISTS where supported.

-- User: add telegram columns (PostgreSQL 9.5+)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramVerified" BOOLEAN NOT NULL DEFAULT false;

-- TelegramVerificationToken table
CREATE TABLE IF NOT EXISTS "TelegramVerificationToken" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(6) NOT NULL,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TelegramVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TelegramVerificationToken_token_key" ON "TelegramVerificationToken"("token");
CREATE INDEX IF NOT EXISTS "TelegramVerificationToken_userId_idx" ON "TelegramVerificationToken"("userId");
CREATE INDEX IF NOT EXISTS "TelegramVerificationToken_token_idx" ON "TelegramVerificationToken"("token");

-- FK (drop first so re-run is safe)
ALTER TABLE "TelegramVerificationToken" DROP CONSTRAINT IF EXISTS "TelegramVerificationToken_userId_fkey";
ALTER TABLE "TelegramVerificationToken" ADD CONSTRAINT "TelegramVerificationToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
