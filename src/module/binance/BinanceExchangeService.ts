import axios from "axios";

interface TickerPrice {
    symbol: string;
    price: string;
}

export class BinanceExchangeService {

    public async getAllTickerPrices(): Promise<TickerPrice[]> {
        const response = await axios.get<TickerPrice[]>(`https://api.binance.com/api/v3/ticker/price`);
        return response.data;
    }
    // public async getRecentTrades(symbol: string): Promise<Array<{
    //     id: number; price: string; qty: string; time: number; isBuyerMaker: boolean; isBestMatch: boolean;
    // }>> {
    //     const response = await axios.get(`https://api.binance.com/api/v3/trades?symbol=${symbol}`);
    //     return response.data;
    // }
    //
    // public async getKlinesData(symbol: string, interval: string): Promise<Array<{
    //     openTime: number;
    //     open: string;
    //     high: string;
    //     low: string;
    //     close: string;
    //     volume: string;
    //     closeTime: number;
    //     quoteAssetVolume: string;
    //     numberOfTrades: number;
    //     takerBuyBaseAssetVolume: string;
    //     takerBuyQuoteAssetVolume: string;
    // }>> {
    //     const response = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}`);
    //     return response.data;
    // }
}