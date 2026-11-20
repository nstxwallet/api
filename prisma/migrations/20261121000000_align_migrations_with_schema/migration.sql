-- Brings the migration history in line with schema.prisma, which drifted while
-- environments were managed with `prisma db push`.

-- Market-data tables from the first migration are not in the schema or the code.
DROP TABLE IF EXISTS "CryptocurrencyQuote";
DROP TABLE IF EXISTS "Cryptocurrency";
DROP TABLE IF EXISTS "Kline";

-- The schema and code use telegramChatId; rename to keep any stored chat ids.
ALTER TABLE "User" RENAME COLUMN "telegramId" TO "telegramChatId";

-- CreateIndex
CREATE UNIQUE INDEX "Balance_userId_currency_key" ON "Balance"("userId", "currency");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
