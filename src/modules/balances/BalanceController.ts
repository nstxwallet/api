import { FastifyInstance } from "fastify";
import { BalanceService } from "./BalanceService.js";

import { $Enums } from  "@prisma/client";
import Currency = $Enums.Currency;

export class BalanceController {
  constructor(
    private readonly fastify: FastifyInstance,
    public readonly service: BalanceService
  ) {}

  init(): void {
    this.fastify.get(
      "/balances",
      { preHandler: [this.fastify.authenticate] },
      async (req, reply) => {
        const balances = await this.service.getAll({ userId: req.user.sub });
        return reply.send(balances);
      }
    );
    this.fastify.get<{
      Params: { id: string };
    }>("/balances/:id", { preHandler: [this.fastify.authenticate] }, async (req, reply) => {
      const balance = await this.service.getOne({
        id: req.params.id,
        userId: req.user.sub,
      });
      return reply.send(balance);
    });

    this.fastify.post<{ Body: { currency: Currency } }>(
      "/balances/create",
      { preHandler: [this.fastify.authenticate] },
      async (req, reply) => {
        const balance = await this.service.create({
          userId: req.user.sub,
          currency: req.body.currency,
        });
        return reply.send(balance);
      }
    );
  }
}
