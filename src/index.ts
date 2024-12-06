import pino from "pino";
import FastifyCookie from "@fastify/cookie";
import FastifyCors from "@fastify/cors";
import FastifyFormBody from "@fastify/formbody";
import FastifyJwt from "@fastify/jwt";
import Fastify, {FastifyBaseLogger} from "fastify";

import {BalanceModule, BinanceModule, SendGridModule, TransactionModule, UsersModule} from "./module"
import {PrismaClient} from "@prisma/client";

async function start() {

  const logger = pino({
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });
  const prisma = new PrismaClient();

  const fastify = Fastify({
    logger : true
  })

  const sendgrid = require("@sendgrid/mail")

  await fastify.register(FastifyJwt, {
    secret: process.env.JWT_SECRET as string,
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
  })

  const _usersModule = await UsersModule.init({fastify, prisma});
  const _balanceModule = await BalanceModule.init({fastify, prisma});
  const _transactionModule = await TransactionModule.init({fastify, prisma});
  const _sendGridModule = await SendGridModule.init({fastify, prisma});
  const _binanceController = await BinanceModule.init({fastify, prisma})

  fastify.setNotFoundHandler((_req, reply) => {
    return reply.send("Not Found");
  });

  fastify.get("/", async (_req, reply) => {
    return reply.send("Hello World");
  });

  fastify.listen({port: 8000}, (err) => {
    if (err) throw err
  });
}

start();

// fastify.listen(process.env.PORT as string, '0.0.0.0', function (err, address) {
//   if (err) {
//     fastify.log.error(err);
//     process.exit(1);
//   }
//   fastify.log.info(`Server listening on ${address}`);
// });}
