import type { PrismaClient } from "@prisma/client";

import type { BinanceExchangeService } from "./BinanceExchangeService.js";

export class BinanceService {
  constructor(
    private readonly exchangeService: BinanceExchangeService,
    private readonly prisma: PrismaClient,
  ) {}

  public async getTickerPrices() {
    return this.prisma.tickerPrice.findMany();
  }

  /** Refreshes every ticker Binance reports; callers decide how to surface failures. */
  public async updateTickerPrices(): Promise<number> {
    const tickers = await this.exchangeService.getAllTickerPrices();
    const updatedAt = new Date();

    await this.prisma.$transaction(
      tickers.map((ticker) => {
        const price = Number.parseFloat(ticker.price);
        return this.prisma.tickerPrice.upsert({
          where: { symbol: ticker.symbol },
          update: { price, updatedAt },
          create: { symbol: ticker.symbol, price, updatedAt },
        });
      }),
    );

    return tickers.length;
  }
}
