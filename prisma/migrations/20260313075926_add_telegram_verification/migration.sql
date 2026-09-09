-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegramId" TEXT,
ADD COLUMN     "telegramVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TelegramVerificationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResetPasswordToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResetPasswordToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cryptocurrency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cmc_rank" INTEGER,
    "num_market_pairs" INTEGER,
    "circulating_supply" DOUBLE PRECISION,
    "total_supply" DOUBLE PRECISION,
    "max_supply" DOUBLE PRECISION,
    "infinite_supply" BOOLEAN,
    "last_updated" TIMESTAMP(3),
    "date_added" TIMESTAMP(3),
    "tags" JSONB,
    "platform" TEXT,

    CONSTRAINT "Cryptocurrency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptocurrencyQuote" (
    "id" SERIAL NOT NULL,
    "cryptocurrencyId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "volume_24h" DOUBLE PRECISION,
    "volume_change_24h" DOUBLE PRECISION,
    "percent_change_1h" DOUBLE PRECISION,
    "percent_change_24h" DOUBLE PRECISION,
    "percent_change_7d" DOUBLE PRECISION,
    "market_cap" DOUBLE PRECISION,
    "market_cap_dominance" DOUBLE PRECISION,
    "fully_diluted_market_cap" DOUBLE PRECISION,
    "last_updated" TIMESTAMP(3),

    CONSTRAINT "CryptocurrencyQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TickerPrice" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TickerPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kline" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "closePrice" DOUBLE PRECISION NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "highPrice" DOUBLE PRECISION NOT NULL,
    "isFinal" BOOLEAN NOT NULL,
    "lowPrice" DOUBLE PRECISION NOT NULL,
    "numberOfTrades" INTEGER NOT NULL,
    "openPrice" DOUBLE PRECISION NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "quoteVolume" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Kline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramVerificationToken_token_key" ON "TelegramVerificationToken"("token");

-- CreateIndex
CREATE INDEX "TelegramVerificationToken_userId_idx" ON "TelegramVerificationToken"("userId");

-- CreateIndex
CREATE INDEX "TelegramVerificationToken_token_idx" ON "TelegramVerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ResetPasswordToken_token_key" ON "ResetPasswordToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TickerPrice_symbol_key" ON "TickerPrice"("symbol");

-- CreateIndex
CREATE INDEX "Kline_symbol_openTime_idx" ON "Kline"("symbol", "openTime");

-- CreateIndex
CREATE INDEX "Balance_userId_idx" ON "Balance"("userId");

-- AddForeignKey
ALTER TABLE "TelegramVerificationToken" ADD CONSTRAINT "TelegramVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResetPasswordToken" ADD CONSTRAINT "ResetPasswordToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CryptocurrencyQuote" ADD CONSTRAINT "CryptocurrencyQuote_cryptocurrencyId_fkey" FOREIGN KEY ("cryptocurrencyId") REFERENCES "Cryptocurrency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
