import {BinanceExchangeService} from "./BinanceExchangeService";
import {PrismaClient} from "@prisma/client";

export class BinanceService {
    constructor(private readonly binanceExchangeService: BinanceExchangeService, private readonly prisma: PrismaClient) {}

    public async updatePrices() {
        try {
            console.log("Start update prices:", new Date().toISOString());
            await this.updateTickerPrices();
        } catch (error) {
            console.error("Error updating prices", error);
        }
    }

    public async getTickerPrices() {
        return this.prisma.tickerPrice.findMany();
    }

    public startAutoUpdate(intervalMs: number) {
        setInterval(() => {
            this.updatePrices().then(r => r);
        }, intervalMs);
        this.updatePrices().then(r => r);
    }

    public async updateTickerPrices() {
        try {
            const ticker = await this.binanceExchangeService.getAllTickerPrices();
            const tickerData = ticker.map((ticker) => ({
                symbol: ticker.symbol, price: parseFloat(ticker.price), updatedAt: new Date(),
            }))
            await this.prisma.tickerPrice.createMany({
                data: tickerData, skipDuplicates: true,
            });
            console.log(`${tickerData.length} prices added`);
        } catch (error) {
            console.error("Error updating prices", error);
        }
    }

}

