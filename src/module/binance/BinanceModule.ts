import {FastifyInstance} from "fastify";
import {PrismaClient} from "@prisma/client";

import {BinanceService} from "./BinanceService";
import {BinanceExchangeService} from "./BinanceExchangeService";
import {BinanceController} from "./BinanceController";

interface InitProps {
    fastify: FastifyInstance;
    prisma: PrismaClient;
}

export class BinanceModule {
    public static async init(props: InitProps) {
        const binanceExchangeService = new BinanceExchangeService();
        const binanceService = new BinanceService(binanceExchangeService, props.prisma);
        binanceService.startAutoUpdate(1000 * 60 * 60);
        const controller = new BinanceController(props.fastify, binanceService);
        controller.init();
    }
}