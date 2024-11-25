import { FastifyInstance } from "fastify";
import { BalanceService } from "./BalanceService";
import { onRequestAuth } from "../../hooks/onRequestAuth";
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
      { onRequest: onRequestAuth },
      async (req, reply) => {
        const balances = await this.service.getAll({ userId: req.user.id });
        return reply.send(balances);
      }
    );
    this.fastify.get<{
      Params: { id: string };
    }>("/balances/:id", { onRequest: onRequestAuth }, async (req, reply) => {
      const balance = await this.service.getOne({
        id: req.params.id,
        userId: req.user.id,
      });
      return reply.send(balance);
    });

    this.fastify.post<{ Body: { currency: Currency } }>(
      "/balances/create",
      { onRequest: onRequestAuth },
      async (req, reply) => {
        const balance = await this.service.create({
          userId: req.user.id,
          currency: req.body.currency,
        });
        return reply.send(balance);
      }
    );
  }
}
