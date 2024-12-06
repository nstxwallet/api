import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { TransactionService } from "./TransactionService";
import { TransactionController } from "./TransactionController";

interface Init {
  fastify: FastifyInstance;
  prisma: PrismaClient;
}

export class TransactionModule {
  public constructor(public readonly service: TransactionService) {}
  public static async init(props: Init) {
    const service = new TransactionService(props.prisma);
    const controller = new TransactionController(props.fastify, service);
    controller.init();
  }
}
