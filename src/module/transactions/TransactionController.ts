import { TransactionService } from "./TransactionService";
import { FastifyInstance } from "fastify";
import { onRequestAuth } from "../../hooks/onRequestAuth";
import { Currency, TransactionStatus, TransactionType } from "@prisma/client";

export class TransactionController {
  constructor(
    private readonly fastify: FastifyInstance,
    public readonly service: TransactionService
  ) {}

  init(): void {
    this.fastify.get<{
      Querystring: {
        currencies: Currency[];
        statuses: TransactionStatus[];
        types: TransactionType[];
      };
    }>("/transactions", { onRequest: onRequestAuth }, async (req, reply) => {
      const transactions = await this.service.getAll({
        userId: req.user.id,
        currencies: req.query.currencies,
        statuses: req.query.statuses,
        types: req.query.types
      });
      return reply.send(transactions);
    });

    this.fastify.get<{
      Params: { id: string };
    }>("/transaction/:id", { onRequest: onRequestAuth }, async (req, reply) => {
      const transaction = await this.service.getById(req.params.id);
      if (!transaction) {
        return reply
          .status(400)
          .send({ success: false, message: "Transaction not found" });
      }
      return reply.send(transaction);
    });

    this.fastify.get<{
      Params: { currency: Currency };
    }>("/transactions/currency/:currency", { onRequest: onRequestAuth }, async (req, reply) => {
      const transactions = await this.service.getForCurrency({
        userId: req.user.id,
        currency: req.params.currency
      });
      return reply.send(transactions);
    });


    this.fastify.post<{
      Body: {
        amount: number;
        currency: Currency;
        userId: string;
        receiverId: string;
      };
    }>(
      "/transactions/transfer",
      { onRequest: onRequestAuth },
      async (req, reply) => {
        const transaction = await this.service.transfer({
          senderId: req.user.id,
          receiverId: req.body.receiverId,
          amount: req.body.amount,
          currency: req.body.currency
        });
        return reply.send(transaction);
      }
    );
  }
}

