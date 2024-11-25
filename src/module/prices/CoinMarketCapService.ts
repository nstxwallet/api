import { Currency } from "@prisma/client";
import axios from "axios";

export class CoinMarketCapService {
  readonly coinMarketCapCurrencies: Record<number, Currency> = {
    1: Currency.BNB,
    1027: Currency.BTC,
    825: Currency.USDT,
    2010: Currency.ETH,
    74: Currency.DASH,
    52: Currency.XMR,
    1831: Currency.BCH,
    2: Currency.LTC,
    512: Currency.XRP,
    2011: Currency.XLM,
    1975: Currency.SOL,
    1958: Currency.DOT,
    1839: Currency.LINK,
    8916: Currency.CAKE,
    4687: Currency.CRO,
    3717: Currency.UNI,
    7083: Currency.AAVE
  };

  public async getPrices(): Promise<
    Array<{
      currency: Currency;
      value: number;
      updatedAt: Date;
    }>
  > {
    const response = await axios.get<{
      data: Record<
        string,
        {
          id: number;
          name: string;
          symbol: string;
          quote: {
            USD: {
              price: number;
              percent_change_24h: number;
              market_cap: number;
            };
          };
        }
      >;
    }>(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${Object.keys(
        this.coinMarketCapCurrencies
      ).join(",")}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": "6f4ce433-b481-4c80-86ab-559e330d3a56"
        }
      }
    );
    return Object.values(response.data.data).map(data => ({
      currency: this.coinMarketCapCurrencies[data.id],
      value: data.quote.USD.price,
      updatedAt: new Date()
    }));
  }
}