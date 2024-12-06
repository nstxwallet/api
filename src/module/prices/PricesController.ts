import { FastifyInstance } from "fastify";
import { PricesService } from "./PricesService";

export class PricesController {
  constructor(
    private readonly fastify: FastifyInstance,
    public readonly service: PricesService
  ) {}

  init(): void {
    this.fastify.get("/prices", async (_req, reply) => {
      const prices = await this.service.getAll();
      reply.send(prices);
    });
  }
}
