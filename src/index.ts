import pino from "pino";
import FastifyCookie from "@fastify/cookie";
import FastifyCors from "@fastify/cors";
import FastifyFormBody from "@fastify/formbody";
import FastifyJwt from "@fastify/jwt";
import Fastify, {FastifyBaseLogger} from "fastify";
import fastifyCron from "fastify-cron";

import {UsersModule} from "./module/users";
import {PrismaClient} from "@prisma/client";
import {BalanceModule} from "./module/balances";
import {TransactionModule} from "./module/transactions";
import {PricesModule} from "./module/prices";
import {SendGridModule} from "./module/sendgrid";

async function start() {
  const port = process.env.PORT || 8000;

  const logger = pino();
  const fastify = Fastify({
    logger: logger as FastifyBaseLogger,
  });
  const sendgrid = require("@sendgrid/mail");

  const prisma = new PrismaClient();

  await fastify.register(FastifyJwt, {
    secret: "supersecret",
    cookie: {
      cookieName: "token",
      signed: false,
    },
    decode: {
      complete: true,
    },
  });
  await fastify.register(FastifyCookie, {});
  await fastify.register(FastifyFormBody);
  await fastify.register(FastifyCors, {
    origin: "http://localhost:3000",
    credentials: true,
  });

  await fastify.register(fastifyCron, {
    jobs: [
      {
        cronTime: "0 * * * *",
        onTick: async () => {
          try {
            const result = await prisma.resetPasswordToken.deleteMany({
              where: {
                createdAt: {
                  lte: new Date(Date.now() - 1000 * 60 * 60),
                },
              },
            });
          } catch (error) {
            console.error("Error deleting expired tokens:", error);
          }
        },
      },
    ],
  });

  const _sendGridModule = await SendGridModule.init({fastify, prisma});
  const _usersModule = await UsersModule.init({fastify, prisma});
  const _balanceModule = await BalanceModule.Init({fastify, prisma});
  const _transactionModule = await TransactionModule.init({fastify, prisma});
  const _pricesModule = await PricesModule.init({fastify, prisma});

  fastify.setNotFoundHandler((_req, reply) => {
    return reply.send("Not Found");
  });

  fastify.get("/", async (_req, reply) => {
    return reply.send("Hello World");
  });

  fastify.listen(process.env.PORT as string, '0.0.0.0', function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`Server listening on ${address}`);
  });}


void start();
