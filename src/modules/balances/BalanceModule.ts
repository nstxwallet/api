import { BalanceService } from "./BalanceService.js";
import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client"
import { BalanceController } from "./BalanceController.js";
interface Init {
  fastify: FastifyInstance;
  prisma: PrismaClient;
}
export class BalanceModule {
  public constructor(public readonly service: BalanceService) {}
  public static async init(props: Init) {
    const service = new BalanceService(props.prisma);
    const controller = new BalanceController(props.fastify, service);
    controller.init();
    return new BalanceModule(service);
  }
}
