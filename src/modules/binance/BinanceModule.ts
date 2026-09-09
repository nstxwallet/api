import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

import { BinanceController } from "./BinanceController.js";
import { BinanceExchangeService } from "./BinanceExchangeService.js";
import { BinanceService } from "./BinanceService.js";

interface InitProps {
  fastify: FastifyInstance;
  prisma: PrismaClient;
}

export class BinanceModule {
  public constructor(public readonly service: BinanceService) {}

  /** Registers the routes only; price refreshing is scheduled by the caller. */
  public static async init(props: InitProps): Promise<BinanceModule> {
    const service = new BinanceService(new BinanceExchangeService(), props.prisma);
    new BinanceController(props.fastify, service).init();
    return new BinanceModule(service);
  }
}
