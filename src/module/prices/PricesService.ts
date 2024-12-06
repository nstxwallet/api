import { Currency, PrismaClient } from "@prisma/client";
import { CoinMarketCapService } from "./CoinMarketCapService";

export class PricesService {
  constructor(
    private readonly coinMarketCapService: CoinMarketCapService,
    private readonly prisma: PrismaClient
  ) {}

  public async updatePrices(): Promise<void> {
    try {
      const prices = await this.coinMarketCapService.getPrices();
      await this.prisma.price.createMany({
        data: prices.map(price => ({
          currency: price.currency,
          value: price.value,
          updatedAt: price.updatedAt
        }))
      });
    } catch (error) {
      console.error("Error updating prices:", error);
    }
    if ((await this.prisma.price?.count()) > 1000) {
      await this.prisma.price.deleteMany({
        where: {
          updatedAt: {
            lte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24)
          }
        }
      });
    }
  }

  public async getAll(): Promise<
    | {
        currency: Currency;
        value: number;
        updatedAt: Date;
      }[]
    | null
  > {
    try {
      const prices = await this.prisma.price.findMany({
        orderBy: {
          updatedAt: "desc"
        }
      });
      const groupedPrices = prices.reduce(
        (acc, price) => {
          if (
            !acc[price.currency] ||
            acc[price.currency].updatedAt < price.updatedAt
          ) {
            acc[price.currency] = price;
          }
          return acc;
        },
        {} as Record<
          Currency,
          {
            currency: Currency;
            value: number;
            updatedAt: Date;
          }
        >
      );

      return Object.keys(groupedPrices).map(currency => ({
        currency: currency as Currency,
        value: groupedPrices[currency as Currency].value,
        updatedAt: groupedPrices[currency as Currency].updatedAt
      }));
    } catch (error) {
      console.error("Error fetching prices:", error);
      return [];
    }
  }
}
