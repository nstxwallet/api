import {FastifyInstance} from "fastify";
import {PricesService} from "./PricesService";
import {PrismaClient} from "@prisma/client";
import {CoinMarketCapService} from "./CoinMarketCapService";
import {PricesController} from "./PricesController";

interface Init {
	fastify: FastifyInstance;
	prisma: PrismaClient;
}


export class PricesModule {
	public constructor(
		public readonly service: PricesService
	) {}

	public static async init(props: Init) {
		const coinMarketCapService = new CoinMarketCapService()
		const service = new PricesService(coinMarketCapService, props.prisma);
		// setInterval(async () => {
		// 	await service.updatePrices();
		// }, 1000 * 60 * 5);
		await service.updatePrices();
		const controller = new PricesController(props.fastify, service);
		controller.init();
	}
}
