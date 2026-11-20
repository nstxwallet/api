-- Telegram verification state moves from Redis into Postgres.
-- TelegramVerificationToken already exists; only the sweep index is missing.

-- CreateTable
CREATE TABLE "TelegramVerificationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramVerificationCode_code_key" ON "TelegramVerificationCode"("code");

-- CreateIndex
CREATE INDEX "TelegramVerificationCode_userId_idx" ON "TelegramVerificationCode"("userId");

-- CreateIndex
CREATE INDEX "TelegramVerificationCode_expiresAt_idx" ON "TelegramVerificationCode"("expiresAt");

-- CreateIndex
CREATE INDEX "TelegramVerificationToken_expiresAt_idx" ON "TelegramVerificationToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "TelegramVerificationCode" ADD CONSTRAINT "TelegramVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
