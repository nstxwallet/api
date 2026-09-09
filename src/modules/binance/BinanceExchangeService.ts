/** Public Binance endpoint; no API key required. */
const TICKER_PRICE_URL = "https://api.binance.com/api/v3/ticker/price";

interface BinanceTickerPrice {
  symbol: string;
  /** Binance returns prices as strings to avoid float rounding on the wire. */
  price: string;
}

export class BinanceExchangeService {
  /** Throws when Binance is unreachable or answers with a non-2xx status. */
  public async getAllTickerPrices(): Promise<BinanceTickerPrice[]> {
    const response = await fetch(TICKER_PRICE_URL);
    if (!response.ok) {
      throw new Error(`Binance ticker request failed with status ${response.status}`);
    }
    return (await response.json()) as BinanceTickerPrice[];
  }
}
