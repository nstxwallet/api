import { BalanceService } from "./BalanceService";
import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client"
import { BalanceController } from "./BalanceController";
interface Init {
  fastify: FastifyInstance;
  prisma: PrismaClient;
}
export class BalanceModule {
  public constructor(public readonly service: BalanceService) {}
  public static async Init(props: Init) {
    const service = new BalanceService(props.prisma);
    const controller = new BalanceController(props.fastify, service);
    controller.init();
    return new BalanceModule(service);
  }
}
