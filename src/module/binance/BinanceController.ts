import {FastifyInstance} from "fastify";
import {BinanceService} from "./BinanceService";

export class BinanceController {
    constructor(
        private readonly fastify: FastifyInstance,
        private readonly service: BinanceService
    ) {
    }

    public init() {
        this.fastify.get('/prices', async (_req, reply) => {
            const data = await this.service.getTickerPrices()
            reply.send(data);
        });
    }
}

